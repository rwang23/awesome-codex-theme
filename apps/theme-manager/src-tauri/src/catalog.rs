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

use crate::{cache, network};

pub const REMOTE_SITE_ROOT: &str = "https://rwang23.github.io/awesome-codex-theme/";
const REMOTE_CATALOG_URL: &str =
    "https://rwang23.github.io/awesome-codex-theme/downloads/catalog.json";
const REMOTE_REGISTRY_URL: &str =
    "https://rwang23.github.io/awesome-codex-theme/themes/registry.json";
const MODES: [&str; 2] = ["light", "dark"];
const MAX_CATALOG_BYTES: usize = 256 * 1024;
const MAX_REGISTRY_BYTES: usize = 8 * 1024 * 1024;
const CACHE_FILE_PREFIX: &str = "catalog-cache-";
const CACHE_FILE_SUFFIX: &str = ".json";

#[derive(Clone)]
struct ReleaseContract {
    full_skin_format: String,
    native_tested_version: String,
    capture_version: String,
    capture_package: String,
    capture_fixture: String,
}

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

fn validate_runtime_evidence(value: &Value) -> Result<(), String> {
    // Registries produced before evidence state existed remain safe to display as
    // reference-only in the renderer. New registries must make that state explicit.
    if value.is_null() {
        return Ok(());
    }
    let evidence = object(value, "runtimeEvidence")?;
    let status = evidence["status"].as_str().unwrap_or_default();
    if !matches!(status, "verified" | "reference") {
        return fail("Runtime 证据状态无效");
    }
    let captured = object(&evidence["capturedRuntime"], "capturedRuntime")?;
    let current = object(&evidence["currentRuntime"], "currentRuntime")?;
    let captured_version = captured["implementationVersion"]
        .as_str()
        .unwrap_or_default();
    let captured_sha = captured["sha256"].as_str().unwrap_or_default();
    let current_version = current["implementationVersion"]
        .as_str()
        .unwrap_or_default();
    let current_sha = current["sha256"].as_str().unwrap_or_default();
    let verification = current["verification"].as_str().unwrap_or_default();
    if captured_version.is_empty()
        || current_version.is_empty()
        || !valid_sha256(captured_sha)
        || !valid_sha256(current_sha)
    {
        return fail("Runtime 证据记录无效");
    }
    if (status == "verified"
        && (verification != "verified"
            || captured_version != current_version
            || captured_sha != current_sha))
        || (status == "reference" && verification != "source-tested-recapture-required")
    {
        return fail("Runtime 证据状态与版本不一致");
    }
    Ok(())
}

fn valid_hex_color(value: &str) -> bool {
    value.len() == 7
        && value.starts_with('#')
        && value[1..]
            .chars()
            .all(|character| character.is_ascii_hexdigit())
}

fn required_string(value: &Value, label: &str) -> Result<String, String> {
    value
        .as_str()
        .filter(|value| !value.trim().is_empty())
        .map(str::to_owned)
        .ok_or_else(|| format!("{label} 必须是非空字符串"))
}

