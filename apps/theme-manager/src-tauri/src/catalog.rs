use std::{
    collections::{BTreeSet, HashSet},
    fs,
    path::{Path, PathBuf},
    time::Duration,
};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};

pub const REMOTE_SITE_ROOT: &str = "https://rwang23.github.io/awesome-codex-theme/";
const REMOTE_CATALOG_URL: &str =
    "https://rwang23.github.io/awesome-codex-theme/downloads/catalog.json";
const REMOTE_REGISTRY_URL: &str =
    "https://rwang23.github.io/awesome-codex-theme/themes/registry.json";
const MODES: [&str; 2] = ["light", "dark"];

#[derive(Clone)]
pub struct Catalog {
    pub source: String,
    pub registry: Value,
    pub registry_sha256: String,
    pub registry_bytes: usize,
    pub asset_base_url: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogStatus {
    pub status: String,
    pub message: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FullSkinArt {
    pub focus_x: f64,
    pub focus_y: f64,
    pub safe_area: String,
    pub task_mode: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FullSkinTokens {
    pub background: String,
    pub surface: String,
    pub surface_alt: String,
    pub text: String,
    pub muted: String,
    pub accent: String,
    pub accent_contrast: String,
    pub border: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FullSkinDescriptor {
    pub theme_id: String,
    pub mode: String,
    pub name: String,
    pub tagline: String,
    pub asset: String,
    pub sha256: String,
    pub bytes: usize,
    pub tested_version: String,
    pub art: FullSkinArt,
    pub tokens: FullSkinTokens,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct CatalogCache {
    schema_version: u8,
    registry_sha256: String,
    registry_text: String,
}

fn fail<T>(message: impl Into<String>) -> Result<T, String> {
    Err(message.into())
}

fn object<'a>(value: &'a Value, label: &str) -> Result<&'a Map<String, Value>, String> {
    value
        .as_object()
        .ok_or_else(|| format!("{label} 必须是对象"))
}

fn array<'a>(value: &'a Value, label: &str) -> Result<&'a Vec<Value>, String> {
    value
        .as_array()
        .ok_or_else(|| format!("{label} 必须是数组"))
}

fn exact_keys(value: &Value, expected: &[&str], label: &str) -> Result<(), String> {
    let actual = object(value, label)?
        .keys()
        .map(String::as_str)
        .collect::<BTreeSet<_>>();
    let expected = expected.iter().copied().collect::<BTreeSet<_>>();
    if actual != expected {
        return fail(format!("{label} 字段不符合 Native v1"));
    }
    Ok(())
}

fn localized(value: &Value, label: &str) -> Result<(), String> {
    let record = object(value, label)?;
    for locale in ["zh-CN", "en"] {
        let text = record
            .get(locale)
            .and_then(Value::as_str)
            .unwrap_or_default()
            .trim();
        if text.is_empty() {
            return fail(format!("{label} 缺少 {locale}"));
        }
    }
    Ok(())
}

fn safe_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value.chars().all(|character| {
            character.is_ascii_lowercase() || character.is_ascii_digit() || character == '-'
        })
        && !value.starts_with('-')
        && !value.ends_with('-')
        && !value.contains("--")
}

fn safe_relative_path(value: &str) -> bool {
    !value.is_empty()
        && !value.starts_with('/')
        && !value.contains('\\')
        && !value.contains(':')
        && value.split('/').all(|part| {
            !part.is_empty()
                && part != "."
                && part != ".."
                && part.chars().all(|character| {
                    character.is_ascii_alphanumeric() || matches!(character, '.' | '_' | '-' | '@')
                })
        })
}

