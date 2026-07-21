use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    process::Command,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use fs2::FileExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt;

use crate::{DesktopState, catalog, platform, skin_runtime};

const STATE_SCHEMA: u8 = 1;
const CONSENT_VERSION: u8 = 1;
const CONTROLLER_ARGUMENT: &str = "--persistence-controller";
const POLL_INTERVAL: Duration = Duration::from_millis(1200);
const TARGET_WAIT: Duration = Duration::from_secs(20);
const APPLY_REQUESTED_PHASE: &str = "apply-requested";

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PersistentState {
    schema_version: u8,
    enabled: bool,
    consent_version: u8,
    theme_id: Option<String>,
    mode: Option<String>,
    channel: Option<String>,
    phase: String,
    detail: Option<String>,
    target_version: Option<String>,
    tested_version: Option<String>,
    attempts: u8,
    updated_at: u64,
}

impl Default for PersistentState {
    fn default() -> Self {
        Self {
            schema_version: STATE_SCHEMA,
            enabled: false,
            consent_version: 0,
            theme_id: None,
            mode: None,
            channel: None,
            phase: "disabled".into(),
            detail: None,
            target_version: None,
            tested_version: None,
            attempts: 0,
            updated_at: now_epoch(),
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistenceView {
    pub enabled: bool,
    pub autostart_enabled: bool,
    pub consent_version: u8,
    pub theme_id: Option<String>,
    pub mode: Option<String>,
    pub channel: Option<String>,
    pub phase: String,
    pub detail: Option<String>,
    pub target_version: Option<String>,
    pub tested_version: Option<String>,
    pub attempts: u8,
    pub updated_at: u64,
    pub security_note: String,
}

fn now_epoch() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn persistence_root(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|path| path.join("persistence"))
        .map_err(|error| format!("无法定位主题常驻状态目录：{error}"))
}

fn state_path(root: &Path) -> PathBuf {
    root.join("selection.json")
}

fn state_lock_path(root: &Path) -> PathBuf {
    root.join("selection.lock")
}

fn controller_lock_path(root: &Path) -> PathBuf {
    root.join("controller.lock")
}

fn open_lock(path: &Path) -> Result<File, String> {
    OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(path)
        .map_err(|error| format!("无法打开主题常驻状态锁：{error}"))
}

fn read_state_unlocked(root: &Path) -> Result<PersistentState, String> {
    let path = state_path(root);
    let backup = path.with_extension("json.bak");
    if !path.exists() && backup.exists() {
        fs::rename(&backup, &path).map_err(|error| format!("无法恢复主题常驻状态备份：{error}"))?;
    }
    if !path.exists() {
        return Ok(PersistentState::default());
    }
    let text =
        fs::read_to_string(&path).map_err(|error| format!("无法读取主题常驻状态：{error}"))?;
    let state: PersistentState =
        serde_json::from_str(&text).map_err(|error| format!("主题常驻状态无效：{error}"))?;
    if state.schema_version != STATE_SCHEMA {
        return Err("主题常驻状态版本不受支持".into());
    }
    Ok(state)
}

fn read_state_from(root: &Path) -> Result<PersistentState, String> {
    fs::create_dir_all(root).map_err(|error| format!("无法创建主题常驻状态目录：{error}"))?;
    let lock = open_lock(&state_lock_path(root))?;
    lock.lock_exclusive()
        .map_err(|error| format!("无法锁定主题常驻状态：{error}"))?;
    let result = read_state_unlocked(root);
    let _ = FileExt::unlock(&lock);
    result
}

fn write_state_unlocked(root: &Path, state: &PersistentState) -> Result<(), String> {
    let destination = state_path(root);
    let backup = destination.with_extension("json.bak");
    let temporary = root.join(format!("selection.{}.tmp", std::process::id()));
    let bytes = serde_json::to_vec_pretty(state)
        .map_err(|error| format!("无法编码主题常驻状态：{error}"))?;

    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&temporary)
        .map_err(|error| format!("无法写入主题常驻临时状态：{error}"))?;
    file.write_all(&bytes)
        .and_then(|_| file.write_all(b"\n"))
        .and_then(|_| file.sync_all())
        .map_err(|error| format!("无法提交主题常驻临时状态：{error}"))?;
    drop(file);

    if backup.exists() {
        fs::remove_file(&backup).map_err(|error| format!("无法清理旧状态备份：{error}"))?;
    }
    if destination.exists() {
        fs::rename(&destination, &backup)
            .map_err(|error| format!("无法备份主题常驻状态：{error}"))?;
    }
    if let Err(error) = fs::rename(&temporary, &destination) {
        if backup.exists() && !destination.exists() {
            let _ = fs::rename(&backup, &destination);
        }
        return Err(format!("无法原子提交主题常驻状态：{error}"));
    }
    if backup.exists() {
        fs::remove_file(&backup).map_err(|error| format!("无法清理状态备份：{error}"))?;
    }
    Ok(())
}

fn write_state_to(root: &Path, state: &PersistentState) -> Result<(), String> {
    fs::create_dir_all(root).map_err(|error| format!("无法创建主题常驻状态目录：{error}"))?;
    let lock = open_lock(&state_lock_path(root))?;
    lock.lock_exclusive()
        .map_err(|error| format!("无法锁定主题常驻状态：{error}"))?;
    let result = write_state_unlocked(root, state);
    let _ = FileExt::unlock(&lock);
    result
}

fn mutate_state(
    root: &Path,
    update: impl FnOnce(&mut PersistentState),
) -> Result<PersistentState, String> {
    fs::create_dir_all(root).map_err(|error| format!("无法创建主题常驻状态目录：{error}"))?;
    let lock = open_lock(&state_lock_path(root))?;
    lock.lock_exclusive()
        .map_err(|error| format!("无法锁定主题常驻状态：{error}"))?;
    let result = (|| {
        let mut state = read_state_unlocked(root)?;
        update(&mut state);
        state.updated_at = now_epoch();
        write_state_unlocked(root, &state)?;
        Ok(state)
    })();
    let _ = FileExt::unlock(&lock);
    result
}

fn to_view(app: &AppHandle, state: PersistentState) -> PersistenceView {
    PersistenceView {
        enabled: state.enabled,
        autostart_enabled: app.autolaunch().is_enabled().unwrap_or(false),
        consent_version: state.consent_version,
        theme_id: state.theme_id,
        mode: state.mode,
        channel: state.channel,
        phase: state.phase,
        detail: state.detail,
        target_version: state.target_version,
        tested_version: state.tested_version,
        attempts: state.attempts,
        updated_at: state.updated_at,
        security_note: "仅保存用户选择并在登录后运行当前用户级控制器；不会修改 ChatGPT 应用包、默认快捷方式、聊天或私有数据。".into(),
    }
}

pub fn current(app: &AppHandle) -> Result<PersistenceView, String> {
    Ok(to_view(app, read_state_from(&persistence_root(app)?)?))
}

fn same_compatibility_train(installed: &str, tested: &str) -> bool {
    let train = |value: &str| value.split('.').take(2).collect::<Vec<_>>().join(".");
    !installed.trim().is_empty() && !tested.trim().is_empty() && train(installed) == train(tested)
}

fn validate_selection(
    catalog: &catalog::Catalog,
    theme_id: &str,
    mode: &str,
    channel: &str,
) -> Result<(platform::TargetView, catalog::FullSkinDescriptor), String> {
    if !matches!(mode, "light" | "dark") || !matches!(channel, "stable" | "beta") {
        return Err("常驻主题选择无效".into());
    }
    let skin = catalog::full_skin_for(catalog, theme_id, mode)?;
    let target = platform::find_target(channel)?;
    let installed = target
        .version
        .as_deref()
        .ok_or("无法读取所选 ChatGPT 版本；为避免在未知版本自动重启，常驻模式没有开启。")?;
    if !same_compatibility_train(installed, &skin.tested_version) {
        return Err(format!(
            "所选 ChatGPT {installed} 尚未通过常驻兼容验证；当前验证版本为 {}。",
            skin.tested_version
        ));
    }
    Ok((target, skin))
}

#[cfg(target_os = "windows")]
fn hidden_controller_command() -> Result<Command, String> {
    use std::os::windows::process::CommandExt;

    const CREATE_NO_WINDOW: u32 = 0x08000000;
    let executable =
        std::env::current_exe().map_err(|error| format!("无法定位 Theme Manager：{error}"))?;
    let mut command = Command::new(executable);
    command.creation_flags(CREATE_NO_WINDOW);
    Ok(command)
}

#[cfg(not(target_os = "windows"))]
fn hidden_controller_command() -> Result<Command, String> {
    let executable =
        std::env::current_exe().map_err(|error| format!("无法定位 Theme Manager：{error}"))?;
    Ok(Command::new(executable))
}

fn spawn_controller_process() -> Result<(), String> {
    hidden_controller_command()?
        .arg(CONTROLLER_ARGUMENT)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("无法启动主题常驻控制器：{error}"))
}

