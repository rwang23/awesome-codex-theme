use std::{
    collections::HashSet,
    fs,
    net::{TcpListener, TcpStream},
    path::PathBuf,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
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
const RUNTIME_IMPLEMENTATION: &str = "act-full-skin-runtime-v2";
const MAX_ART_BYTES: usize = 16 * 1024 * 1024;
const APPLY_TIMEOUT: Duration = Duration::from_secs(45);
const CDP_CALL_TIMEOUT: Duration = Duration::from_secs(20);
const CDP_CLEANUP_TIMEOUT: Duration = Duration::from_secs(5);
const TARGET_DISCOVERY_INTERVAL: Duration = Duration::from_millis(1200);
const TARGET_HEALTH_INTERVAL: Duration = Duration::from_secs(5);
const TARGET_MONITOR_MAX_ERRORS: u8 = 12;
const TARGET_MONITOR_STOP_TIMEOUT: Duration = Duration::from_secs(8);
const TARGET_RUNTIME_STATE_TEMPLATE: &str = r#"(() => {
  const expected = __ACT_EXPECTED_RUNTIME__;
  if (document.readyState === "loading" || !document.body) {
    return { ready: false, healthy: false };
  }
  const root = document.documentElement;
  const state = window.__ACT_FULL_SKIN_STATE__;
  const artValue = root.style.getPropertyValue("--act-art-image");
  const bodyBackground = getComputedStyle(document.body).backgroundImage;
  return {
    ready: true,
    healthy: Boolean(
      root.classList.contains("act-full-skin")
      && state?.version === "act-full-skin-v1"
      && state?.implementationVersion === "act-full-skin-runtime-v2"
      && state?.themeId === expected.themeId
      && state?.mode === expected.mode
      && state?.artwork?.loaded === true
      && typeof state?.ensure === "function"
      && typeof state?.artUrl === "string"
      && state.artUrl.startsWith("blob:")
      && artValue.includes(state.artUrl)
      && bodyBackground.includes(state.artUrl)
    ),
  };
})()"#;

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
    last_health_check: Instant,
}

