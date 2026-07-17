use std::sync::{
    Arc, Mutex,
    atomic::{AtomicU64, Ordering},
};

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::{Update, UpdaterExt};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateView {
    pub status: String,
    pub version: Option<String>,
    pub percent: Option<u8>,
    pub message: Option<String>,
}

struct PendingUpdate {
    update: Update,
    bytes: Vec<u8>,
}

pub struct UpdateRuntime {
    view: Mutex<UpdateView>,
    pending: Mutex<Option<PendingUpdate>>,
}

fn configured_public_key() -> Option<&'static str> {
    option_env!("ACT_UPDATER_PUBKEY").filter(|value| !value.trim().is_empty())
}

fn initial_view() -> UpdateView {
    let (status, message) = if cfg!(debug_assertions) {
        ("development", None)
    } else if configured_public_key().is_none() {
        ("unreleased", Some("桌面更新签名通道尚未发布".to_owned()))
    } else {
        ("idle", None)
    };
    UpdateView {
        status: status.into(),
        version: None,
        percent: None,
        message,
    }
}

impl Default for UpdateRuntime {
    fn default() -> Self {
        Self {
            view: Mutex::new(initial_view()),
            pending: Mutex::new(None),
        }
    }
}

impl UpdateRuntime {
    pub fn current(&self) -> UpdateView {
        self.view
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone()
    }

    fn publish(&self, app: &AppHandle, view: UpdateView) -> UpdateView {
        *self
            .view
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()) = view.clone();
        let _ = app.emit("act:update-state", &view);
        view
    }

    fn publish_error(&self, app: &AppHandle, error: &str) -> UpdateView {
        let lower = error.to_ascii_lowercase();
        let unreleased =
            lower.contains("404") || lower.contains("not found") || lower.contains("no published");
        self.publish(
            app,
            UpdateView {
                status: if unreleased { "unreleased" } else { "error" }.into(),
                version: None,
                percent: None,
                message: Some(
                    if unreleased {
                        "桌面更新通道尚未发布"
                    } else {
                        "暂时无法检查应用更新"
                    }
                    .into(),
                ),
            },
        )
    }

    pub async fn check(&self, app: &AppHandle) -> UpdateView {
        if cfg!(debug_assertions) || configured_public_key().is_none() {
            let view = initial_view();
            return self.publish(app, view);
        }

        self.publish(
            app,
            UpdateView {
                status: "checking".into(),
                version: None,
                percent: None,
                message: None,
            },
        );

        let updater = match app.updater() {
            Ok(updater) => updater,
            Err(error) => return self.publish_error(app, &error.to_string()),
        };
        let update = match updater.check().await {
            Ok(Some(update)) => update,
            Ok(None) => {
                return self.publish(
                    app,
                    UpdateView {
                        status: "current".into(),
                        version: None,
                        percent: None,
                        message: None,
                    },
                );
            }
            Err(error) => return self.publish_error(app, &error.to_string()),
        };

        let version = update.version.clone();
        self.publish(
            app,
            UpdateView {
                status: "downloading".into(),
                version: Some(version.clone()),
                percent: Some(0),
                message: None,
            },
        );

        let downloaded = Arc::new(AtomicU64::new(0));
        let last_percent = Arc::new(AtomicU64::new(u64::MAX));
        let callback_app = app.clone();
        let callback_version = version.clone();
        let callback_runtime = self;
        let bytes = match update
            .download(
                move |chunk, total| {
                    let current =
                        downloaded.fetch_add(chunk as u64, Ordering::Relaxed) + chunk as u64;
                    let Some(total) = total.filter(|total| *total > 0) else {
                        return;
                    };
                    let percent = ((current.saturating_mul(100) / total).min(100)) as u8;
                    if last_percent.swap(percent as u64, Ordering::Relaxed) != percent as u64 {
                        callback_runtime.publish(
                            &callback_app,
                            UpdateView {
                                status: "downloading".into(),
                                version: Some(callback_version.clone()),
                                percent: Some(percent),
                                message: None,
                            },
                        );
                    }
                },
                || {},
            )
            .await
        {
            Ok(bytes) => bytes,
            Err(error) => return self.publish_error(app, &error.to_string()),
        };

        *self
            .pending
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()) =
            Some(PendingUpdate { update, bytes });
        self.publish(
            app,
            UpdateView {
                status: "ready".into(),
                version: Some(version),
                percent: Some(100),
                message: None,
            },
        )
    }

    pub fn install(&self, app: &AppHandle) -> Result<bool, String> {
        let pending = self
            .pending
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .take();
        let Some(pending) = pending else {
            return Ok(false);
        };
        pending
            .update
            .install(&pending.bytes)
            .map_err(|error| format!("无法安装应用更新：{error}"))?;
        app.restart()
    }
}

pub fn updater_plugin<R: tauri::Runtime>()
-> tauri::plugin::TauriPlugin<R, tauri_plugin_updater::Config> {
    let builder = tauri_plugin_updater::Builder::new();
    let builder = if let Some(public_key) = configured_public_key() {
        builder.pubkey(public_key)
    } else {
        builder
    };
    builder.build()
}