fn enable_with_phase(
    app: &AppHandle,
    catalog: &catalog::Catalog,
    theme_id: &str,
    mode: &str,
    channel: &str,
    consent: bool,
    phase: &str,
) -> Result<PersistenceView, String> {
    if !consent {
        return Err("需要先确认常驻模式的受控重启与安全说明".into());
    }
    platform::validate_persistence_host()?;
    let (target, skin) = validate_selection(catalog, theme_id, mode, channel)?;
    let root = persistence_root(app)?;
    let previous = read_state_from(&root)?;
    let state = PersistentState {
        schema_version: STATE_SCHEMA,
        enabled: true,
        consent_version: CONSENT_VERSION,
        theme_id: Some(theme_id.into()),
        mode: Some(mode.into()),
        channel: Some(channel.into()),
        phase: phase.into(),
        detail: None,
        target_version: target.version,
        tested_version: Some(skin.tested_version),
        attempts: 0,
        updated_at: now_epoch(),
    };
    write_state_to(&root, &state)?;
    if let Err(error) = app.autolaunch().enable() {
        let _ = write_state_to(&root, &previous);
        return Err(format!("无法注册当前用户登录启动项：{error}"));
    }
    if let Err(error) = spawn_controller_process() {
        if previous.enabled {
            let _ = app.autolaunch().enable();
        } else {
            let _ = app.autolaunch().disable();
        }
        let _ = write_state_to(&root, &previous);
        return Err(error);
    }
    current(app)
}

