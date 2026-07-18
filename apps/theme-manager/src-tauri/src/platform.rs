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
    #[cfg(target_os = "windows")]
    #[serde(default, skip_serializing)]
    executable_path: Option<String>,
    #[cfg(target_os = "windows")]
    #[serde(default, skip_serializing)]
    package_full_name: Option<String>,
    #[cfg(target_os = "macos")]
    #[serde(default, skip_serializing)]
    app_name: Option<String>,
    #[cfg(target_os = "macos")]
    #[serde(default, skip_serializing)]
    executable_path: Option<String>,
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
    executablePath = (Join-Path "$($package.InstallLocation)" $definition.executable)
    packageFullName = "$($package.PackageFullName)"
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
        ("stable", "ChatGPT", "ChatGPT", "com.openai.codex"),
        (
            "beta",
            "ChatGPT Beta",
            "ChatGPT Beta",
            "com.openai.codex.beta",
        ),
    ];
    Ok(definitions
        .into_iter()
        .filter_map(|(channel, label, app_name, expected_bundle)| {
            let script = format!("POSIX path of (path to application \"{app_name}\")");
            let output = std::process::Command::new("/usr/bin/osascript")
                .args(["-e", &script])
                .output()
                .ok()?;
            if !output.status.success() {
                return None;
            }
            let app_path = String::from_utf8(output.stdout).ok()?.trim().to_owned();
            if !app_path.ends_with(".app/") && !app_path.ends_with(".app") {
                return None;
            }
            let info = std::path::Path::new(app_path.trim_end_matches('/'))
                .join("Contents")
                .join("Info.plist");
            let plist = |key: &str| {
                std::process::Command::new("/usr/bin/plutil")
                    .args(["-extract", key, "raw", "-o", "-", info.to_str()?])
                    .output()
                    .ok()
                    .filter(|output| output.status.success())
                    .and_then(|output| String::from_utf8(output.stdout).ok())
                    .map(|value| value.trim().to_owned())
            };
            if plist("CFBundleIdentifier").as_deref() != Some(expected_bundle) {
                return None;
            }
            let executable_name = plist("CFBundleExecutable")?;
            let executable_path = std::path::Path::new(app_path.trim_end_matches('/'))
                .join("Contents")
                .join("MacOS")
                .join(executable_name)
                .to_string_lossy()
                .into_owned();
            Some(TargetView {
                channel: channel.into(),
                label: label.into(),
                version: plist("CFBundleShortVersionString"),
                app_name: Some(app_name.into()),
                executable_path: Some(executable_path),
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

pub fn find_target(channel: &str) -> Result<TargetView, String> {
    if !safe_channel(channel) {
        return Err("未知的 ChatGPT 渠道".into());
    }
    discover_platform_targets()?
        .into_iter()
        .find(|target| target.channel == channel)
        .ok_or_else(|| "没有检测到所选 ChatGPT 应用".into())
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
    let target = find_target(channel)?;
    launch_platform_target(&target)?;
    Ok(target)
}

#[cfg(target_os = "windows")]
const WINDOWS_ACTIVATE_SCRIPT: &str = r#"
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

[ComImport]
[Guid("2e941141-7f97-4756-ba1d-9decde894a3d")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IApplicationActivationManager {
  int ActivateApplication(
    [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
    [MarshalAs(UnmanagedType.LPWStr)] string arguments,
    uint options,
    out uint processId);
  int ActivateForFile(IntPtr appUserModelId, IntPtr itemArray, IntPtr verb, out uint processId);
  int ActivateForProtocol(IntPtr appUserModelId, IntPtr itemArray, out uint processId);
}

public static class ActPackageLauncher {
  public static uint Launch(string appUserModelId, string arguments) {
    Type type = Type.GetTypeFromCLSID(new Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C"));
    IApplicationActivationManager manager =
      (IApplicationActivationManager)Activator.CreateInstance(type);
    uint processId;
    int result = manager.ActivateApplication(appUserModelId, arguments, 0, out processId);
    if (result < 0) Marshal.ThrowExceptionForHR(result);
    return processId;
  }
}
'@
[ActPackageLauncher]::Launch($env:ACT_AUMID, $env:ACT_ARGUMENTS)
"#;

#[cfg(target_os = "windows")]
fn launch_platform_target_with_arguments(
    target: &TargetView,
    arguments: &str,
) -> Result<(), String> {
    let launch_id = target.launch_id.as_deref().ok_or("Windows 应用身份缺失")?;
    let output = hidden_command("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            WINDOWS_ACTIVATE_SCRIPT,
        ])
        .env("ACT_AUMID", launch_id)
        .env("ACT_ARGUMENTS", arguments)
        .output()
        .map_err(|error| format!("无法以 Full Skin 模式启动 ChatGPT：{error}"))?;
    if !output.status.success() {
        return Err("Windows 无法激活所选 ChatGPT Full Skin 会话".into());
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn launch_platform_target_with_arguments(
    target: &TargetView,
    arguments: &str,
) -> Result<(), String> {
    let app_name = target.app_name.as_deref().ok_or("macOS 应用名称缺失")?;
    if !matches!(app_name, "ChatGPT" | "ChatGPT Beta") {
        return Err("macOS 应用名称无效".into());
    }
    let arguments = arguments.split_ascii_whitespace().collect::<Vec<_>>();
    std::process::Command::new("/usr/bin/open")
        .args(["-a", app_name, "--args"])
        .args(arguments)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("无法以 Full Skin 模式打开 ChatGPT：{error}"))
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn launch_platform_target_with_arguments(
    _target: &TargetView,
    _arguments: &str,
) -> Result<(), String> {
    Err("当前平台暂不支持 Full Skin".into())
}

pub fn launch_target_with_arguments(channel: &str, arguments: &str) -> Result<TargetView, String> {
    let target = find_target(channel)?;
    launch_platform_target_with_arguments(&target, arguments)?;
    Ok(target)
}

#[cfg(target_os = "windows")]
pub fn target_is_running(target: &TargetView) -> Result<bool, String> {
    let executable = target
        .executable_path
        .as_deref()
        .ok_or("Windows 可执行文件身份缺失")?;
    let script = r#"
$target = $env:ACT_EXECUTABLE
$match = Get-CimInstance Win32_Process -ErrorAction Stop |
  Where-Object { $_.ExecutablePath -and $_.ExecutablePath -ieq $target } |
  Select-Object -First 1
if ($null -eq $match) { "false" } else { "true" }
"#;
    let output = hidden_command("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .env("ACT_EXECUTABLE", executable)
        .output()
        .map_err(|error| format!("无法检查 ChatGPT 进程：{error}"))?;
    Ok(output.status.success() && String::from_utf8_lossy(&output.stdout).trim() == "true")
}

#[cfg(target_os = "macos")]
pub fn target_is_running(target: &TargetView) -> Result<bool, String> {
    let executable = target
        .executable_path
        .as_deref()
        .ok_or("macOS 可执行文件身份缺失")?;
    let output = std::process::Command::new("/bin/ps")
        .args(["-axo", "comm="])
        .output()
        .map_err(|error| format!("无法检查 macOS ChatGPT 进程：{error}"))?;
    if !output.status.success() {
        return Err("无法读取 macOS 进程列表".into());
    }
    Ok(String::from_utf8_lossy(&output.stdout)
        .lines()
        .any(|process| process.trim() == executable))
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn target_is_running(_target: &TargetView) -> Result<bool, String> {
    Ok(false)
}

#[cfg(target_os = "windows")]
pub fn stop_target(target: &TargetView) -> Result<(), String> {
    let executable = target
        .executable_path
        .as_deref()
        .ok_or("Windows 可执行文件身份缺失")?;
    let package = target
        .package_full_name
        .as_deref()
        .ok_or("Windows 包身份缺失")?;
    let script = r#"
$matches = @(Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
  $_.ExecutablePath -and
  $_.ExecutablePath -ieq $env:ACT_EXECUTABLE -and
  $_.ExecutablePath -like ("*\" + $env:ACT_PACKAGE + "\*")
})
foreach ($match in $matches) {
  Stop-Process -Id $match.ProcessId -Force -ErrorAction Stop
}
"true"
"#;
    let output = hidden_command("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .env("ACT_EXECUTABLE", executable)
        .env("ACT_PACKAGE", package)
        .output()
        .map_err(|error| format!("无法关闭所选 ChatGPT：{error}"))?;
    if !output.status.success() || String::from_utf8_lossy(&output.stdout).trim() != "true" {
        return Err("无法安全关闭所选 ChatGPT".into());
    }
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn stop_target(target: &TargetView) -> Result<(), String> {
    let app_name = target.app_name.as_deref().ok_or("macOS 应用名称缺失")?;
    if !matches!(app_name, "ChatGPT" | "ChatGPT Beta") {
        return Err("macOS 应用名称无效".into());
    }
    let script = format!("tell application \"{app_name}\" to quit");
    let output = std::process::Command::new("/usr/bin/osascript")
        .args(["-e", &script])
        .output()
        .map_err(|error| format!("无法请求 macOS ChatGPT 退出：{error}"))?;
    if !output.status.success() {
        return Err("macOS ChatGPT 没有接受安全退出请求".into());
    }
    Ok(())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn stop_target(_target: &TargetView) -> Result<(), String> {
    Err("当前平台暂不支持受控重启".into())
}

#[cfg(target_os = "windows")]
pub fn listener_belongs_to_target(port: u16, target: &TargetView) -> Result<bool, String> {
    let executable = target
        .executable_path
        .as_deref()
        .ok_or("Windows 可执行文件身份缺失")?;
    let package = target
        .package_full_name
        .as_deref()
        .ok_or("Windows 包身份缺失")?;
    let script = r#"
$connection = Get-NetTCPConnection -State Listen -LocalPort ([int]$env:ACT_PORT) -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalAddress -in @("127.0.0.1", "::1") } |
  Select-Object -First 1
if ($null -eq $connection) { "false"; exit 0 }
$process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction Stop
$matches = $process.ExecutablePath -and
  $process.ExecutablePath -ieq $env:ACT_EXECUTABLE -and
  $process.ExecutablePath -like ("*\" + $env:ACT_PACKAGE + "\*")
if ($matches) { "true" } else { "false" }
"#;
    let output = hidden_command("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .env("ACT_PORT", port.to_string())
        .env("ACT_EXECUTABLE", executable)
        .env("ACT_PACKAGE", package)
        .output()
        .map_err(|error| format!("无法验证 CDP 监听进程：{error}"))?;
    Ok(output.status.success() && String::from_utf8_lossy(&output.stdout).trim() == "true")
}

#[cfg(target_os = "macos")]
pub fn listener_belongs_to_target(port: u16, target: &TargetView) -> Result<bool, String> {
    let executable = target
        .executable_path
        .as_deref()
        .ok_or("macOS 可执行文件身份缺失")?;
    let output = std::process::Command::new("/usr/sbin/lsof")
        .args(["-nP", "-a", &format!("-iTCP:{port}"), "-sTCP:LISTEN", "-t"])
        .output()
        .map_err(|error| format!("无法验证 macOS CDP 监听进程：{error}"))?;
    if !output.status.success() {
        return Ok(false);
    }
    for pid in String::from_utf8_lossy(&output.stdout).lines() {
        let process = std::process::Command::new("/bin/ps")
            .args(["-p", pid.trim(), "-o", "comm="])
            .output()
            .map_err(|error| format!("无法读取 macOS CDP 进程身份：{error}"))?;
        if process.status.success() && String::from_utf8_lossy(&process.stdout).trim() == executable
        {
            return Ok(true);
        }
    }
    Ok(false)
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn listener_belongs_to_target(_port: u16, _target: &TargetView) -> Result<bool, String> {
    Ok(false)
}
