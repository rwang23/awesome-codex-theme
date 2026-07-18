use std::{
    fs,
    net::TcpStream,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant},
};

use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use reqwest::Url;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};
use tungstenite::{Message, WebSocket, connect, stream::MaybeTlsStream};

use crate::{
    catalog::{self, Catalog, FullSkinDescriptor},
    platform,
};

const RUNTIME_CSS: &str = include_str!("../../../../packages/full-skin/runtime.css");
const RUNTIME_JS: &str = include_str!("../../../../packages/full-skin/runtime.js");
const RUNTIME_FORMAT: &str = "act-full-skin-v1";
const MAX_ART_BYTES: usize = 16 * 1024 * 1024;
const APPLY_TIMEOUT: Duration = Duration::from_secs(45);
const CDP_CALL_TIMEOUT: Duration = Duration::from_secs(20);
const CDP_CLEANUP_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkinRuntimeView {
    pub active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channel: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tested_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    pub security_note: String,
}

#[derive(Clone)]
struct InjectedTarget {
    id: String,
    script_id: String,
}

#[derive(Clone)]
struct SkinSession {
    theme_id: String,
    mode: String,
    channel: String,
    tested_version: String,
    port: u16,
    targets: Vec<InjectedTarget>,
}

pub struct SkinRuntime {
    session: Mutex<Option<SkinSession>>,
}

impl Default for SkinRuntime {
    fn default() -> Self {
        Self {
            session: Mutex::new(None),
        }
    }
}

impl SkinRuntime {
    pub fn current(&self) -> SkinRuntimeView {
        let session = self
            .session
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone();
        SkinRuntimeView {
            active: session.is_some(),
            theme_id: session.as_ref().map(|value| value.theme_id.clone()),
            mode: session.as_ref().map(|value| value.mode.clone()),
            channel: session.as_ref().map(|value| value.channel.clone()),
            tested_version: session.as_ref().map(|value| value.tested_version.clone()),
            port: session.as_ref().map(|value| value.port),
            security_note:
                "Full Skin 使用仅限本机回环的调试端口；退出并正常重开 ChatGPT 后端口会关闭。".into(),
        }
    }

    fn take(&self) -> Option<SkinSession> {
        self.session
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .take()
    }

    fn replace(&self, session: SkinSession) {
        *self
            .session
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()) = Some(session);
    }
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CdpTarget {
    id: String,
    #[serde(rename = "type")]
    kind: String,
    url: String,
    web_socket_debugger_url: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct BrowserVersion {
    web_socket_debugger_url: String,
}

fn sha256_hex(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

pub fn port_for_channel(channel: &str) -> Result<u16, String> {
    match channel {
        "stable" => Ok(9465),
        "beta" => Ok(9466),
        _ => Err("未知的 ChatGPT 渠道".into()),
    }
}

fn valid_loopback_websocket(value: &str, port: u16, target: Option<&str>) -> bool {
    let Ok(url) = Url::parse(value) else {
        return false;
    };
    let host = url.host_str().unwrap_or_default();
    if url.scheme() != "ws"
        || !matches!(host, "127.0.0.1" | "localhost" | "::1" | "[::1]")
        || url.port() != Some(port)
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return false;
    }
    match target {
        Some(id) => url.path() == format!("/devtools/page/{id}"),
        None => url.path().starts_with("/devtools/browser/"),
    }
}

async fn cdp_targets(port: u16) -> Result<(String, Vec<CdpTarget>), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .map_err(|error| format!("无法创建 CDP 客户端：{error}"))?;
    let version: BrowserVersion = client
        .get(format!("http://127.0.0.1:{port}/json/version"))
        .send()
        .await
        .map_err(|error| format!("CDP 版本端点不可用：{error}"))?
        .error_for_status()
        .map_err(|error| format!("CDP 版本端点拒绝请求：{error}"))?
        .json()
        .await
        .map_err(|error| format!("CDP 版本记录无效：{error}"))?;
    if !valid_loopback_websocket(&version.web_socket_debugger_url, port, None) {
        return Err("CDP 浏览器身份不在预期回环端点".into());
    }
    let browser_id = version
        .web_socket_debugger_url
        .rsplit('/')
        .next()
        .unwrap_or_default()
        .to_owned();
    let targets: Vec<CdpTarget> = client
        .get(format!("http://127.0.0.1:{port}/json/list"))
        .send()
        .await
        .map_err(|error| format!("CDP 页面端点不可用：{error}"))?
        .error_for_status()
        .map_err(|error| format!("CDP 页面端点拒绝请求：{error}"))?
        .json()
        .await
        .map_err(|error| format!("CDP 页面记录无效：{error}"))?;
    let targets = targets
        .into_iter()
        .filter(|target| {
            target.kind == "page"
                && target.url.starts_with("app://")
                && valid_loopback_websocket(&target.web_socket_debugger_url, port, Some(&target.id))
        })
        .collect::<Vec<_>>();
    if targets.is_empty() {
        return Err("没有找到经过验证的 ChatGPT 页面目标".into());
    }
    Ok((browser_id, targets))
}