pub fn enable(
    app: &AppHandle,
    catalog: &catalog::Catalog,
    theme_id: &str,
    mode: &str,
    channel: &str,
    consent: bool,
) -> Result<PersistenceView, String> {
    enable_with_phase(app, catalog, theme_id, mode, channel, consent, "starting")
}

pub fn enable_for_apply(
    app: &AppHandle,
    catalog: &catalog::Catalog,
    theme_id: &str,
    mode: &str,
    channel: &str,
    consent: bool,
) -> Result<PersistenceView, String> {
    enable_with_phase(
        app,
        catalog,
        theme_id,
        mode,
        channel,
        consent,
        APPLY_REQUESTED_PHASE,
    )
}

pub fn disable(app: &AppHandle) -> Result<PersistenceView, String> {
    let root = persistence_root(app)?;
    let previous = read_state_from(&root)?;
    app.autolaunch()
        .disable()
        .map_err(|error| format!("无法移除当前用户登录启动项：{error}"))?;
    if let Err(error) = mutate_state(&root, |state| {
        state.enabled = false;
        state.phase = "disabled".into();
        state.detail = None;
        state.attempts = 0;
    }) {
        if previous.enabled {
            let _ = app.autolaunch().enable();
        }
        return Err(error);
    }
    current(app)
}

pub fn is_controller_mode() -> bool {
    std::env::args().any(|argument| argument == CONTROLLER_ARGUMENT)
}

fn update_status(
    root: &Path,
    phase: &str,
    detail: Option<String>,
    attempts: u8,
    target_version: Option<String>,
    tested_version: Option<String>,
) -> Result<(), String> {
    let current = read_state_from(root)?;
    if !current.enabled && phase != "disabled" {
        return Ok(());
    }
    if current.phase == phase
        && current.detail == detail
        && current.attempts == attempts
        && current.target_version == target_version
        && current.tested_version == tested_version
    {
        return Ok(());
    }
    mutate_state(root, |state| {
        state.phase = phase.into();
        state.detail = detail;
        state.attempts = attempts;
        state.target_version = target_version;
        state.tested_version = tested_version;
    })?;
    Ok(())
}