fn sha256_hex(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

fn valid_sha256(value: &str) -> bool {
    value.len() == 64 && value.chars().all(|character| character.is_ascii_hexdigit())
}

fn valid_hex_color(value: &str) -> bool {
    value.len() == 7
        && value.starts_with('#')
        && value[1..]
            .chars()
            .all(|character| character.is_ascii_hexdigit())
}

fn validate_native_theme(value: &str, mode: &str) -> Result<(), String> {
    let body = value
        .strip_prefix("codex-theme-v1:")
        .ok_or("Native 主题前缀无效")?;
    if value.len() >= 4096 {
        return fail("Native 主题超过安全长度");
    }
    let payload: Value =
        serde_json::from_str(body).map_err(|error| format!("Native 主题 JSON 无效：{error}"))?;
    exact_keys(
        &payload,
        &["codeThemeId", "theme", "variant"],
        "Native payload",
    )?;
    if payload["codeThemeId"].as_str() != Some("codex") || payload["variant"].as_str() != Some(mode)
    {
        return fail("Native 主题目标或模式不匹配");
    }

    let theme = &payload["theme"];
    exact_keys(
        theme,
        &[
            "accent",
            "contrast",
            "fonts",
            "ink",
            "opaqueWindows",
            "semanticColors",
            "surface",
        ],
        "Native theme",
    )?;
    for key in ["accent", "ink", "surface"] {
        if !theme[key].as_str().is_some_and(valid_hex_color) {
            return fail(format!("Native 主题颜色无效：{key}"));
        }
    }
    if theme["contrast"].as_i64().is_none() || theme["opaqueWindows"].as_bool() != Some(true) {
        return fail("Native 主题对比度或窗口边界无效");
    }

    exact_keys(&theme["fonts"], &["code", "ui"], "Native fonts")?;
    if !theme["fonts"]["code"].is_null() || !theme["fonts"]["ui"].is_null() {
        return fail("Native 字体必须继续由 ChatGPT 管理");
    }
    exact_keys(
        &theme["semanticColors"],
        &["diffAdded", "diffRemoved", "skill"],
        "Native semantic colors",
    )?;
    for value in object(&theme["semanticColors"], "Native semantic colors")?.values() {
        if !value.as_str().is_some_and(valid_hex_color) {
            return fail("Native 语义颜色无效");
        }
    }
    Ok(())
}

fn validate_mode(
    theme_id: &str,
    theme: &Value,
    mode: &str,
    native_values: &mut HashSet<String>,
) -> Result<(), String> {
    let record = theme["previews"]
        .get(mode)
        .ok_or_else(|| format!("{theme_id} 缺少 {mode} 模式"))?;
    let preview = record["preview"].as_str().unwrap_or_default();
    if !safe_relative_path(preview) {
        return fail(format!("{theme_id} {mode} 预览路径不安全"));
    }

    let capture = &record["capture"];
    let capture_path = capture["path"].as_str().unwrap_or_default();
    if !safe_relative_path(capture_path)
        || !capture_path.starts_with("screenshots/")
        || !capture["sha256"].as_str().is_some_and(valid_sha256)
        || !capture["assetSha256"].as_str().is_some_and(valid_sha256)
        || !capture["runtimeSha256"].as_str().is_some_and(valid_sha256)
        || capture["markerVersion"].as_str() != Some("act-full-skin-v1")
        || capture["width"].as_u64() != Some(1440)
        || capture["height"].as_u64() != Some(810)
        || capture["fixture"].as_str() != Some("full-skin-home-v1")
        || capture["appVersion"]
            .as_str()
            .unwrap_or_default()
            .is_empty()
    {
        return fail(format!("{theme_id} {mode} 实机截图记录无效"));
    }

    let full_skin = &record["fullSkin"];
    let full_skin_asset = full_skin["asset"].as_str().unwrap_or_default();
    if full_skin["format"].as_str() != Some("act-full-skin-v1")
        || !safe_relative_path(full_skin_asset)
        || full_skin_asset != format!("themes/{theme_id}/assets/background-{mode}.png")
        || !full_skin["sha256"].as_str().is_some_and(valid_sha256)
        || full_skin["sha256"] != record["assetSha256"]
        || full_skin["bytes"].as_u64().is_none()
        || full_skin["bytes"] != record["assetBytes"]
        || full_skin["testedVersion"]
            .as_str()
            .unwrap_or_default()
            .is_empty()
    {
        return fail(format!("{theme_id} {mode} Full Skin 记录无效"));
    }
    let art: FullSkinArt = serde_json::from_value(full_skin["art"].clone())
        .map_err(|error| format!("{theme_id} {mode} Full Skin 构图无效：{error}"))?;
    if !(0.0..=1.0).contains(&art.focus_x)
        || !(0.0..=1.0).contains(&art.focus_y)
        || !matches!(art.safe_area.as_str(), "left" | "right" | "center" | "none")
        || !matches!(art.task_mode.as_str(), "ambient" | "banner" | "off")
    {
        return fail(format!("{theme_id} {mode} Full Skin 构图超出边界"));
    }
    let tokens: FullSkinTokens = serde_json::from_value(full_skin["tokens"].clone())
        .map_err(|error| format!("{theme_id} {mode} Full Skin 配色无效：{error}"))?;
    for value in [
        &tokens.background,
        &tokens.surface,
        &tokens.surface_alt,
        &tokens.text,
        &tokens.muted,
        &tokens.accent,
        &tokens.accent_contrast,
        &tokens.border,
    ] {
        if !valid_hex_color(value) {
            return fail(format!("{theme_id} {mode} Full Skin 颜色无效"));
        }
    }

    let native = &record["nativeTheme"];
    let native_path = native["path"].as_str().unwrap_or_default();
    let native_value = native["value"].as_str().unwrap_or_default();
    if native["format"].as_str() != Some("codex-theme-v1")
        || !safe_relative_path(native_path)
        || !native["sha256"].as_str().is_some_and(valid_sha256)
    {
        return fail(format!("{theme_id} {mode} Native 记录无效"));
    }
    validate_native_theme(native_value, mode)?;
    let canonical = format!("{native_value}\n");
    if native["sha256"].as_str() != Some(sha256_hex(canonical.as_bytes()).as_str())
        || native["bytes"].as_u64() != Some(canonical.len() as u64)
    {
        return fail(format!("{theme_id} {mode} Native 哈希或字节数不匹配"));
    }
    if !native_values.insert(native_value.to_owned()) {
        return fail("Registry 中存在重复的 Native 主题值");
    }
    Ok(())
}

pub fn validate_registry(bytes: &[u8]) -> Result<Value, String> {
    let registry: Value =
        serde_json::from_slice(bytes).map_err(|error| format!("Registry JSON 无效：{error}"))?;
    object(&registry, "Registry")?;
    if registry["schemaVersion"].as_u64() != Some(1)
        || registry["standard"].as_str() != Some("act-theme-pack-v1")
        || !registry["catalogRevision"]
            .as_u64()
            .is_some_and(|revision| revision > 0)
    {
        return fail("Registry 标准不受支持");
    }

    let collections = array(&registry["collections"], "collections")?;
    let themes = array(&registry["themes"], "themes")?;
    if collections.is_empty() || themes.is_empty() || themes.len() > 500 {
        return fail("Registry 主题数量超出桌面管理器边界");
    }

    let mut collection_ids = HashSet::new();
    for collection in collections {
        let id = collection["id"].as_str().unwrap_or_default();
        if !safe_id(id) || !collection_ids.insert(id.to_owned()) {
            return fail("Registry 系列 ID 无效或重复");
        }
        localized(&collection["name"], &format!("{id} name"))?;
    }

    let mut theme_ids = HashSet::new();
    let mut native_values = HashSet::new();
    for theme in themes {
        let id = theme["id"].as_str().unwrap_or_default();
        if !safe_id(id) || !theme_ids.insert(id.to_owned()) {
            return fail("Registry 主题 ID 无效或重复");
        }
        if !collection_ids.contains(theme["collection"].as_str().unwrap_or_default()) {
            return fail(format!("{id} 引用了未知系列"));
        }
        localized(&theme["name"], &format!("{id} name"))?;
        localized(&theme["tagline"], &format!("{id} tagline"))?;
        localized(&theme["description"], &format!("{id} description"))?;
        if !matches!(
            theme["rightsProfile"].as_str(),
            Some("original" | "fan-art")
        ) {
            return fail(format!("{id} 权利标记无效"));
        }
        for mode in MODES {
            validate_mode(id, theme, mode, &mut native_values)?;
        }
    }
    Ok(registry)
}

pub fn revision(catalog: &Catalog) -> u64 {
    catalog.registry["catalogRevision"].as_u64().unwrap_or(0)
}

fn bundled_registry_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resource_dir()
        .map(|path| path.join("catalog").join("registry.json"))
        .map_err(|error| format!("无法定位内置 Registry：{error}"))
}

