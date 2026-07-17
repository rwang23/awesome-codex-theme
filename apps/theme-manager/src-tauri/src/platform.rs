use serde::{Deserialize, Serialize};

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetView {
    pub channel: String,
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[cfg(target_os = "windows")]
    #[serde(default, skip_serializing)]
    launch_id: Option<String>,
    #[cfg(target_os = "macos")]
    #[serde(default, skip_serializing)]
    app_name: Option<String>,
}

#[cfg(target_os = "windows")]
const WINDOWS_TARGET_SCRIPT: &str = r#"
$definitions = @(
  @{ channel = "stable"; package = "OpenAI.Codex"; executable = "app\ChatGPT.exe"; label = "ChatGPT" },
  @{ channel = "beta"; package = "OpenAI.CodexBeta"; executable = "app\ChatGPT (Beta).exe"; label = "ChatGPT Beta" }
)
$targets = @()
foreach ($definition in $definitions) {
  $package = Get-AppxPackage -Name $definition.package -ErrorAction SilentlyContinue |
    Sort-Object Version -Descending |
    Select-Object -First 1
  if ($null -eq $package) { continue }
  $manifest = Get-AppxPackageManifest -Package $package -ErrorAction Stop
  $applications = @($manifest.Package.Applications.Application | Where-Object {
    "$($_.Executable)".Replace("/", "\") -ieq $definition.executable
  })
  if ($applications.Count -ne 1) { continue }
  $family = "$($package.PackageFamilyName)"
  $applicationId = "$($applications[0].Id)"
  if ($family -notmatch "^[A-Za-z0-9._-]{1,128}$" -or $applicationId -notmatch "^[A-Za-z0-9._-]{1,64}$") {
    continue
  }
  $targets += @{
    channel = $definition.channel
    label = $definition.label
    version = "$($package.Version)"
    launchId = "$family!$applicationId"
  }
}
@($targets) | ConvertTo-Json -Compress
"#;

#[cfg(target_os = "windows")]
fn hidden_command(program: &str) -> std::process::Command {
    use std::{os::windows::process::CommandExt, process::Command};

    const CREATE_NO_WINDOW: u32 = 0x08000000;
    let mut command = Command::new(program);
    command.creation_flags(CREATE_NO_WINDOW);
    command
}

#[cfg(target_os = "windows")]
fn discover_platform_targets() -> Result<Vec<TargetView>, String> {
    let output = hidden_command("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            WINDOWS_TARGET_SCRIPT,
        ])
        .output()
        .map_err(|error| format!("无法检查 Windows ChatGPT 应用：{error}"))?;
    if !output.status.success() {
        return Err("Windows ChatGPT 应用检查失败".into());
    }
    let text = String::from_utf8(output.stdout)
        .map_err(|error| format!("Windows 应用检查结果不是 UTF-8：{error}"))?;
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }
    let value: serde_json::Value = serde_json::from_str(text.trim())
        .map_err(|error| format!("Windows 应用检查结果无效：{error}"))?;
    if value.is_array() {
        serde_json::from_value(value).map_err(|error| format!("Windows 应用列表无效：{error}"))
    } else {
        serde_json::from_value(value)
            .map(|target| vec![target])
            .map_err(|error| format!("Windows 应用记录无效：{error}"))
    }
}

#[cfg(target_os = "macos")]
fn discover_platform_targets() -> Result<Vec<TargetView>, String> {
    let definitions = [
        ("stable", "ChatGPT", "ChatGPT"),
        ("beta", "ChatGPT Beta", "ChatGPT Beta"),
    ];
    Ok(definitions
        .into_iter()
        .filter_map(|(channel, label, app_name)| {
            std::process::Command::new("/usr/bin/open")
                .args(["-Ra", app_name])
                .status()
                .ok()
                .filter(|status| status.success())
                .map(|_| TargetView {
                    channel: channel.into(),
                    label: label.into(),
                    version: None,
                    app_name: Some(app_name.into()),
                })
        })
        .collect())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn discover_platform_targets() -> Result<Vec<TargetView>, String> {
    Ok(Vec::new())
}

pub fn discover_targets() -> Vec<TargetView> {
    discover_platform_targets().unwrap_or_default()
}

fn safe_channel(channel: &str) -> bool {
    matches!(channel, "stable" | "beta")
}

#[cfg(target_os = "windows")]
fn launch_platform_target(target: &TargetView) -> Result<(), String> {
    let launch_id = target.launch_id.as_deref().ok_or("Windows 应用身份缺失")?;
    let mut parts = launch_id.split('!');
    let family = parts.next().unwrap_or_default();
    let application = parts.next().unwrap_or_default();
    if parts.next().is_some()
        || family.is_empty()
        || family.len() > 128
        || application.is_empty()
        || application.len() > 64
        || !family.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '.' | '_' | '-')
        })
        || !application.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '.' | '_' | '-')
        })
    {
        return Err("Windows 应用身份无效".into());
    }
    hidden_command("explorer.exe")
        .arg(format!("shell:AppsFolder\\{launch_id}"))
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("无法打开 ChatGPT：{error}"))
}

#[cfg(target_os = "macos")]
fn launch_platform_target(target: &TargetView) -> Result<(), String> {
    let app_name = target.app_name.as_deref().ok_or("macOS 应用名称缺失")?;
    if !matches!(app_name, "ChatGPT" | "ChatGPT Beta") {
        return Err("macOS 应用名称无效".into());
    }
    std::process::Command::new("/usr/bin/open")
        .args(["-a", app_name])
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("无法打开 ChatGPT：{error}"))
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn launch_platform_target(_target: &TargetView) -> Result<(), String> {
    Err("当前平台暂不支持启动 ChatGPT".into())
}

pub fn launch_target(channel: &str) -> Result<TargetView, String> {
    if !safe_channel(channel) {
        return Err("未知的 ChatGPT 渠道".into());
    }
    let target = discover_platform_targets()?
        .into_iter()
        .find(|target| target.channel == channel)
        .ok_or("没有检测到所选 ChatGPT 应用")?;
    launch_platform_target(&target)?;
    Ok(target)
}