fn retry_delay(attempt: u8) -> Option<Duration> {
    match attempt {
        0 => Some(Duration::ZERO),
        1 => Some(Duration::from_secs(2)),
        2 => Some(Duration::from_secs(5)),
        _ => None,
    }
}

#[derive(Debug, PartialEq, Eq)]
enum ControllerDecision {
    Wait,
    Blocked,
    ApplyStopped,
    Refresh,
    Active,
    Restart,
}

fn controller_decision(
    phase: &str,
    target_running: bool,
    port_matches: bool,
    desired_active: bool,
) -> ControllerDecision {
    if phase == "retry-blocked" {
        return ControllerDecision::Blocked;
    }
    if !target_running {
        return if matches!(phase, APPLY_REQUESTED_PHASE | "restarting" | "error") {
            ControllerDecision::ApplyStopped
        } else {
            ControllerDecision::Wait
        };
    }
    if !port_matches {
        return ControllerDecision::Restart;
    }
    if desired_active {
        ControllerDecision::Active
    } else {
        ControllerDecision::Refresh
    }
}

async fn wait_until_stopped(target: &platform::TargetView) -> Result<(), String> {
    let deadline = tokio::time::Instant::now() + TARGET_WAIT;
    while tokio::time::Instant::now() < deadline {
        if !platform::target_is_running(target)? {
            return Ok(());
        }
        tokio::time::sleep(Duration::from_millis(250)).await;
    }
    Err("ChatGPT 没有在安全等待时间内退出".into())
}