fn cache_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_cache_dir()
        .map(|path| path.join("catalog-cache.json"))
        .map_err(|error| format!("无法定位主题缓存：{error}"))
}

pub fn load_bundled(app: &AppHandle) -> Result<Catalog, String> {
    let bytes = fs::read(bundled_registry_path(app)?)
        .map_err(|error| format!("无法读取内置 Registry：{error}"))?;
    let registry = validate_registry(&bytes)?;
    Ok(Catalog {
        source: "bundled".into(),
        registry_sha256: sha256_hex(&bytes),
        registry_bytes: bytes.len(),
        registry,
        asset_base_url: None,
    })
}

pub fn load_cached(app: &AppHandle) -> Result<Catalog, String> {
    let bytes = fs::read(cache_path(app)?).map_err(|error| format!("无法读取主题缓存：{error}"))?;
    let cache: CatalogCache =
        serde_json::from_slice(&bytes).map_err(|error| format!("主题缓存无效：{error}"))?;
    if cache.schema_version != 1
        || sha256_hex(cache.registry_text.as_bytes()) != cache.registry_sha256
    {
        return fail("主题缓存哈希无效");
    }
    let registry = validate_registry(cache.registry_text.as_bytes())?;
    Ok(Catalog {
        source: "cache".into(),
        registry,
        registry_sha256: cache.registry_sha256,
        registry_bytes: cache.registry_text.len(),
        asset_base_url: Some(REMOTE_SITE_ROOT.into()),
    })
}