fn validate_release(registry: &Value) -> Result<ReleaseContract, String> {
    let release = object(&registry["release"], "release")?;
    let product = object(
        release.get("product").unwrap_or(&Value::Null),
        "release.product",
    )?;
    for field in ["name", "repository", "releases"] {
        required_string(
            product.get(field).unwrap_or(&Value::Null),
            &format!("release.product.{field}"),
        )?;
    }
    let desktop = object(
        release.get("desktop").unwrap_or(&Value::Null),
        "release.desktop",
    )?;
    required_string(
        desktop.get("version").unwrap_or(&Value::Null),
        "release.desktop.version",
    )?;
    if !matches!(
        desktop.get("channel").and_then(Value::as_str),
        Some("beta" | "stable")
    ) {
        return fail("release.desktop.channel 无效");
    }
    let updater = object(
        desktop.get("updater").unwrap_or(&Value::Null),
        "release.desktop.updater",
    )?;
    if !matches!(
        updater.get("status").and_then(Value::as_str),
        Some("unreleased" | "available")
    ) {
        return fail("release.desktop.updater.status 无效");
    }
    localized(
        updater.get("message").unwrap_or(&Value::Null),
        "release.desktop.updater.message",
    )?;
    let runtime = object(
        release.get("runtime").unwrap_or(&Value::Null),
        "release.runtime",
    )?;
    let full_skin_format = required_string(
        runtime.get("fullSkinFormat").unwrap_or(&Value::Null),
        "release.runtime.fullSkinFormat",
    )?;
    if full_skin_format != "act-full-skin-v1" {
        return fail("release.runtime.fullSkinFormat 不受支持");
    }
    required_string(
        runtime.get("implementationVersion").unwrap_or(&Value::Null),
        "release.runtime.implementationVersion",
    )?;
    required_string(
        runtime.get("sourceArtRenderer").unwrap_or(&Value::Null),
        "release.runtime.sourceArtRenderer",
    )?;
    let native_tested_version = required_string(
        runtime.get("nativeTestedVersion").unwrap_or(&Value::Null),
        "release.runtime.nativeTestedVersion",
    )?;
    let capture = object(
        release.get("capture").unwrap_or(&Value::Null),
        "release.capture",
    )?;
    if capture.get("channel").and_then(Value::as_str) != Some("beta") {
        return fail("release.capture.channel 必须是 beta");
    }
    let capture_version = required_string(
        capture.get("appVersion").unwrap_or(&Value::Null),
        "release.capture.appVersion",
    )?;
    let capture_package = required_string(
        capture.get("packageFullName").unwrap_or(&Value::Null),
        "release.capture.packageFullName",
    )?;
    if !capture_package.starts_with("OpenAI.CodexBeta_") {
        return fail("release.capture.packageFullName 不是 Codex Beta 包");
    }
    let capture_fixture = required_string(
        capture.get("fixture").unwrap_or(&Value::Null),
        "release.capture.fixture",
    )?;
    required_string(
        capture.get("modelLabel").unwrap_or(&Value::Null),
        "release.capture.modelLabel",
    )?;
    Ok(ReleaseContract {
        full_skin_format,
        native_tested_version,
        capture_version,
        capture_package,
        capture_fixture,
    })
}