async fn run_controller(app: AppHandle) -> Result<(), String> {
    let root = persistence_root(&app)?;
    fs::create_dir_all(&root).map_err(|error| format!("无法创建主题常驻状态目录：{error}"))?;
    let controller_lock = open_lock(&controller_lock_path(&root))?;
    if controller_lock.try_lock_exclusive().is_err() {
        return Ok(());
    }

    let mut attempts = 0_u8;
    let mut next_retry = tokio::time::Instant::now();
    loop {
        let selection = read_state_from(&root)?;
        if !selection.enabled {
            let state = app.state::<DesktopState>();
            for retry in 0..3 {
                if skin_runtime::restore(&state.skin_runtime).await.is_ok() {
                    break;
                }
                if retry < 2 {
                    tokio::time::sleep(Duration::from_millis(400)).await;
                }
            }
            break;
        }
        let theme_id = selection.theme_id.as_deref().ok_or("常驻主题 ID 缺失")?;
        let mode = selection.mode.as_deref().ok_or("常驻主题模式缺失")?;
        let channel = selection.channel.as_deref().ok_or("常驻主题渠道缺失")?;

        let state = app.state::<DesktopState>();
        let catalog = crate::lock_catalog(&state)?;
        let skin = match catalog::full_skin_for(&catalog, theme_id, mode) {
            Ok(value) => value,
            Err(error) => {
                update_status(
                    &root,
                    "blocked",
                    Some(error),
                    attempts,
                    None,
                    selection.tested_version,
                )?;
                tokio::time::sleep(Duration::from_secs(5)).await;
                continue;
            }
        };
        let target = match platform::find_target(channel) {
            Ok(value) => value,
            Err(error) => {
                update_status(
                    &root,
                    "target-missing",
                    Some(error),
                    attempts,
                    None,
                    Some(skin.tested_version),
                )?;
                tokio::time::sleep(Duration::from_secs(5)).await;
                continue;
            }
        };
        let installed = target.version.clone();
        if !installed
            .as_deref()
            .is_some_and(|version| same_compatibility_train(version, &skin.tested_version))
        {
            update_status(
                &root,
                "version-blocked",
                Some("检测到未验证的 ChatGPT 版本，已保留原生界面。".into()),
                attempts,
                installed,
                Some(skin.tested_version),
            )?;
            tokio::time::sleep(Duration::from_secs(10)).await;
            continue;
        }

        let target_running = platform::target_is_running(&target)?;
        let runtime = state.skin_runtime.current();
        if !target_running && runtime.active {
            let _ = skin_runtime::restore(&state.skin_runtime).await;
        }
        let port_matches = target_running
            && runtime.channel.as_deref() == Some(channel)
            && runtime.port.is_some_and(|port| {
                platform::listener_belongs_to_target(port, &target).unwrap_or(false)
            });
        let desired_active = runtime.active
            && runtime.theme_id.as_deref() == Some(theme_id)
            && runtime.mode.as_deref() == Some(mode)
            && runtime.channel.as_deref() == Some(channel);
        match controller_decision(
            &selection.phase,
            target_running,
            port_matches,
            desired_active,
        ) {
            ControllerDecision::Blocked => {
                tokio::time::sleep(POLL_INTERVAL).await;
                continue;
            }
            ControllerDecision::Wait => {
                attempts = 0;
                next_retry = tokio::time::Instant::now();
                update_status(
                    &root,
                    "waiting",
                    None,
                    attempts,
                    installed,
                    Some(skin.tested_version),
                )?;
                tokio::time::sleep(POLL_INTERVAL).await;
                continue;
            }
            ControllerDecision::ApplyStopped => {
                attempts = 1;
                update_status(
                    &root,
                    "restarting",
                    None,
                    attempts,
                    installed.clone(),
                    Some(skin.tested_version.clone()),
                )?;
                match skin_runtime::apply(
                    &app,
                    &state.skin_runtime,
                    &catalog,
                    theme_id,
                    mode,
                    channel,
                )
                .await
                {
                    Ok(_) => {
                        attempts = 0;
                        update_status(
                            &root,
                            "active",
                            None,
                            attempts,
                            installed,
                            Some(skin.tested_version),
                        )?;
                    }
                    Err(error) => {
                        update_status(
                            &root,
                            "retry-blocked",
                            Some(error),
                            attempts,
                            installed,
                            Some(skin.tested_version),
                        )?;
                    }
                }
                tokio::time::sleep(POLL_INTERVAL).await;
                continue;
            }
            ControllerDecision::Refresh => {
                match skin_runtime::apply(
                    &app,
                    &state.skin_runtime,
                    &catalog,
                    theme_id,
                    mode,
                    channel,
                )
                .await
                {
                    Ok(_) => attempts = 0,
                    Err(error) => {
                        attempts = attempts.saturating_add(1);
                        update_status(
                            &root,
                            "error",
                            Some(error),
                            attempts,
                            installed,
                            Some(skin.tested_version),
                        )?;
                        tokio::time::sleep(Duration::from_secs(3)).await;
                        continue;
                    }
                }
                update_status(
                    &root,
                    "active",
                    None,
                    attempts,
                    installed,
                    Some(skin.tested_version),
                )?;
                tokio::time::sleep(POLL_INTERVAL).await;
                continue;
            }
            ControllerDecision::Active => {
                update_status(
                    &root,
                    "active",
                    None,
                    attempts,
                    installed,
                    Some(skin.tested_version),
                )?;
                tokio::time::sleep(POLL_INTERVAL).await;
                continue;
            }
            ControllerDecision::Restart => {}
        }

        let Some(delay) = retry_delay(attempts) else {
            update_status(
                &root,
                "retry-blocked",
                Some("本次启动已达到三次安全重试上限，保持原生界面。".into()),
                attempts,
                installed,
                Some(skin.tested_version),
            )?;
            tokio::time::sleep(Duration::from_secs(10)).await;
            continue;
        };
        if tokio::time::Instant::now() < next_retry {
            tokio::time::sleep(POLL_INTERVAL).await;
            continue;
        }
        attempts = attempts.saturating_add(1);
        update_status(
            &root,
            "restarting",
            None,
            attempts,
            installed.clone(),
            Some(skin.tested_version.clone()),
        )?;
        if let Err(error) = platform::stop_target(&target) {
            update_status(
                &root,
                "error",
                Some(error),
                attempts,
                installed,
                Some(skin.tested_version),
            )?;
            next_retry = tokio::time::Instant::now() + delay;
            continue;
        }
        if let Err(error) = wait_until_stopped(&target).await {
            update_status(
                &root,
                "error",
                Some(error),
                attempts,
                installed,
                Some(skin.tested_version),
            )?;
            next_retry = tokio::time::Instant::now() + delay;
            continue;
        }
        match skin_runtime::apply(&app, &state.skin_runtime, &catalog, theme_id, mode, channel)
            .await
        {
            Ok(_) => {
                attempts = 0;
                update_status(
                    &root,
                    "active",
                    None,
                    attempts,
                    installed,
                    Some(skin.tested_version),
                )?;
            }
            Err(error) => {
                update_status(
                    &root,
                    "error",
                    Some(error),
                    attempts,
                    installed,
                    Some(skin.tested_version),
                )?;
                next_retry = tokio::time::Instant::now() + delay;
            }
        }
        tokio::time::sleep(POLL_INTERVAL).await;
    }
    let _ = FileExt::unlock(&controller_lock);
    Ok(())
}