pub fn save_cached(app: &AppHandle, catalog: &Catalog, registry_text: &str) -> Result<(), String> {
    let destination = cache_path(app)?;
    let parent = destination.parent().ok_or("主题缓存路径无效")?;
    fs::create_dir_all(parent).map_err(|error| format!("无法创建主题缓存目录：{error}"))?;
    let temporary = destination.with_extension("json.tmp");
    let payload = CatalogCache {
        schema_version: 1,
        registry_sha256: catalog.registry_sha256.clone(),
        registry_text: registry_text.into(),
    };
    let bytes = serde_json::to_vec_pretty(&payload)
        .map_err(|error| format!("无法序列化主题缓存：{error}"))?;
    fs::write(&temporary, bytes).map_err(|error| format!("无法写入主题缓存：{error}"))?;
    if destination.exists() {
        fs::remove_file(&destination).map_err(|error| format!("无法替换主题缓存：{error}"))?;
    }
    fs::rename(&temporary, &destination).map_err(|error| format!("无法提交主题缓存：{error}"))
}

async fn fetch_bytes(client: &reqwest::Client, url: &str) -> Result<Vec<u8>, String> {
    let response = client
        .get(url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|error| format!("主题目录请求失败：{error}"))?;
    if !response.status().is_success() {
        return fail(format!("主题目录返回 HTTP {}", response.status()));
    }
    response
        .bytes()
        .await
        .map(|bytes| bytes.to_vec())
        .map_err(|error| format!("无法读取主题目录响应：{error}"))
}