async fn wait_for_targets(
    port: u16,
    target: &platform::TargetView,
) -> Result<(String, Vec<CdpTarget>), String> {
    let deadline = Instant::now() + APPLY_TIMEOUT;
    let mut last_error = None;
    while Instant::now() < deadline {
        match platform::listener_belongs_to_target(port, target) {
            Ok(true) => match cdp_targets(port).await {
                Ok(value) => return Ok(value),
                Err(error) => last_error = Some(error),
            },
            Ok(false) => last_error = Some("调试端口尚未由所选 ChatGPT 监听".into()),
            Err(error) => last_error = Some(error),
        }
        tokio::time::sleep(Duration::from_millis(350)).await;
    }
    Err(last_error.unwrap_or_else(|| "等待 ChatGPT Full Skin 会话超时".into()))
}

fn cache_path(app: &AppHandle, skin: &FullSkinDescriptor) -> Result<PathBuf, String> {
    app.path()
        .app_cache_dir()
        .map(|path| {
            path.join("full-skin").join(format!(
                "{}-{}-{}.png",
                skin.theme_id,
                skin.mode,
                &skin.sha256[..12]
            ))
        })
        .map_err(|error| format!("无法定位 Full Skin 缓存：{error}"))
}

async fn load_art(app: &AppHandle, skin: &FullSkinDescriptor) -> Result<Vec<u8>, String> {
    if skin.bytes == 0 || skin.bytes > MAX_ART_BYTES {
        return Err("Full Skin 素材大小超出边界".into());
    }
    let destination = cache_path(app, skin)?;
    if let Ok(bytes) = fs::read(&destination)
        && bytes.len() == skin.bytes
        && sha256_hex(&bytes) == skin.sha256
    {
        return Ok(bytes);
    }

    let url = format!("{}{}", catalog::REMOTE_SITE_ROOT, skin.asset);
    let response = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|error| format!("无法创建素材下载客户端：{error}"))?
        .get(&url)
        .header("Accept", "image/png")
        .send()
        .await
        .map_err(|error| format!("Full Skin 素材下载失败：{error}"))?
        .error_for_status()
        .map_err(|error| format!("Full Skin 素材返回错误：{error}"))?;
    if response
        .content_length()
        .is_some_and(|bytes| bytes != skin.bytes as u64)
    {
        return Err("Full Skin 素材响应字节数不匹配".into());
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("无法读取 Full Skin 素材：{error}"))?
        .to_vec();
    if bytes.len() != skin.bytes || sha256_hex(&bytes) != skin.sha256 {
        return Err("Full Skin 素材哈希或字节数不匹配".into());
    }
    if bytes.len() < 24 || &bytes[..8] != b"\x89PNG\r\n\x1a\n" {
        return Err("Full Skin 素材不是经过声明的 PNG".into());
    }

    let parent = destination.parent().ok_or("Full Skin 缓存目录无效")?;
    fs::create_dir_all(parent).map_err(|error| format!("无法创建 Full Skin 缓存：{error}"))?;
    let temporary = destination.with_extension("png.tmp");
    fs::write(&temporary, &bytes).map_err(|error| format!("无法写入 Full Skin 缓存：{error}"))?;
    if destination.exists() {
        fs::remove_file(&destination)
            .map_err(|error| format!("无法更新 Full Skin 缓存：{error}"))?;
    }
    fs::rename(&temporary, &destination)
        .map_err(|error| format!("无法提交 Full Skin 缓存：{error}"))?;
    Ok(bytes)
}

fn runtime_script(skin: &FullSkinDescriptor, art: &[u8]) -> Result<String, String> {
    let theme = json!({
        "id": skin.theme_id,
        "mode": skin.mode,
        "name": skin.name,
        "tagline": skin.tagline,
        "art": skin.art,
        "tokens": skin.tokens,
    });
    let image = format!("data:image/png;base64,{}", BASE64.encode(art));
    let script = RUNTIME_JS
        .replacen(
            "__ACT_THEME_JSON__",
            &serde_json::to_string(&theme)
                .map_err(|error| format!("无法编码 Full Skin 主题：{error}"))?,
            1,
        )
        .replacen(
            "__ACT_CSS_JSON__",
            &serde_json::to_string(RUNTIME_CSS)
                .map_err(|error| format!("无法编码 Full Skin 样式：{error}"))?,
            1,
        )
        .replacen(
            "__ACT_IMAGE_JSON__",
            &serde_json::to_string(&image)
                .map_err(|error| format!("无法编码 Full Skin 素材：{error}"))?,
            1,
        );
    if script.contains("__ACT_THEME_JSON__")
        || script.contains("__ACT_CSS_JSON__")
        || script.contains("__ACT_IMAGE_JSON__")
    {
        return Err("Full Skin 运行时模板没有完整展开".into());
    }
    Ok(script)
}