pub fn start_controller(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        if let Err(error) = run_controller(app.clone()).await {
            if let Ok(root) = persistence_root(&app) {
                let _ = update_status(&root, "error", Some(error), 0, None, None);
            }
        }
        app.exit(0);
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_root(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "awesome-codex-theme-{name}-{}-{}",
            std::process::id(),
            now_epoch()
        ))
    }

    #[test]
    fn persistent_state_round_trips_under_lock() {
        let root = test_root("state");
        let state = PersistentState {
            enabled: true,
            consent_version: CONSENT_VERSION,
            theme_id: Some("beijing-meridian".into()),
            mode: Some("dark".into()),
            channel: Some("beta".into()),
            phase: "waiting".into(),
            ..PersistentState::default()
        };
        write_state_to(&root, &state).expect("state should write");
        let loaded = read_state_from(&root).expect("state should read");
        assert!(loaded.enabled);
        assert_eq!(loaded.theme_id.as_deref(), Some("beijing-meridian"));
        assert_eq!(loaded.consent_version, CONSENT_VERSION);
        fs::remove_dir_all(root).expect("test state should clean up");
    }

    #[test]
    fn compatibility_gate_accepts_only_the_tested_release_train() {
        assert!(same_compatibility_train("26.715.3651.0", "26.715.3651.0"));
        assert!(same_compatibility_train("26.715.72221", "26.715.3651.0"));
        assert!(!same_compatibility_train("26.716.1000.0", "26.715.3651.0"));
        assert!(!same_compatibility_train("", "26.715.3651.0"));
    }

    #[test]
    fn retry_budget_is_bounded() {
        assert_eq!(retry_delay(0), Some(Duration::ZERO));
        assert_eq!(retry_delay(1), Some(Duration::from_secs(2)));
        assert_eq!(retry_delay(2), Some(Duration::from_secs(5)));
        assert_eq!(retry_delay(3), None);
    }

    #[test]
    fn explicit_apply_launches_a_stopped_target_but_passive_persistence_waits() {
        assert_eq!(
            controller_decision(APPLY_REQUESTED_PHASE, false, false, false),
            ControllerDecision::ApplyStopped
        );
        assert_eq!(
            controller_decision("starting", false, false, false),
            ControllerDecision::Wait
        );
        assert_eq!(
            controller_decision("waiting", false, false, false),
            ControllerDecision::Wait
        );
        assert_eq!(
            controller_decision("restarting", false, false, false),
            ControllerDecision::ApplyStopped
        );
        assert_eq!(
            controller_decision("error", false, false, false),
            ControllerDecision::ApplyStopped
        );
        assert_eq!(
            controller_decision("retry-blocked", false, false, false),
            ControllerDecision::Blocked
        );
    }

    #[test]
    fn running_targets_are_refreshed_or_restarted_by_listener_identity() {
        assert_eq!(
            controller_decision("active", true, true, true),
            ControllerDecision::Active
        );
        assert_eq!(
            controller_decision("active", true, true, false),
            ControllerDecision::Refresh
        );
        assert_eq!(
            controller_decision(APPLY_REQUESTED_PHASE, true, false, false),
            ControllerDecision::Restart
        );
    }
}
