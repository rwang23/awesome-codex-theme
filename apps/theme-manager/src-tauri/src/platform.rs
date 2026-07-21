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
    bundle_id: Option<String>,
    #[cfg(target_os = "macos")]
    #[serde(default, skip_serializing)]
    bundle_path: Option<String>,
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

#[cfg(any(target_os = "macos", test))]
fn macos_application_names(channel: &str) -> &'static [&'static str] {
    match channel {
        "stable" => &["ChatGPT", "Codex"],
        "beta" => &["ChatGPT Beta", "Codex Beta"],
        _ => &[],
    }
}

#[cfg(any(target_os = "macos", test))]
fn macos_named_bundle_paths(home: &str, names: &[&str]) -> Vec<String> {
    names
        .iter()
        .flat_map(|name| {
            [
                format!("/Applications/{name}.app"),
                format!("{}/Applications/{name}.app", home.trim_end_matches('/')),
            ]
        })
        .collect()
}

#[cfg(target_os = "macos")]
fn macos_plist_value(info: &std::path::Path, key: &str) -> Option<String> {
    std::process::Command::new("/usr/bin/plutil")
        .args(["-extract", key, "raw", "-o", "-", info.to_str()?])
        .output()
        .ok()
        .filter(|output| output.status.success())
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .map(|value| value.trim().to_owned())
}

#[cfg(target_os = "macos")]
fn macos_target_from_bundle(
    channel: &str,
    label: &str,
    expected_bundle: &str,
    bundle_path: &str,
) -> Option<TargetView> {
    let bundle_path = bundle_path.trim().trim_end_matches('/');
    if !bundle_path.starts_with('/') || !bundle_path.ends_with(".app") {
        return None;
    }
    let info = std::path::Path::new(bundle_path)
        .join("Contents")
        .join("Info.plist");
    if macos_plist_value(&info, "CFBundleIdentifier").as_deref() != Some(expected_bundle) {
        return None;
    }
    let executable_name = macos_plist_value(&info, "CFBundleExecutable")?;
    let executable_path = std::path::Path::new(bundle_path)
        .join("Contents")
        .join("MacOS")
        .join(executable_name);
    if !executable_path.is_file() {
        return None;
    }
    Some(TargetView {
        channel: channel.into(),
        label: label.into(),
        version: macos_plist_value(&info, "CFBundleShortVersionString")
            .or_else(|| macos_plist_value(&info, "CFBundleVersion")),
        bundle_id: Some(expected_bundle.into()),
        bundle_path: Some(bundle_path.into()),
        executable_path: Some(executable_path.to_string_lossy().into_owned()),
    })
}

#[cfg(target_os = "macos")]
fn discover_macos_target(channel: &str, label: &str, expected_bundle: &str) -> Option<TargetView> {
    let home = std::env::var("HOME").ok().unwrap_or_default();
    let names = macos_application_names(channel);
    for candidate in macos_named_bundle_paths(&home, names) {
        if let Some(target) = macos_target_from_bundle(channel, label, expected_bundle, &candidate)
        {
            return Some(target);
        }
    }
    let output = std::process::Command::new("/usr/bin/mdfind")
        .arg(format!(
            "kMDItemCFBundleIdentifier == \"{expected_bundle}\""
        ))
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8(output.stdout)
        .ok()?
        .lines()
        .find_map(|candidate| macos_target_from_bundle(channel, label, expected_bundle, candidate))
}