#[derive(Clone)]
struct SkinSession {
    theme_id: String,
    mode: String,
    channel: String,
    tested_version: String,
    port: u16,
    target: platform::TargetView,
    targets: Arc<Mutex<Vec<InjectedTarget>>>,
    monitor_stop: Arc<AtomicBool>,
    monitor_running: Arc<AtomicBool>,
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
                "Full Skin 使用系统临时分配、仅限本机回环的调试端口；退出并正常重开 ChatGPT 后端口会关闭。".into(),
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

fn select_loopback_port() -> Result<u16, String> {
    let listener = TcpListener::bind(("127.0.0.1", 0))
        .map_err(|error| format!("无法分配本机 Full Skin 端口：{error}"))?;
    listener
        .local_addr()
        .map(|address| address.port())
        .map_err(|error| format!("无法读取本机 Full Skin 端口：{error}"))
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
    let expanded = RUNTIME_JS
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
    let script = expanded.replacen(
        ";(async () => {",
        ";(async () => {\n  if (!document.body) {\n    await new Promise((resolve) => {\n      document.addEventListener(\"DOMContentLoaded\", resolve, { once: true });\n    });\n  }\n",
        1,
    );
    if script == expanded {
        return Err("Full Skin 运行时模板缺少可等待的启动入口".into());
    }
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

fn missing_early_script_registration(error: &str) -> bool {
    error.contains("Script not found")
}

fn target_runtime_state_expression(theme_id: &str, mode: &str) -> Result<String, String> {
    let expected = serde_json::to_string(&json!({
        "themeId": theme_id,
        "mode": mode,
    }))
    .map_err(|error| format!("无法编码 Full Skin 运行时状态：{error}"))?;
    Ok(TARGET_RUNTIME_STATE_TEMPLATE.replace("__ACT_EXPECTED_RUNTIME__", &expected))
}

fn target_runtime_state(
    target: &CdpTarget,
    theme_id: &str,
    mode: &str,
) -> Result<(bool, bool), String> {
    let expression = target_runtime_state_expression(theme_id, mode)?;
    let mut socket = connect_target_with_timeout(target, CDP_CLEANUP_TIMEOUT)?;
    let result = cdp_call(
        &mut socket,
        1,
        "Runtime.evaluate",
        json!({
            "expression": expression,
            "returnByValue": true
        }),
    )?;
    let value = &result["result"]["value"];
    Ok((
        value["ready"].as_bool().unwrap_or(false),
        value["healthy"].as_bool().unwrap_or(false),
    ))
}

fn evaluate_target_runtime(
    socket: &mut CdpSocket,
    request_id: u64,
    target_id: &str,
    script: &str,
) -> Result<(), String> {
    let result = cdp_call(
        socket,
        request_id,
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
        || value["implementationVersion"].as_str() != Some(RUNTIME_IMPLEMENTATION)
    {
        return Err(format!("{target_id} Full Skin 运行时验证失败"));
    }
    Ok(())
}

fn inject_target(target: CdpTarget, script: &str) -> Result<InjectedTarget, String> {
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
    evaluate_target_runtime(&mut socket, 2, &target.id, script)?;
    Ok(InjectedTarget {
        id: target.id,
        script_id,
        last_health_check: Instant::now(),
    })
}

fn refresh_target(target: &CdpTarget, script: &str) -> Result<(), String> {
    let mut socket = connect_target(target)?;
    evaluate_target_runtime(&mut socket, 1, &target.id, script)
}

fn inject_targets(targets: Vec<CdpTarget>, script: String) -> Result<Vec<InjectedTarget>, String> {
    let mut injected = Vec::new();
    for target in targets {
        injected.push(inject_target(target, &script)?);
    }
    if injected.is_empty() {
        return Err("没有 ChatGPT 页面接受 Full Skin".into());
    }
    Ok(injected)
}

fn injected_targets_snapshot(targets: &Arc<Mutex<Vec<InjectedTarget>>>) -> Vec<InjectedTarget> {
    targets
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .clone()
}

fn replace_injected_target(targets: &Arc<Mutex<Vec<InjectedTarget>>>, replacement: InjectedTarget) {
    let mut targets = targets
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    targets.retain(|target| target.id != replacement.id);
    targets.push(replacement);
}

fn retain_active_targets(targets: &Arc<Mutex<Vec<InjectedTarget>>>, active_ids: &HashSet<String>) {
    targets
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .retain(|target| active_ids.contains(&target.id));
}

fn mark_target_health_checked(targets: &Arc<Mutex<Vec<InjectedTarget>>>, target_id: &str) {
    if let Some(target) = targets
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .iter_mut()
        .find(|target| target.id == target_id)
    {
        target.last_health_check = Instant::now();
    }
}

fn health_check_due(target: &InjectedTarget, now: Instant) -> bool {
    now.saturating_duration_since(target.last_health_check) >= TARGET_HEALTH_INTERVAL
}

fn remove_from_targets(
    targets: Vec<CdpTarget>,
    injected_targets: Vec<InjectedTarget>,
) -> Result<(), String> {
    let cleanup = r#"(() => {
      if (window.__ACT_FULL_SKIN_STATE__?.cleanup) {
        return window.__ACT_FULL_SKIN_STATE__.cleanup();
      }
      document.getElementById("act-full-skin-style")?.remove();
      document.getElementById("act-full-skin-caption")?.remove();
      document.getElementById("act-full-skin-art")?.remove();
      const root = document.documentElement;
      root.classList.remove("act-full-skin", "act-full-skin-home", "act-full-skin-task");
      for (const property of [...root.style]) {
        if (property.startsWith("--act-")) root.style.removeProperty(property);
      }
      return true;
    })()"#;
    let mut errors = Vec::new();
    for record in &injected_targets {
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
            // A renderer may have navigated after the active CSS was removed.
            // In that case CDP discards the old early-script registration; the
            // runtime cleanup below remains the authoritative visible-state reset.
            if !missing_early_script_registration(&error) {
                errors.push(format!("{}: {error}", record.id));
            }
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

async fn listener_matches_session_target(session: &SkinSession) -> Result<bool, String> {
    let port = session.port;
    let target = session.target.clone();
    tauri::async_runtime::spawn_blocking(move || {
        platform::listener_belongs_to_target(port, &target)
    })
    .await
    .map_err(|error| format!("Full Skin 目标验证任务失败：{error}"))?
}

async fn target_runtime_health(
    target: CdpTarget,
    theme_id: String,
    mode: String,
) -> Result<(bool, bool), String> {
    tauri::async_runtime::spawn_blocking(move || target_runtime_state(&target, &theme_id, &mode))
        .await
        .map_err(|error| format!("Full Skin 页面状态检查失败：{error}"))?
}

async fn recover_target_runtime(
    session: &SkinSession,
    target: CdpTarget,
    script: String,
) -> Result<bool, String> {
    if session.monitor_stop.load(Ordering::Acquire) {
        return Ok(true);
    }
    if !listener_matches_session_target(session).await? {
        return Ok(false);
    }
    let target_to_refresh = target.clone();
    tauri::async_runtime::spawn_blocking(move || refresh_target(&target_to_refresh, &script))
        .await
        .map_err(|error| format!("Full Skin 页面恢复任务失败：{error}"))??;
    mark_target_health_checked(&session.targets, &target.id);
    Ok(true)
}

async fn register_target_runtime(
    session: &SkinSession,
    target: CdpTarget,
    script: String,
) -> Result<bool, String> {
    if session.monitor_stop.load(Ordering::Acquire) {
        return Ok(true);
    }
    if !listener_matches_session_target(session).await? {
        return Ok(false);
    }
    let injected_target = target.clone();
    let injected =
        tauri::async_runtime::spawn_blocking(move || inject_target(injected_target, &script))
            .await
            .map_err(|error| format!("Full Skin 新页面注入任务失败：{error}"))??;
    replace_injected_target(&session.targets, injected);
    Ok(true)
}

async fn monitor_skin_session(session: SkinSession, script: String) {
    if session.monitor_stop.load(Ordering::Acquire) {
        return;
    }
    session.monitor_running.store(true, Ordering::Release);
    let mut consecutive_errors = 0_u8;
    loop {
        if session.monitor_stop.load(Ordering::Acquire) {
            break;
        }
        let mut keep_monitoring = true;
        match cdp_targets(session.port).await {
            Ok((_, targets)) => {
                let mut had_error = false;
                let active_ids: HashSet<String> =
                    targets.iter().map(|target| target.id.clone()).collect();
                retain_active_targets(&session.targets, &active_ids);
                let injected = injected_targets_snapshot(&session.targets);
                let now = Instant::now();
                for target in targets {
                    if session.monitor_stop.load(Ordering::Acquire) {
                        break;
                    }
                    let Some(record) = injected.iter().find(|record| record.id == target.id) else {
                        match register_target_runtime(&session, target, script.clone()).await {
                            Ok(true) => {}
                            Ok(false) => {
                                keep_monitoring = false;
                                break;
                            }
                            Err(_) => had_error = true,
                        }
                        continue;
                    };
                    if !health_check_due(record, now) {
                        continue;
                    }
                    let health = target_runtime_health(
                        target.clone(),
                        session.theme_id.clone(),
                        session.mode.clone(),
                    )
                    .await;
                    match health {
                        Ok((false, _)) | Ok((true, true)) => {
                            mark_target_health_checked(&session.targets, &target.id);
                        }
                        Ok((true, false)) => {
                            match recover_target_runtime(&session, target, script.clone()).await {
                                Ok(true) => {}
                                Ok(false) => {
                                    keep_monitoring = false;
                                    break;
                                }
                                Err(_) => had_error = true,
                            }
                        }
                        Err(_) => had_error = true,
                    }
                }
                if had_error {
                    consecutive_errors = consecutive_errors.saturating_add(1);
                } else {
                    consecutive_errors = 0;
                }
            }
            Err(_) => {
                consecutive_errors = consecutive_errors.saturating_add(1);
            }
        }
        if !keep_monitoring || consecutive_errors >= TARGET_MONITOR_MAX_ERRORS {
            break;
        }
        tokio::time::sleep(TARGET_DISCOVERY_INTERVAL).await;
    }
    session.monitor_running.store(false, Ordering::Release);
}

async fn stop_session_monitor(session: &SkinSession) -> Result<(), String> {
    session.monitor_stop.store(true, Ordering::Release);
    let deadline = Instant::now() + TARGET_MONITOR_STOP_TIMEOUT;
    while session.monitor_running.load(Ordering::Acquire) {
        if Instant::now() >= deadline {
            return Err("Full Skin 页面监控没有在安全等待时间内停止".into());
        }
        tokio::time::sleep(Duration::from_millis(25)).await;
    }
    Ok(())
}

async fn remove_session(session: SkinSession) -> Result<(), String> {
    stop_session_monitor(&session).await?;
    if !listener_matches_session_target(&session).await? {
        return Ok(());
    }
    let (_, targets) = cdp_targets(session.port).await?;
    let injected_targets = injected_targets_snapshot(&session.targets);
    tauri::async_runtime::spawn_blocking(move || remove_from_targets(targets, injected_targets))
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
    let mut reusable_port = None;
    if let Some(previous) = runtime.take() {
        let same_channel = previous.channel == channel;
        let previous_port = previous.port;
        if let Err(error) = remove_session(previous.clone()).await {
            runtime.replace(previous);
            return Err(error);
        }
        if same_channel {
            reusable_port = Some(previous_port);
        }
    }

    let skin = catalog::full_skin_for(catalog, theme_id, mode)?;
    let target = platform::find_target(channel)?;
    platform::validate_full_skin_target(&target, &skin.tested_version)?;
    let art = load_art(app, &skin).await?;
    let script = runtime_script(&skin, &art)?;
    let running = platform::target_is_running(&target)?;
    let port = if running {
        reusable_port
            .filter(|port| platform::listener_belongs_to_target(*port, &target).unwrap_or(false))
            .ok_or("所选 ChatGPT 已经在普通模式运行。请先关闭它，再应用完整皮肤。")?
    } else {
        select_loopback_port()?
    };
    if !running {
        platform::launch_target_with_arguments(
            channel,
            &format!("--remote-debugging-address=127.0.0.1 --remote-debugging-port={port}"),
        )?;
    }
    let (_, targets) = wait_for_targets(port, &target).await?;
    let initial_script = script.clone();
    let injected =
        tauri::async_runtime::spawn_blocking(move || inject_targets(targets, initial_script))
            .await
            .map_err(|error| format!("Full Skin 注入任务失败：{error}"))??;
    let session = SkinSession {
        theme_id: skin.theme_id,
        mode: skin.mode,
        channel: channel.into(),
        tested_version: skin.tested_version,
        port,
        target,
        targets: Arc::new(Mutex::new(injected)),
        monitor_stop: Arc::new(AtomicBool::new(false)),
        monitor_running: Arc::new(AtomicBool::new(false)),
    };
    runtime.replace(session.clone());
    let _ = tauri::async_runtime::spawn(async move {
        monitor_skin_session(session, script).await;
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
        assert!(script.contains("act-full-skin-runtime-v2"));
        assert!(script.contains("test-theme"));
        assert!(script.contains("DOMContentLoaded"));
        assert!(!script.contains("__ACT_THEME_JSON__"));
        assert!(!script.contains("__ACT_CSS_JSON__"));
        assert!(!script.contains("__ACT_IMAGE_JSON__"));
    }

    #[test]
    fn websocket_validation_rejects_non_loopback_targets() {
        assert!(valid_loopback_websocket(
            "ws://127.0.0.1:49152/devtools/page/test",
            49152,
            Some("test")
        ));
        assert!(!valid_loopback_websocket(
            "ws://example.com:49152/devtools/page/test",
            49152,
            Some("test")
        ));
        assert!(!valid_loopback_websocket(
            "ws://127.0.0.1:49153/devtools/page/test",
            49152,
            Some("test")
        ));
    }

    #[test]
    fn missing_early_script_registration_is_safe_to_ignore_during_cleanup() {
        assert!(missing_early_script_registration(
            "CDP Page.removeScriptToEvaluateOnNewDocument 拒绝请求：{\"code\":-32000,\"message\":\"Script not found\"}"
        ));
        assert!(!missing_early_script_registration(
            "CDP Page.removeScriptToEvaluateOnNewDocument 读取失败：connection reset"
        ));
    }

    #[test]
    fn runtime_health_check_requires_the_blob_backed_document_layer() {
        let expression = target_runtime_state_expression("test-theme", "dark")
            .expect("runtime health check should build");
        assert!(expression.contains("test-theme"));
        assert!(expression.contains("state?.version === \"act-full-skin-v1\""));
        assert!(
            expression.contains("state?.implementationVersion === \"act-full-skin-runtime-v2\"")
        );
        assert!(expression.contains("state.artUrl.startsWith(\"blob:\")"));
        assert!(expression.contains("artValue.includes(state.artUrl)"));
        assert!(expression.contains("bodyBackground.includes(state.artUrl)"));
    }

    #[test]
    fn health_checks_run_less_often_than_target_discovery() {
        let now = Instant::now();
        let recent = InjectedTarget {
            id: "recent".into(),
            script_id: "script-recent".into(),
            last_health_check: now,
        };
        let due = InjectedTarget {
            id: "due".into(),
            script_id: "script-due".into(),
            last_health_check: now - TARGET_HEALTH_INTERVAL,
        };
        assert!(!health_check_due(&recent, now));
        assert!(health_check_due(&due, now));
        assert!(TARGET_HEALTH_INTERVAL > TARGET_DISCOVERY_INTERVAL * 3);
    }

    #[test]
    fn selected_loopback_port_is_available() {
        let port = select_loopback_port().expect("loopback port should be selected");
        assert_ne!(port, 0);
        let listener = TcpListener::bind(("127.0.0.1", port))
            .expect("selected port should be available immediately after selection");
        assert_eq!(listener.local_addr().expect("local address").port(), port);
    }
}