type CdpSocket = WebSocket<MaybeTlsStream<TcpStream>>;

fn set_socket_timeout(socket: &mut CdpSocket, timeout: Duration) -> Result<(), String> {
    if let MaybeTlsStream::Plain(stream) = socket.get_mut() {
        stream
            .set_read_timeout(Some(timeout))
            .and_then(|_| stream.set_write_timeout(Some(timeout)))
            .map_err(|error| format!("无法设置 CDP 超时：{error}"))?;
    }
    Ok(())
}

fn cdp_call(socket: &mut CdpSocket, id: u64, method: &str, params: Value) -> Result<Value, String> {
    socket
        .send(Message::Text(
            json!({ "id": id, "method": method, "params": params })
                .to_string()
                .into(),
        ))
        .map_err(|error| format!("CDP {method} 发送失败：{error}"))?;
    loop {
        let message = socket
            .read()
            .map_err(|error| format!("CDP {method} 读取失败：{error}"))?;
        let Message::Text(text) = message else {
            continue;
        };
        let value: Value =
            serde_json::from_str(&text).map_err(|error| format!("CDP 响应无效：{error}"))?;
        if value["id"].as_u64() != Some(id) {
            continue;
        }
        if let Some(error) = value.get("error") {
            return Err(format!("CDP {method} 拒绝请求：{error}"));
        }
        return Ok(value["result"].clone());
    }
}

fn connect_target(target: &CdpTarget) -> Result<CdpSocket, String> {
    connect_target_with_timeout(target, CDP_CALL_TIMEOUT)
}

fn connect_target_with_timeout(target: &CdpTarget, timeout: Duration) -> Result<CdpSocket, String> {
    let (mut socket, _) = connect(target.web_socket_debugger_url.as_str())
        .map_err(|error| format!("无法连接 ChatGPT 页面：{error}"))?;
    set_socket_timeout(&mut socket, timeout)?;
    Ok(socket)
}

fn inject_targets(targets: Vec<CdpTarget>, script: String) -> Result<Vec<InjectedTarget>, String> {
    let mut injected = Vec::new();
    for target in targets {
        let mut socket = connect_target(&target)?;
        let early = cdp_call(
            &mut socket,
            1,
            "Page.addScriptToEvaluateOnNewDocument",
            json!({ "source": script }),
        )?;
        let script_id = early["identifier"]
            .as_str()
            .ok_or("CDP 没有返回早期注入标识")?
            .to_owned();
        let result = cdp_call(
            &mut socket,
            2,
            "Runtime.evaluate",
            json!({
                "expression": script,
                "awaitPromise": true,
                "returnByValue": true
            }),
        )?;
        let value = &result["result"]["value"];
        if value["pass"].as_bool() != Some(true)
            || value["version"].as_str() != Some(RUNTIME_FORMAT)
        {
            return Err(format!("{} Full Skin 运行时验证失败", target.id));
        }
        injected.push(InjectedTarget {
            id: target.id,
            script_id,
        });
    }
    if injected.is_empty() {
        return Err("没有 ChatGPT 页面接受 Full Skin".into());
    }
    Ok(injected)
}

fn remove_from_targets(targets: Vec<CdpTarget>, session: &SkinSession) -> Result<(), String> {
    let cleanup = r#"(() => {
      if (window.__ACT_FULL_SKIN_STATE__?.cleanup) {
        return window.__ACT_FULL_SKIN_STATE__.cleanup();
      }
      document.getElementById("act-full-skin-style")?.remove();
      document.getElementById("act-full-skin-caption")?.remove();
      document.documentElement.classList.remove("act-full-skin", "act-full-skin-home");
      return true;
    })()"#;
    let mut errors = Vec::new();
    for record in &session.targets {
        let Some(target) = targets.iter().find(|target| target.id == record.id) else {
            continue;
        };
        let mut socket = match connect_target_with_timeout(target, CDP_CLEANUP_TIMEOUT) {
            Ok(socket) => socket,
            Err(error) => {
                errors.push(format!("{}: {error}", record.id));
                continue;
            }
        };
        if let Err(error) = cdp_call(
            &mut socket,
            1,
            "Page.removeScriptToEvaluateOnNewDocument",
            json!({ "identifier": record.script_id }),
        ) {
            errors.push(format!("{}: {error}", record.id));
        }
        if let Err(error) = cdp_call(
            &mut socket,
            2,
            "Runtime.evaluate",
            json!({
                "expression": cleanup,
                "awaitPromise": true,
                "returnByValue": true
            }),
        ) {
            errors.push(format!("{}: {error}", record.id));
        }
    }
    if !errors.is_empty() {
        return Err(format!(
            "部分 Full Skin 页面没有完成清理：{}",
            errors.join("; ")
        ));
    }
    Ok(())
}