pub async fn load_remote() -> Result<(Catalog, String), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .build()
        .map_err(|error| format!("无法创建主题目录客户端：{error}"))?;
    let manifest_bytes = fetch_bytes(&client, REMOTE_CATALOG_URL).await?;
    let manifest: Value = serde_json::from_slice(&manifest_bytes)
        .map_err(|error| format!("Catalog manifest 无效：{error}"))?;
    if manifest["schemaVersion"].as_u64() != Some(1)
        || manifest["standard"].as_str() != Some("act-theme-pack-v1")
        || manifest["assetsBaseUrl"].as_str() != Some(REMOTE_SITE_ROOT)
        || manifest["registry"]["url"].as_str() != Some(REMOTE_REGISTRY_URL)
    {
        return fail("远程 Catalog 不符合固定来源");
    }
    let expected_hash = manifest["registry"]["sha256"]
        .as_str()
        .filter(|value| valid_sha256(value))
        .ok_or("远程 Registry 哈希无效")?;
    let expected_bytes = manifest["registry"]["bytes"]
        .as_u64()
        .ok_or("远程 Registry 字节数无效")? as usize;
    let expected_revision = manifest["registry"]["catalogRevision"]
        .as_u64()
        .filter(|revision| *revision > 0)
        .ok_or("远程 Registry 版本无效")?;
    let expected_themes = manifest["registry"]["themeCount"]
        .as_u64()
        .ok_or("远程 Registry 主题数无效")? as usize;

    let registry_bytes = fetch_bytes(&client, REMOTE_REGISTRY_URL).await?;
    if registry_bytes.len() != expected_bytes || sha256_hex(&registry_bytes) != expected_hash {
        return fail("远程 Registry 大小或哈希不匹配");
    }
    let registry = validate_registry(&registry_bytes)?;
    if registry["catalogRevision"].as_u64() != Some(expected_revision) {
        return fail("远程 Registry 版本不匹配");
    }
    if registry["themes"].as_array().map(Vec::len) != Some(expected_themes) {
        return fail("远程 Registry 主题数量不匹配");
    }
    let registry_text = String::from_utf8(registry_bytes.clone())
        .map_err(|error| format!("远程 Registry 不是 UTF-8：{error}"))?;
    Ok((
        Catalog {
            source: "remote".into(),
            registry,
            registry_sha256: expected_hash.into(),
            registry_bytes: registry_bytes.len(),
            asset_base_url: Some(REMOTE_SITE_ROOT.into()),
        },
        registry_text,
    ))
}

fn local_capture_path(app: &AppHandle, relative: &str) -> Result<String, String> {
    let root = app
        .path()
        .resource_dir()
        .map_err(|error| format!("无法定位主题资源：{error}"))?;
    let path = root.join("catalog").join(Path::new(relative));
    Ok(path.to_string_lossy().into_owned())
}

pub fn present_catalog(app: &AppHandle, catalog: &Catalog) -> Result<Value, String> {
    let collections = catalog.registry["collections"].clone();
    let themes = array(&catalog.registry["themes"], "themes")?
        .iter()
        .map(|theme| {
            let previews = MODES
                .iter()
                .map(|mode| {
                    let record = &theme["previews"][mode];
                    let capture_path = record["capture"]["path"].as_str().unwrap_or_default();
                    let image = if let Some(base) = &catalog.asset_base_url {
                        json!({ "imageUrl": format!("{base}{capture_path}") })
                    } else {
                        json!({ "imagePath": local_capture_path(app, capture_path)? })
                    };
                    let mut preview = image.as_object().cloned().unwrap_or_default();
                    preview.insert(
                        "capture".into(),
                        json!({
                            "appVersion": record["capture"]["appVersion"],
                            "sha256": record["capture"]["sha256"],
                            "nativeSha256": record["capture"]["nativeSha256"]
                        }),
                    );
                    preview.insert(
                        "fullSkin".into(),
                        json!({
                            "format": record["fullSkin"]["format"],
                            "testedVersion": record["fullSkin"]["testedVersion"]
                        }),
                    );
                    preview.insert(
                        "nativeTheme".into(),
                        json!({
                            "sha256": record["nativeTheme"]["sha256"],
                            "testedVersion": record["nativeTheme"]["testedVersion"]
                        }),
                    );
                    Ok(((*mode).to_owned(), Value::Object(preview)))
                })
                .collect::<Result<Map<String, Value>, String>>()?;
            Ok(json!({
                "id": theme["id"],
                "collection": theme["collection"],
                "variant": theme["variant"],
                "rightsProfile": theme["rightsProfile"],
                "name": theme["name"],
                "tagline": theme["tagline"],
                "description": theme["description"],
                "tags": theme["tags"],
                "previews": previews
            }))
        })
        .collect::<Result<Vec<_>, String>>()?;

    Ok(json!({
        "source": catalog.source,
        "registrySha256": catalog.registry_sha256,
        "registryBytes": catalog.registry_bytes,
        "standard": catalog.registry["standard"],
        "collections": collections,
        "themes": themes
    }))
}