fn validate_capabilities(value: &Value) -> Result<(), String> {
    let capabilities = array(value, "capabilities")?;
    if capabilities.is_empty() || capabilities.len() > 16 {
        return fail("capabilities 数量超出边界");
    }
    let mut ids = HashSet::new();
    for capability in capabilities {
        let id = capability["id"].as_str().unwrap_or_default();
        if !safe_id(id) || !ids.insert(id.to_owned()) {
            return fail("capability ID 无效或重复");
        }
        if !matches!(capability["platform"].as_str(), Some("windows" | "macos"))
            || !matches!(
                capability["architecture"].as_str(),
                Some("x64" | "aarch64" | "x86_64")
            )
        {
            return fail(format!("{id} capability 平台或架构无效"));
        }
        localized(&capability["title"], &format!("{id} capability title"))?;
        for feature_name in ["fullSkin", "native", "persistence"] {
            let feature = object(&capability[feature_name], &format!("{id} {feature_name}"))?;
            if !matches!(
                feature.get("status").and_then(Value::as_str),
                Some("verified" | "build-only" | "unverified")
            ) {
                return fail(format!("{id} {feature_name} status 无效"));
            }
            feature
                .get("testedVersion")
                .and_then(Value::as_str)
                .ok_or_else(|| format!("{id} {feature_name} testedVersion 无效"))?;
            localized(
                feature.get("detail").unwrap_or(&Value::Null),
                &format!("{id} {feature_name} detail"),
            )?;
        }
    }
    for id in ["windows-x64", "macos-aarch64", "macos-x86-64"] {
        if !ids.contains(id) {
            return fail(format!("capabilities 缺少 {id}"));
        }
    }
    Ok(())
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
    release: &ReleaseContract,
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
        || capture["markerVersion"].as_str() != Some(release.full_skin_format.as_str())
        || capture["width"].as_u64() != Some(1440)
        || capture["height"].as_u64() != Some(810)
        || capture["appVersion"].as_str() != Some(release.capture_version.as_str())
        || capture["packageFullName"].as_str() != Some(release.capture_package.as_str())
        || capture["fixture"].as_str() != Some(release.capture_fixture.as_str())
    {
        return fail(format!("{theme_id} {mode} 实机截图记录无效"));
    }

    let full_skin = &record["fullSkin"];
    let full_skin_asset = full_skin["asset"].as_str().unwrap_or_default();
    if full_skin["format"].as_str() != Some(release.full_skin_format.as_str())
        || !safe_relative_path(full_skin_asset)
        || full_skin_asset != format!("themes/{theme_id}/assets/background-{mode}.png")
        || !full_skin["sha256"].as_str().is_some_and(valid_sha256)
        || full_skin["sha256"] != record["assetSha256"]
        || full_skin["bytes"].as_u64().is_none()
        || full_skin["bytes"] != record["assetBytes"]
        || full_skin["testedVersion"].as_str() != Some(release.capture_version.as_str())
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
        || native["testedVersion"].as_str() != Some(release.native_tested_version.as_str())
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
    validate_runtime_evidence(&registry["runtimeEvidence"])?;

    let release = validate_release(&registry)?;
    validate_capabilities(&registry["capabilities"])?;
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
            validate_mode(id, theme, mode, &mut native_values, &release)?;
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

fn cache_directory(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_cache_dir()
        .map_err(|error| format!("无法定位主题缓存：{error}"))
}

fn cache_path_for_hash(directory: &Path, registry_sha256: &str) -> PathBuf {
    directory.join(format!(
        "{CACHE_FILE_PREFIX}{registry_sha256}{CACHE_FILE_SUFFIX}"
    ))
}

fn catalog_from_cache_bytes(bytes: &[u8]) -> Result<Catalog, String> {
    let cache: CatalogCache =
        serde_json::from_slice(bytes).map_err(|error| format!("主题缓存无效：{error}"))?;
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

fn cache_candidate_paths(directory: &Path) -> Result<Vec<PathBuf>, String> {
    let mut candidates = Vec::new();
    let legacy = directory.join("catalog-cache.json");
    if legacy.is_file() {
        candidates.push(legacy);
    }

    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(candidates),
        Err(error) => return Err(format!("无法读取主题缓存目录：{error}")),
    };
    for entry in entries {
        let entry = entry.map_err(|error| format!("无法读取主题缓存目录：{error}"))?;
        if !entry
            .file_type()
            .map_err(|error| format!("无法读取主题缓存条目：{error}"))?
            .is_file()
        {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if name.starts_with(CACHE_FILE_PREFIX) && name.ends_with(CACHE_FILE_SUFFIX) {
            candidates.push(entry.path());
        }
    }
    candidates.sort();
    Ok(candidates)
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
    let directory = cache_directory(app)?;
    let mut selected = None;
    let mut last_error = None;
    for path in cache_candidate_paths(&directory)? {
        let candidate = fs::read(&path)
            .map_err(|error| format!("无法读取主题缓存：{error}"))
            .and_then(|bytes| catalog_from_cache_bytes(&bytes));
        match candidate {
            Ok(candidate)
                if selected
                    .as_ref()
                    .is_none_or(|current: &Catalog| revision(&candidate) > revision(current)) =>
            {
                selected = Some(candidate);
            }
            Ok(_) => {}
            Err(error) => last_error = Some(error),
        }
    }
    selected.ok_or_else(|| last_error.unwrap_or_else(|| "未找到可验证的主题缓存".into()))
}

pub fn save_cached(app: &AppHandle, catalog: &Catalog, registry_text: &str) -> Result<(), String> {
    if !valid_sha256(&catalog.registry_sha256) {
        return fail("主题缓存 Registry 哈希无效");
    }
    let directory = cache_directory(app)?;
    let destination = cache_path_for_hash(&directory, &catalog.registry_sha256);
    let payload = CatalogCache {
        schema_version: 1,
        registry_sha256: catalog.registry_sha256.clone(),
        registry_text: registry_text.into(),
    };
    let bytes = serde_json::to_vec_pretty(&payload)
        .map_err(|error| format!("无法序列化主题缓存：{error}"))?;
    if let Ok(existing) = fs::read(&destination)
        && let Ok(existing) = catalog_from_cache_bytes(&existing)
        && existing.registry_sha256 == catalog.registry_sha256
    {
        return Ok(());
    }
    if destination.exists() {
        fs::remove_file(&destination).map_err(|error| format!("无法移除无效主题缓存：{error}"))?;
    }
    if cache::publish_new_file(&destination, &bytes, "主题缓存")? {
        return Ok(());
    }
    let existing = fs::read(&destination).map_err(|error| format!("无法读取主题缓存：{error}"))?;
    let existing = catalog_from_cache_bytes(&existing)?;
    if existing.registry_sha256 == catalog.registry_sha256 {
        Ok(())
    } else {
        fail("主题缓存候选与当前 Registry 不匹配")
    }
}

async fn fetch_bytes(
    client: &reqwest::Client,
    url: &str,
    max_bytes: usize,
) -> Result<Vec<u8>, String> {
    let response = client
        .get(url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|error| format!("主题目录请求失败：{error}"))?;
    if !response.status().is_success() {
        return fail(format!("主题目录返回 HTTP {}", response.status()));
    }
    network::read_capped_response(response, max_bytes, "application/json", "主题目录").await
}

pub async fn load_remote() -> Result<(Catalog, String), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .connect_timeout(Duration::from_secs(3))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|error| format!("无法创建主题目录客户端：{error}"))?;
    let manifest_bytes = fetch_bytes(&client, REMOTE_CATALOG_URL, MAX_CATALOG_BYTES).await?;
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
        .ok_or("远程 Registry 字节数无效")
        .and_then(|bytes| usize::try_from(bytes).map_err(|_| "远程 Registry 字节数无效"))?;
    if expected_bytes == 0 || expected_bytes > MAX_REGISTRY_BYTES {
        return fail("远程 Registry 声明字节数超出安全上限");
    }
    let expected_revision = manifest["registry"]["catalogRevision"]
        .as_u64()
        .filter(|revision| *revision > 0)
        .ok_or("远程 Registry 版本无效")?;
    let expected_themes = manifest["registry"]["themeCount"]
        .as_u64()
        .ok_or("远程 Registry 主题数无效")
        .and_then(|count| usize::try_from(count).map_err(|_| "远程 Registry 主题数无效"))?;

    let registry_bytes = fetch_bytes(&client, REMOTE_REGISTRY_URL, expected_bytes).await?;
    if registry_bytes.len() != expected_bytes || sha256_hex(&registry_bytes) != expected_hash {
        return fail("远程 Registry 大小或哈希不匹配");
    }
    let registry_text = String::from_utf8(registry_bytes)
        .map_err(|error| format!("远程 Registry 不是 UTF-8：{error}"))?;
    let registry = validate_registry(registry_text.as_bytes())?;
    if registry["catalogRevision"].as_u64() != Some(expected_revision) {
        return fail("远程 Registry 版本不匹配");
    }
    if registry["themes"].as_array().map(Vec::len) != Some(expected_themes) {
        return fail("远程 Registry 主题数量不匹配");
    }
    if manifest["release"] != registry["release"]
        || manifest["capabilities"] != registry["capabilities"]
    {
        return fail("远程 Registry 发布元数据不匹配");
    }
    Ok((
        Catalog {
            source: "remote".into(),
            registry,
            registry_sha256: expected_hash.into(),
            registry_bytes: registry_text.len(),
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
        "release": catalog.registry["release"],
        "capabilities": catalog.registry["capabilities"],
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
    use std::{
        io::{Read, Write},
        net::TcpListener,
        thread,
        time::Duration,
    };

    const REGISTRY: &[u8] = include_bytes!("../../../../themes/registry.json");
    const CATALOG: &[u8] = include_bytes!("../../../../themes/catalog.json");

    fn serve_chunked_json(chunks: Vec<Vec<u8>>) -> (String, thread::JoinHandle<()>) {
        let listener = TcpListener::bind(("127.0.0.1", 0)).expect("test server should bind");
        let address = listener
            .local_addr()
            .expect("test server should expose an address");
        let worker = thread::spawn(move || {
            let (mut stream, _) = listener
                .accept()
                .expect("test server should accept a request");
            let mut request = [0_u8; 1024];
            let _ = stream.read(&mut request);
            stream
                .write_all(
                    b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n",
                )
                .expect("test server should write response headers");
            for chunk in chunks {
                stream
                    .write_all(format!("{:X}\r\n", chunk.len()).as_bytes())
                    .expect("test server should write chunk size");
                stream
                    .write_all(&chunk)
                    .expect("test server should write chunk body");
                stream
                    .write_all(b"\r\n")
                    .expect("test server should write chunk terminator");
            }
            stream
                .write_all(b"0\r\n\r\n")
                .expect("test server should finish chunked response");
        });
        (format!("http://{address}/catalog.json"), worker)
    }

    fn serve_response(
        content_type: &str,
        content_length: Option<usize>,
        body: Vec<u8>,
        delay: Duration,
    ) -> (String, thread::JoinHandle<()>) {
        let listener = TcpListener::bind(("127.0.0.1", 0)).expect("test server should bind");
        let address = listener
            .local_addr()
            .expect("test server should expose an address");
        let content_length = content_length
            .map(|length| format!("Content-Length: {length}\r\n"))
            .unwrap_or_default();
        let headers = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: {content_type}\r\n{content_length}Connection: close\r\n\r\n"
        );
        let worker = thread::spawn(move || {
            let (mut stream, _) = listener
                .accept()
                .expect("test server should accept a request");
            let mut request = [0_u8; 1024];
            let _ = stream.read(&mut request);
            thread::sleep(delay);
            let _ = stream.write_all(headers.as_bytes());
            let _ = stream.write_all(&body);
        });
        (format!("http://{address}/catalog.json"), worker)
    }

    fn test_client(timeout: Duration) -> reqwest::Client {
        crate::install_crypto_provider();
        reqwest::Client::builder()
            .timeout(timeout)
            .build()
            .expect("test client should build")
    }

    #[test]
    fn bundled_registry_matches_the_source_catalog() {
        let registry = validate_registry(REGISTRY).expect("registry should validate");
        let catalog: Value = serde_json::from_slice(CATALOG).expect("source catalog should parse");
        assert_eq!(registry["catalogRevision"], catalog["catalogRevision"]);
        assert_eq!(
            registry["themes"].as_array().map(Vec::len),
            catalog["themes"].as_array().map(Vec::len),
        );
    }

    #[test]
    fn registry_rejects_malformed_runtime_evidence() {
        let mut registry: Value =
            serde_json::from_slice(REGISTRY).expect("registry JSON should parse");
        registry["runtimeEvidence"]["status"] = json!("unknown");
        let encoded = serde_json::to_vec(&registry).expect("registry JSON should encode");
        assert!(validate_registry(&encoded).is_err());
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

    #[test]
    fn remote_catalog_fetch_rejects_an_oversized_chunked_response() {
        let (url, worker) = serve_chunked_json(vec![vec![b'x'; 96 * 1024]]);
        let client = test_client(Duration::from_secs(1));
        let result = tauri::async_runtime::block_on(fetch_bytes(&client, &url, 64 * 1024));
        worker.join().expect("test server should finish");

        assert!(
            result.is_err(),
            "chunked catalog responses must be rejected before they can be fully buffered"
        );
    }

    #[test]
    fn remote_catalog_fetch_rejects_an_oversized_declared_response() {
        let (url, worker) = serve_response(
            "application/json",
            Some(64 * 1024 + 1),
            Vec::new(),
            Duration::ZERO,
        );
        let client = test_client(Duration::from_secs(1));
        let result = tauri::async_runtime::block_on(fetch_bytes(&client, &url, 64 * 1024));
        worker.join().expect("test server should finish");

        assert!(
            result.is_err(),
            "declared catalog responses above the hard limit must be rejected before reading"
        );
    }

    #[test]
    fn remote_catalog_fetch_rejects_the_wrong_content_type() {
        let (url, worker) = serve_response("text/html", Some(2), b"{}".to_vec(), Duration::ZERO);
        let client = test_client(Duration::from_secs(1));
        let result = tauri::async_runtime::block_on(fetch_bytes(&client, &url, 64 * 1024));
        worker.join().expect("test server should finish");

        assert!(
            result.is_err(),
            "catalog responses with an unexpected content type must be rejected"
        );
    }

    #[test]
    fn remote_catalog_fetch_rejects_truncated_data() {
        let (url, worker) =
            serve_response("application/json", Some(64), b"{}".to_vec(), Duration::ZERO);
        let client = test_client(Duration::from_secs(1));
        let result = tauri::async_runtime::block_on(fetch_bytes(&client, &url, 64 * 1024));
        worker.join().expect("test server should finish");

        assert!(result.is_err(), "truncated catalog data must be rejected");
    }

    #[test]
    fn remote_catalog_fetch_times_out_before_response_headers_arrive() {
        let (url, worker) = serve_response(
            "application/json",
            Some(2),
            b"{}".to_vec(),
            Duration::from_millis(250),
        );
        let client = test_client(Duration::from_millis(50));
        let result = tauri::async_runtime::block_on(fetch_bytes(&client, &url, 64 * 1024));
        worker.join().expect("test server should finish");

        assert!(
            result.is_err(),
            "catalog requests must respect the client timeout"
        );
    }
}