async fn remove_session(session: SkinSession) -> Result<(), String> {
    let target = platform::find_target(&session.channel)?;
    if !platform::listener_belongs_to_target(session.port, &target)? {
        return Ok(());
    }
    let (_, targets) = cdp_targets(session.port).await?;
    tauri::async_runtime::spawn_blocking(move || remove_from_targets(targets, &session))
        .await
        .map_err(|error| format!("Full Skin 清理任务失败：{error}"))?
}

pub async fn apply(
    app: &AppHandle,
    runtime: &SkinRuntime,
    catalog: &Catalog,
    theme_id: &str,
    mode: &str,
    channel: &str,
) -> Result<SkinRuntimeView, String> {
    if let Some(previous) = runtime.take() {
        if let Err(error) = remove_session(previous.clone()).await {
            runtime.replace(previous);
            return Err(error);
        }
    }

    let skin = catalog::full_skin_for(catalog, theme_id, mode)?;
    let art = load_art(app, &skin).await?;
    let script = runtime_script(&skin, &art)?;
    let port = port_for_channel(channel)?;
    let target = platform::find_target(channel)?;
    let running = platform::target_is_running(&target)?;
    let listener_matches = platform::listener_belongs_to_target(port, &target).unwrap_or(false);
    if running && !listener_matches {
        return Err("所选 ChatGPT 已经在普通模式运行。请先关闭它，再应用完整皮肤。".into());
    }
    if !running {
        platform::launch_target_with_arguments(
            channel,
            &format!("--remote-debugging-address=127.0.0.1 --remote-debugging-port={port}"),
        )?;
    }
    let (_, targets) = wait_for_targets(port, &target).await?;
    let injected = tauri::async_runtime::spawn_blocking(move || inject_targets(targets, script))
        .await
        .map_err(|error| format!("Full Skin 注入任务失败：{error}"))??;
    runtime.replace(SkinSession {
        theme_id: skin.theme_id,
        mode: skin.mode,
        channel: channel.into(),
        tested_version: skin.tested_version,
        port,
        targets: injected,
    });
    Ok(runtime.current())
}

pub async fn restore(runtime: &SkinRuntime) -> Result<SkinRuntimeView, String> {
    if let Some(session) = runtime.take() {
        if let Err(error) = remove_session(session.clone()).await {
            runtime.replace(session);
            return Err(error);
        }
    }
    Ok(runtime.current())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn runtime_template_expands_without_executable_theme_fields() {
        let skin = FullSkinDescriptor {
            theme_id: "test-theme".into(),
            mode: "dark".into(),
            name: "测试主题".into(),
            tagline: "只包含声明式数据".into(),
            asset: "themes/test-theme/assets/background-dark.png".into(),
            sha256: "0".repeat(64),
            bytes: 8,
            tested_version: "26.715.3651.0".into(),
            art: catalog::FullSkinArt {
                focus_x: 0.75,
                focus_y: 0.45,
                safe_area: "left".into(),
                task_mode: "ambient".into(),
            },
            tokens: catalog::FullSkinTokens {
                background: "#101010".into(),
                surface: "#181818".into(),
                surface_alt: "#202020".into(),
                text: "#F4F4F4".into(),
                muted: "#B8B8B8".into(),
                accent: "#D4A94A".into(),
                accent_contrast: "#101010".into(),
                border: "#555555".into(),
            },
        };
        let script = runtime_script(&skin, b"\x89PNG\r\n\x1a\n").expect("runtime should build");
        assert!(script.contains("act-full-skin-v1"));
        assert!(script.contains("test-theme"));
        assert!(!script.contains("__ACT_THEME_JSON__"));
        assert!(!script.contains("__ACT_CSS_JSON__"));
        assert!(!script.contains("__ACT_IMAGE_JSON__"));
    }

    #[test]
    fn websocket_validation_rejects_non_loopback_targets() {
        assert!(valid_loopback_websocket(
            "ws://127.0.0.1:9466/devtools/page/test",
            9466,
            Some("test")
        ));
        assert!(!valid_loopback_websocket(
            "ws://example.com:9466/devtools/page/test",
            9466,
            Some("test")
        ));
        assert!(!valid_loopback_websocket(
            "ws://127.0.0.1:9467/devtools/page/test",
            9466,
            Some("test")
        ));
    }
}