#[cfg(target_os = "macos")]
fn discover_platform_targets() -> Result<Vec<TargetView>, String> {
    Ok([
        ("stable", "ChatGPT", "com.openai.codex"),
        ("beta", "ChatGPT Beta", "com.openai.codex.beta"),
    ]
    .into_iter()
    .filter_map(|(channel, label, bundle_id)| discover_macos_target(channel, label, bundle_id))
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
    let bundle_path = macos_bundle_path(target)?;
    let arguments = macos_open_arguments(bundle_path, None)?;
    run_macos_open(&arguments, "无法打开 ChatGPT")
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

#[cfg(any(target_os = "windows", target_os = "macos", test))]
fn full_skin_launch_arguments(arguments: &str) -> Result<Vec<String>, String> {
    let values = arguments
        .split_ascii_whitespace()
        .map(str::to_owned)
        .collect::<Vec<_>>();
    let has_valid_port = values
        .get(1)
        .and_then(|value| value.strip_prefix("--remote-debugging-port="))
        .and_then(|value| value.parse::<u16>().ok())
        .is_some_and(|port| port >= 1024);
    if values.len() != 2
        || values.first().map(String::as_str) != Some("--remote-debugging-address=127.0.0.1")
        || !has_valid_port
    {
        return Err("Full Skin 启动参数无效".into());
    }
    Ok(values)
}

#[cfg(any(target_os = "windows", test))]
fn windows_full_skin_launch_arguments(arguments: &str) -> Result<Vec<String>, String> {
    full_skin_launch_arguments(arguments)
}

#[cfg(target_os = "windows")]
fn launch_platform_target_with_arguments(
    target: &TargetView,
    arguments: &str,
) -> Result<(), String> {
    let executable = target
        .executable_path
        .as_deref()
        .ok_or("Windows 可执行文件身份缺失")?;
    let package = target
        .package_full_name
        .as_deref()
        .ok_or("Windows 包身份缺失")?;
    let expected_package_path = format!("\\{package}\\app\\").to_ascii_lowercase();
    if !executable
        .replace('/', "\\")
        .to_ascii_lowercase()
        .contains(&expected_package_path)
    {
        return Err("Windows Full Skin 目标可执行文件不属于所选 ChatGPT 包".into());
    }
    let arguments = windows_full_skin_launch_arguments(arguments)?;
    hidden_command(executable)
        .args(arguments)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("无法以 Full Skin 模式启动 ChatGPT：{error}"))
}

#[cfg(target_os = "macos")]
fn launch_platform_target_with_arguments(
    target: &TargetView,
    arguments: &str,
) -> Result<(), String> {
    let bundle_path = macos_bundle_path(target)?;
    let open_arguments = macos_open_arguments(bundle_path, Some(arguments))?;
    run_macos_open(&open_arguments, "无法以 Full Skin 模式打开 ChatGPT")?;
    std::thread::sleep(std::time::Duration::from_millis(500));
    if target_is_running(target)? {
        return Ok(());
    }
    let executable = target
        .executable_path
        .as_deref()
        .ok_or("macOS 可执行文件身份缺失")?;
    std::process::Command::new(executable)
        .args(full_skin_launch_arguments(arguments)?)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("无法以 Full Skin 模式直接启动 ChatGPT：{error}"))
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
    let package = target
        .package_full_name
        .as_deref()
        .ok_or("Windows 包身份缺失")?;
    let script = r#"
$ErrorActionPreference = "Stop"
$matches = @(Get-Process | ForEach-Object {
  try { $path = $_.Path } catch { $path = $null }
  if ($path -and
      $path -ieq $env:ACT_EXECUTABLE -and
      $path -like ("*\" + $env:ACT_PACKAGE + "\*")) {
    $_
  }
})
if ($matches.Count -eq 0) { "false" } else { "true" }
"#;
    let output = hidden_command("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .env("ACT_EXECUTABLE", executable)
        .env("ACT_PACKAGE", package)
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
    let process_name = std::path::Path::new(executable)
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or("macOS 可执行文件名称无效")?;
    let output = std::process::Command::new("/usr/bin/pgrep")
        .args(["-x", process_name])
        .output()
        .map_err(|error| format!("无法检查 macOS ChatGPT 进程：{error}"))?;
    if !output.status.success() {
        return Ok(false);
    }
    for pid in String::from_utf8_lossy(&output.stdout).lines() {
        if macos_process_matches_executable(pid.trim(), executable)? {
            return Ok(true);
        }
    }
    Ok(false)
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
$ErrorActionPreference = "Stop"
$matches = @(Get-Process | ForEach-Object {
  try { $path = $_.Path } catch { $path = $null }
  if ($path -and
      $path -ieq $env:ACT_EXECUTABLE -and
      $path -like ("*\" + $env:ACT_PACKAGE + "\*")) {
    $_
  }
})
foreach ($match in $matches) {
  Stop-Process -Id $match.Id -Force -ErrorAction Stop
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
    let bundle_id = macos_bundle_id(target)?;
    let script = format!("tell application id \"{bundle_id}\" to quit");
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

#[cfg(any(target_os = "windows", test))]
fn windows_listener_owner_pid(output: &str, port: u16) -> Option<u32> {
    output.lines().find_map(|line| {
        let fields = line.split_ascii_whitespace().collect::<Vec<_>>();
        if fields.len() != 5
            || !fields[0].eq_ignore_ascii_case("TCP")
            || !fields[3].eq_ignore_ascii_case("LISTENING")
        {
            return None;
        }
        let (host, candidate_port) = fields[1].rsplit_once(":")?;
        if !matches!(host, "127.0.0.1" | "::1" | "[::1]")
            || candidate_port.parse::<u16>().ok()? != port
        {
            return None;
        }
        fields[4].parse::<u32>().ok()
    })
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
    let listeners = hidden_command("netstat.exe")
        .args(["-ano", "-p", "tcp"])
        .output()
        .map_err(|error| format!("无法检查 Windows CDP 监听：{error}"))?;
    if !listeners.status.success() {
        return Err("Windows CDP 监听检查失败".into());
    }
    let Some(owner_pid) =
        windows_listener_owner_pid(&String::from_utf8_lossy(&listeners.stdout), port)
    else {
        return Ok(false);
    };
    let process = hidden_command("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "(Get-Process -Id ([int]$env:ACT_OWNER_PID) -ErrorAction Stop).Path",
        ])
        .env("ACT_OWNER_PID", owner_pid.to_string())
        .output()
        .map_err(|error| format!("无法检查 Windows CDP 所有者：{error}"))?;
    if !process.status.success() {
        return Ok(false);
    }
    let actual = String::from_utf8_lossy(&process.stdout)
        .trim()
        .replace("/", "\\");
    let expected = executable.replace("/", "\\");
    let package_fragment = format!("\\{package}\\").to_ascii_lowercase();
    Ok(actual.eq_ignore_ascii_case(&expected)
        && actual.to_ascii_lowercase().contains(&package_fragment))
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
    let mut found = false;
    for pid in String::from_utf8_lossy(&output.stdout).lines() {
        found = true;
        if !macos_process_is_target_or_descendant(pid.trim(), executable)? {
            return Ok(false);
        }
    }
    Ok(found)
}

#[cfg(target_os = "macos")]
fn macos_bundle_id(target: &TargetView) -> Result<&str, String> {
    let bundle_id = target.bundle_id.as_deref().ok_or("macOS Bundle ID 缺失")?;
    if !matches!(bundle_id, "com.openai.codex" | "com.openai.codex.beta") {
        return Err("macOS Bundle ID 无效".into());
    }
    Ok(bundle_id)
}

#[cfg(target_os = "macos")]
fn macos_bundle_path(target: &TargetView) -> Result<&str, String> {
    let bundle_path = target
        .bundle_path
        .as_deref()
        .ok_or("macOS 应用包路径缺失")?;
    macos_open_arguments(bundle_path, None)?;
    Ok(bundle_path)
}

#[cfg(any(target_os = "macos", test))]
fn macos_open_arguments(bundle_path: &str, arguments: Option<&str>) -> Result<Vec<String>, String> {
    let bundle_path = bundle_path.trim_end_matches('/');
    if !bundle_path.starts_with('/') || !bundle_path.ends_with(".app") || bundle_path.contains('\0')
    {
        return Err("macOS 应用包路径无效".into());
    }
    let mut command = vec!["-n".into(), bundle_path.into()];
    if let Some(arguments) = arguments {
        let arguments = full_skin_launch_arguments(arguments)?;
        command.push("--args".into());
        command.extend(arguments);
    }
    Ok(command)
}

#[cfg(target_os = "macos")]
fn run_macos_open(arguments: &[String], context: &str) -> Result<(), String> {
    let output = std::process::Command::new("/usr/bin/open")
        .args(arguments)
        .output()
        .map_err(|error| format!("{context}：{error}"))?;
    if output.status.success() {
        return Ok(());
    }
    let detail = String::from_utf8_lossy(&output.stderr).trim().to_owned();
    if detail.is_empty() {
        Err(format!("{context}：LaunchServices 拒绝了启动请求"))
    } else {
        Err(format!("{context}：{detail}"))
    }
}

#[cfg(target_os = "macos")]
fn macos_process_matches_executable(pid: &str, executable: &str) -> Result<bool, String> {
    if pid.is_empty() || !pid.chars().all(|character| character.is_ascii_digit()) {
        return Ok(false);
    }
    let expected = std::fs::canonicalize(executable)
        .map_err(|error| format!("无法解析 macOS ChatGPT 可执行文件：{error}"))?;
    let output = std::process::Command::new("/usr/sbin/lsof")
        .args(["-n", "-a", "-p", pid, "-d", "txt", "-Fn"])
        .output()
        .map_err(|error| format!("无法读取 macOS 进程可执行文件：{error}"))?;
    if !output.status.success() {
        return Ok(false);
    }
    for line in String::from_utf8_lossy(&output.stdout).lines() {
        let Some(path) = line.strip_prefix('n') else {
            continue;
        };
        if std::fs::canonicalize(path).is_ok_and(|candidate| candidate == expected) {
            return Ok(true);
        }
    }
    Ok(false)
}

#[cfg(target_os = "macos")]
fn macos_process_is_target_or_descendant(pid: &str, executable: &str) -> Result<bool, String> {
    let mut current = pid.to_owned();
    for _ in 0..32 {
        if macos_process_matches_executable(&current, executable)? {
            return Ok(true);
        }
        let output = std::process::Command::new("/bin/ps")
            .args(["-p", &current, "-o", "ppid="])
            .output()
            .map_err(|error| format!("无法读取 macOS ChatGPT 父进程：{error}"))?;
        if !output.status.success() {
            return Ok(false);
        }
        let parent = String::from_utf8_lossy(&output.stdout).trim().to_owned();
        if parent.is_empty()
            || parent == current
            || parent == "1"
            || !parent.chars().all(|character| character.is_ascii_digit())
        {
            return Ok(false);
        }
        current = parent;
    }
    Ok(false)
}

#[cfg(any(target_os = "macos", test))]
fn persistence_host_path_is_durable(path: &str) -> bool {
    !path.starts_with("/Volumes/") && path.contains(".app/Contents/MacOS/")
}

#[cfg(target_os = "macos")]
pub fn validate_persistence_host() -> Result<(), String> {
    let executable = std::env::current_exe()
        .and_then(std::fs::canonicalize)
        .map_err(|error| format!("无法定位 Theme Manager 安装路径：{error}"))?;
    let path = executable.to_string_lossy();
    if !persistence_host_path_is_durable(&path) {
        return Err("请先把 Awesome Codex Theme 拖入 Applications，再开启“始终应用”。".into());
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn validate_persistence_host() -> Result<(), String> {
    Ok(())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn listener_belongs_to_target(_port: u16, _target: &TargetView) -> Result<bool, String> {
    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn macos_persistence_rejects_transient_disk_images() {
        assert!(!persistence_host_path_is_durable(
            "/Volumes/Awesome Codex Theme/Awesome Codex Theme.app/Contents/MacOS/awesome-codex-theme",
        ));
        assert!(persistence_host_path_is_durable(
            "/Applications/Awesome Codex Theme.app/Contents/MacOS/awesome-codex-theme",
        ));
        assert!(persistence_host_path_is_durable(
            "/Users/test/Applications/Awesome Codex Theme.app/Contents/MacOS/awesome-codex-theme",
        ));
        assert!(!persistence_host_path_is_durable(
            "/usr/local/bin/awesome-codex-theme"
        ));
    }

    #[test]
    fn macos_full_skin_launches_an_exact_bundle_as_a_new_instance() {
        let arguments = macos_open_arguments(
            "/Applications/ChatGPT.app/",
            Some("--remote-debugging-address=127.0.0.1 --remote-debugging-port=49152"),
        )
        .expect("valid bundle launch arguments");
        assert_eq!(
            arguments,
            vec![
                "-n",
                "/Applications/ChatGPT.app",
                "--args",
                "--remote-debugging-address=127.0.0.1",
                "--remote-debugging-port=49152",
            ]
        );
    }

    #[test]
    fn macos_full_skin_rejects_a_bundle_identifier_as_a_path() {
        assert!(macos_open_arguments("com.openai.codex", None).is_err());
    }

    #[test]
    fn macos_discovery_supports_current_and_legacy_app_names() {
        assert_eq!(macos_application_names("stable"), ["ChatGPT", "Codex"]);
        assert_eq!(
            macos_application_names("beta"),
            ["ChatGPT Beta", "Codex Beta"]
        );
        assert_eq!(
            macos_named_bundle_paths("/Users/test", macos_application_names("stable")),
            vec![
                "/Applications/ChatGPT.app",
                "/Users/test/Applications/ChatGPT.app",
                "/Applications/Codex.app",
                "/Users/test/Applications/Codex.app",
            ]
        );
    }

    #[test]
    fn windows_listener_owner_parser_requires_the_exact_loopback_port() {
        let output = r#"
  TCP    127.0.0.1:49152        0.0.0.0:0              LISTENING       4242
  TCP    0.0.0.0:49153          0.0.0.0:0              LISTENING       5151
"#;
        assert_eq!(windows_listener_owner_pid(output, 49152), Some(4242));
        assert_eq!(windows_listener_owner_pid(output, 49153), None);
        assert_eq!(windows_listener_owner_pid(output, 49154), None);
    }

    #[test]
    fn windows_full_skin_launch_forwards_only_the_pinned_loopback_flags() {
        assert_eq!(
            windows_full_skin_launch_arguments(
                "--remote-debugging-address=127.0.0.1 --remote-debugging-port=49152",
            ),
            Ok(vec![
                "--remote-debugging-address=127.0.0.1".into(),
                "--remote-debugging-port=49152".into(),
            ])
        );
        assert!(
            windows_full_skin_launch_arguments(
                "--remote-debugging-address=0.0.0.0 --remote-debugging-port=49152",
            )
            .is_err()
        );
        assert!(
            windows_full_skin_launch_arguments(
                "--remote-debugging-address=127.0.0.1 --remote-debugging-port=80",
            )
            .is_err()
        );
    }
}