pub fn full_skin_for(
    catalog: &Catalog,
    theme_id: &str,
    mode: &str,
) -> Result<FullSkinDescriptor, String> {
    if !safe_id(theme_id) || !MODES.contains(&mode) {
        return fail("主题 ID 或模式无效");
    }
    let theme = array(&catalog.registry["themes"], "themes")?
        .iter()
        .find(|theme| theme["id"].as_str() == Some(theme_id))
        .ok_or("Registry 中不存在该主题")?;
    let record = &theme["previews"][mode]["fullSkin"];
    let preferred_locale = if theme["audience"].as_str() == Some("zh-CN") {
        "zh-CN"
    } else {
        "en"
    };
    let localized_text = |value: &Value| {
        value[preferred_locale]
            .as_str()
            .or_else(|| value["en"].as_str())
            .or_else(|| value["zh-CN"].as_str())
            .unwrap_or_default()
            .to_owned()
    };
    let bytes = record["bytes"]
        .as_u64()
        .and_then(|value| usize::try_from(value).ok())
        .ok_or("Full Skin 字节数无效")?;
    Ok(FullSkinDescriptor {
        theme_id: theme_id.into(),
        mode: mode.into(),
        name: localized_text(&theme["name"]),
        tagline: localized_text(&theme["tagline"]),
        asset: record["asset"]
            .as_str()
            .ok_or("Full Skin 素材路径缺失")?
            .into(),
        sha256: record["sha256"]
            .as_str()
            .ok_or("Full Skin 素材哈希缺失")?
            .into(),
        bytes,
        tested_version: record["testedVersion"]
            .as_str()
            .ok_or("Full Skin 测试版本缺失")?
            .into(),
        art: serde_json::from_value(record["art"].clone())
            .map_err(|error| format!("Full Skin 构图无效：{error}"))?,
        tokens: serde_json::from_value(record["tokens"].clone())
            .map_err(|error| format!("Full Skin 配色无效：{error}"))?,
    })
}

pub fn native_value_for(catalog: &Catalog, theme_id: &str, mode: &str) -> Result<String, String> {
    if !safe_id(theme_id) || !MODES.contains(&mode) {
        return fail("主题 ID 或模式无效");
    }
    let theme = array(&catalog.registry["themes"], "themes")?
        .iter()
        .find(|theme| theme["id"].as_str() == Some(theme_id))
        .ok_or("Registry 中不存在该主题")?;
    theme["previews"][mode]["nativeTheme"]["value"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| "主题缺少 Native 值".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    const REGISTRY: &[u8] = include_bytes!("../../../../themes/registry.json");

    #[test]
    fn bundled_registry_has_fifty_three_valid_dual_mode_themes() {
        let registry = validate_registry(REGISTRY).expect("registry should validate");
        assert_eq!(registry["catalogRevision"].as_u64(), Some(2026072101));
        assert_eq!(registry["themes"].as_array().map(Vec::len), Some(53));
    }

    #[test]
    fn native_lookup_rejects_unknown_ids_and_modes() {
        let registry = validate_registry(REGISTRY).expect("registry should validate");
        let catalog = Catalog {
            source: "test".into(),
            registry,
            registry_sha256: sha256_hex(REGISTRY),
            registry_bytes: REGISTRY.len(),
            asset_base_url: None,
        };
        assert!(native_value_for(&catalog, "missing-theme", "light").is_err());
        assert!(native_value_for(&catalog, "qinglan-odyssey", "sepia").is_err());
        assert!(
            native_value_for(&catalog, "qinglan-odyssey", "light")
                .expect("theme should exist")
                .starts_with("codex-theme-v1:")
        );
    }
}
