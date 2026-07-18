mod catalog;
mod persistence;
mod platform;
mod skin_runtime;
mod updater;

use std::sync::Mutex;

use arboard::Clipboard;
use catalog::{Catalog, CatalogStatus};
use serde::Serialize;
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_opener::OpenerExt;
use updater::{UpdateRuntime, UpdateView};

struct DesktopState {
    catalog: Mutex<Option<Catalog>>,
    catalog_status: Mutex<CatalogStatus>,
    skin_runtime: skin_runtime::SkinRuntime,
    updater: UpdateRuntime,
}

fn install_crypto_provider() {
    let _ = rustls::crypto::ring::default_provider().install_default();
}

impl Default for DesktopState {
    fn default() -> Self {
        Self {
            catalog: Mutex::new(None),
            catalog_status: Mutex::new(CatalogStatus {
                status: "loading".into(),
                message: "正在读取内置主题目录".into(),
            }),
            skin_runtime: skin_runtime::SkinRuntime::default(),
            updater: UpdateRuntime::default(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BootstrapView {
    app_version: String,
    platform: String,
    catalog: Value,
    catalog_state: CatalogStatus,
    targets: Vec<platform::TargetView>,
    skin_state: skin_runtime::SkinRuntimeView,
    persistence_state: persistence::PersistenceView,
    update_state: UpdateView,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CopyView {
    ok: bool,
    theme_id: String,
    mode: String,
}

fn lock_catalog(state: &DesktopState) -> Result<Catalog, String> {
    state
        .catalog
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .clone()
        .ok_or_else(|| "主题目录尚未初始化".into())
}

fn current_catalog_payload(
    app: &AppHandle,
    state: &DesktopState,
) -> Result<serde_json::Value, String> {
    let catalog = lock_catalog(state)?;
    let status = state
        .catalog_status
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .clone();
    Ok(json!({
        "status": status.status,
        "message": status.message,
        "catalog": catalog::present_catalog(app, &catalog)?
    }))
}

fn publish_catalog(
    app: &AppHandle,
    state: &DesktopState,
    status: CatalogStatus,
) -> Result<Value, String> {
    *state
        .catalog_status
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = status;
    let payload = current_catalog_payload(app, state)?;
    let _ = app.emit("act:catalog-state", &payload);
    Ok(payload)
}

fn initialize_catalog(app: &AppHandle, state: &DesktopState) -> Result<(), String> {
    let bundled = catalog::load_bundled(app)?;
    let bundled_revision = catalog::revision(&bundled);
    let (catalog, status) = match catalog::load_cached(app) {
        Ok(cached) if catalog::revision(&cached) > bundled_revision => (
            cached,
            CatalogStatus {
                status: "cached".into(),
                message: "已载入上次同步的主题目录".into(),
            },
        ),
        _ => (
            bundled,
            CatalogStatus {
                status: "bundled".into(),
                message: "已载入内置主题目录".into(),
            },
        ),
    };
    *state
        .catalog
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = Some(catalog);
    *state
        .catalog_status
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = status;
    Ok(())
}

fn platform_name() -> String {
    match std::env::consts::OS {
        "windows" => "win32",
        "macos" => "darwin",
        value => value,
    }
    .into()
}

#[tauri::command]
async fn bootstrap(
    app: AppHandle,
    state: State<'_, DesktopState>,
) -> Result<BootstrapView, String> {
    let catalog = lock_catalog(&state)?;
    let catalog_state = state
        .catalog_status
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .clone();
    Ok(BootstrapView {
        app_version: app.package_info().version.to_string(),
        platform: platform_name(),
        catalog: catalog::present_catalog(&app, &catalog)?,
        catalog_state,
        targets: platform::discover_targets(),
        skin_state: state.skin_runtime.current(),
        persistence_state: persistence::current(&app)?,
        update_state: state.updater.current(),
    })
}

#[tauri::command]
async fn refresh_catalog(app: AppHandle, state: State<'_, DesktopState>) -> Result<Value, String> {
    publish_catalog(
        &app,
        &state,
        CatalogStatus {
            status: "refreshing".into(),
            message: "正在检查主题目录更新".into(),
        },
    )?;
    let current = lock_catalog(&state)?;
    let current_revision = catalog::revision(&current);
    let previous_hash = current.registry_sha256.clone();
    match catalog::load_remote().await {
        Ok((remote, registry_text)) => {
            let remote_revision = catalog::revision(&remote);
            if remote_revision < current_revision
                || (remote_revision == current_revision && remote.registry_sha256 != previous_hash)
            {
                eprintln!(
                    "Ignored remote catalog revision {remote_revision}; current revision is {current_revision}"
                );
                return publish_catalog(
                    &app,
                    &state,
                    CatalogStatus {
                        status: "current".into(),
                        message: "远程主题目录较旧，继续使用本地较新版本".into(),
                    },
                );
            }
            let changed = remote.registry_sha256 != previous_hash;
            if let Err(error) = catalog::save_cached(&app, &remote, &registry_text) {
                eprintln!("{error}");
            }
            *state
                .catalog
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner()) = Some(remote);
            publish_catalog(
                &app,
                &state,
                CatalogStatus {
                    status: if changed { "updated" } else { "current" }.into(),
                    message: if changed {
                        "主题目录已更新"
                    } else {
                        "主题目录已经是最新"
                    }
                    .into(),
                },
            )
        }
        Err(error) => {
            eprintln!("Catalog refresh failed: {error}");
            publish_catalog(
                &app,
                &state,
                CatalogStatus {
                    status: "offline".into(),
                    message: "网络目录暂不可用，继续使用已验证的本地版本".into(),
                },
            )
        }
    }
}

#[tauri::command]
fn copy_theme(
    state: State<'_, DesktopState>,
    theme_id: String,
    mode: String,
) -> Result<CopyView, String> {
    let catalog = lock_catalog(&state)?;
    let value = catalog::native_value_for(&catalog, &theme_id, &mode)?;
    Clipboard::new()
        .and_then(|mut clipboard| clipboard.set_text(value))
        .map_err(|error| format!("无法写入剪贴板：{error}"))?;
    Ok(CopyView {
        ok: true,
        theme_id,
        mode,
    })
}

#[tauri::command]
fn open_codex(channel: String) -> Result<platform::TargetView, String> {
    platform::launch_target(&channel)
}

#[tauri::command]
async fn apply_full_skin(
    app: AppHandle,
    state: State<'_, DesktopState>,
    theme_id: String,
    mode: String,
    channel: String,
) -> Result<skin_runtime::SkinRuntimeView, String> {
    let catalog = lock_catalog(&state)?;
    skin_runtime::apply(
        &app,
        &state.skin_runtime,
        &catalog,
        &theme_id,
        &mode,
        &channel,
    )
    .await
}

#[tauri::command]
async fn restore_full_skin(
    state: State<'_, DesktopState>,
) -> Result<skin_runtime::SkinRuntimeView, String> {
    skin_runtime::restore(&state.skin_runtime).await
}

#[tauri::command]
fn get_skin_state(state: State<'_, DesktopState>) -> skin_runtime::SkinRuntimeView {
    state.skin_runtime.current()
}

#[tauri::command]
fn get_persistence_state(app: AppHandle) -> Result<persistence::PersistenceView, String> {
    persistence::current(&app)
}

#[tauri::command]
fn enable_persistent_theme(
    app: AppHandle,
    state: State<'_, DesktopState>,
    theme_id: String,
    mode: String,
    channel: String,
    consent: bool,
) -> Result<persistence::PersistenceView, String> {
    let catalog = lock_catalog(&state)?;
    persistence::enable(&app, &catalog, &theme_id, &mode, &channel, consent)
}

#[tauri::command]
async fn disable_persistent_theme(
    app: AppHandle,
    state: State<'_, DesktopState>,
) -> Result<persistence::PersistenceView, String> {
    let _ = skin_runtime::restore(&state.skin_runtime).await;
    persistence::disable(&app)
}

#[tauri::command]
fn open_external(app: AppHandle, target: String) -> Result<bool, String> {
    let url = match target.as_str() {
        "gallery" => "https://rwang23.github.io/awesome-codex-theme/",
        "repository" => "https://github.com/rwang23/awesome-codex-theme",
        "releases" => "https://github.com/rwang23/awesome-codex-theme/releases",
        _ => return Err("未知的外部链接目标".into()),
    };
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|error| format!("无法打开外部链接：{error}"))?;
    Ok(true)
}

#[tauri::command]
async fn check_for_app_update(
    app: AppHandle,
    state: State<'_, DesktopState>,
) -> Result<UpdateView, String> {
    Ok(state.updater.check(&app).await)
}

#[tauri::command]
fn install_app_update(app: AppHandle, state: State<'_, DesktopState>) -> Result<bool, String> {
    state.updater.install(&app)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    install_crypto_provider();
    tauri::Builder::default()
        .manage(DesktopState::default())
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .arg("--persistence-controller")
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(updater::updater_plugin())
        .setup(|app| {
            let state = app.state::<DesktopState>();
            initialize_catalog(app.handle(), &state).map_err(|error| {
                std::io::Error::other(format!("Theme Manager setup failed: {error}"))
            })?;
            if persistence::is_controller_mode() {
                if let Some(window) = app.get_webview_window("main") {
                    window
                        .hide()
                        .map_err(|error| std::io::Error::other(error.to_string()))?;
                }
                persistence::start_controller(app.handle().clone());
            } else if let Some(window) = app.get_webview_window("main") {
                window
                    .show()
                    .map_err(|error| std::io::Error::other(error.to_string()))?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            bootstrap,
            refresh_catalog,
            copy_theme,
            open_codex,
            apply_full_skin,
            restore_full_skin,
            get_skin_state,
            get_persistence_state,
            enable_persistent_theme,
            disable_persistent_theme,
            open_external,
            check_for_app_update,
            install_app_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running Awesome Codex Theme");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn installs_the_shared_rustls_crypto_provider() {
        install_crypto_provider();
        assert!(rustls::crypto::CryptoProvider::get_default().is_some());
    }
}
