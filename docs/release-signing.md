# Beta 发布信任与签名

首个公开 Beta 采用一个明确的临时边界：

- 必须使用 Tauri updater 签名；
- 暂不要求 Windows Authenticode；
- 暂不要求 Apple Developer ID 与 notarization；
- macOS app bundle 使用 Tauri 配置的 ad-hoc 签名，只验证包内完整性；
- Release 先创建为 draft，标题和版本明确标成 Beta；
- README 和 Release Notes 必须说明系统仍可能显示未知发布者。

这让项目可以先验证下载、安装、应用、恢复和自动更新链路，但不能把安装包描述成已经获得 Windows 或 macOS 的系统级信任。

## 四类签名不能混用

| 信任层 | 首个 Beta | 它解决的问题 |
| --- | --- | --- |
| Tauri updater 签名 | 必须 | 已安装的 Theme Manager 验证后续更新是否来自同一密钥 |
| Windows Authenticode | 延后 | 发布者身份、SmartScreen 与企业策略信任 |
| macOS ad-hoc 签名 | 必须 | 验证 app bundle 内部完整性，不提供开发者身份 |
| Apple Developer ID + notarization | 延后 | Gatekeeper、公证与普通 Mac 下载体验 |

Tauri updater 与 macOS ad-hoc 签名都不会消除 SmartScreen 或 Gatekeeper 提示，也不会给初次下载的安装包增加系统发布者身份。

## 生成 updater 密钥

updater 密钥不需要开发者账号，也不需要付费。请在安全的本机目录生成，使用强密码，并保留一份离线备份：

```powershell
Set-Location C:\projects\50-developer\codex-tools\awesome-codex-theme\apps\theme-manager
npm run tauri -- signer generate -- -w C:\Secure\awesome-codex-theme-updater.key
```

不要把私钥、密码或完整密钥输出放进仓库、Issue、聊天、日志或截图。

生成后配置：

- GitHub Secret `TAURI_SIGNING_PRIVATE_KEY`
- GitHub Secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- GitHub Variable `TAURI_UPDATER_PUBKEY`

私钥丢失后，已经安装的应用无法验证由新密钥签出的更新。至少保留一份离线备份，并记录由谁持有和如何恢复。Tauri 的更新签名要求见
[Tauri Updater: Signing updates](https://v2.tauri.app/plugin/updater/#signing-updates)。

## GitHub Actions 设置

打开：

```text
Repository Settings
  -> Secrets and variables
  -> Actions
```

先添加三个 updater 值。全部就绪并完成本地验证后，再添加：

```text
DESKTOP_RELEASE_READY=true
```

这个变量只表示：

- updater 密钥已经配置；
- 当前 commit 已通过校验；
- 可以由版本 tag 创建 updater-signed draft Beta Release。

它不表示 Windows 或 Apple 平台签名已经完成。

当前 `.github/workflows/desktop.yml` 在版本 tag 与该变量同时满足时：

1. 生成并验证公共主题产物；
2. 构建 Windows x64 NSIS；
3. 构建 Apple Silicon 与 Intel 的 app、DMG 和 updater archive；
4. 生成 Tauri updater 产物与 `.sig`；
5. 创建 draft Beta Release。

当前 updater endpoint 使用 GitHub 的
`/releases/latest/download/latest.json`。[GitHub 官方规定](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)
`latest` 只返回非 draft、非 prerelease 的 Release，因此工作流把
`prerelease` 标志设为 `false`。
Beta 身份由 `0.x` alpha 版本号、Release 标题和正文明确表达。发布前仍保留
draft，人工检查后才公开。若以后改用独立的 Beta 更新清单，再把 GitHub 的
prerelease 标志恢复为 `true`。

工作流不再要求 `WINDOWS_CERTIFICATE` 或 Apple 凭据。

## 首个 Beta 的用户提示

### Windows

未做 Authenticode 的 NSIS 可以运行，但浏览器、SmartScreen 或企业策略可能显示未知发布者。文档只能告诉用户如何查看提示和确认来源，不能要求关闭 SmartScreen。

### macOS

使用 ad-hoc 签名、但没有 Developer ID 和公证的 DMG 仍可能被 Gatekeeper 阻止。测试者只应在系统设置的 Privacy & Security 中对这一个应用选择 **Open Anyway**。不要关闭 Gatekeeper，也不要执行全局解除隔离命令。

因此 macOS Beta 可以提供给明确知情的测试者，但还不是面向完全小白的无摩擦安装体验。

## 发布步骤

在创建版本 tag 前：

1. `npm run check` 全部通过；
2. Windows NSIS 本地构建通过；
3. Stable/Beta 的应用与恢复结果没有回归；
4. macOS 两个 DMG 的 CI 结构、架构与 ad-hoc `codesign` 检查通过；
5. updater 公钥已经进入 release 配置；
6. GitHub Secrets 与 Variable 已配置；
7. Release Notes 包含“无 Windows Authenticode、Apple Developer ID 和公证”的醒目说明；
8. `DESKTOP_RELEASE_READY=true`。

推送 tag 后，先检查 draft Release：

- 三个平台资产是否齐全；
- updater `.sig` 是否存在；
- Apple Silicon 与 Intel 是否都包含 `.app.tar.gz` 和对应 `.sig`；
- `latest.json` 或平台更新元数据是否引用准确资产；
- 文件名、架构、字节数和 SHA-256；
- Release 标题、alpha 版本和正文是否明确写出 Beta；
- GitHub `prerelease` 标志是否为 `false`，确保 updater 的 `latest` endpoint 可发现；
- 警告文案是否可见。

检查完成后才能手动发布 Beta Release；GitHub 的 `prerelease` 标志仍保持
`false`，由版本号、标题与正文表达 Beta 身份。创建 tag、推送和发布 Release
都是远端状态变更，需要单独执行。

## 以后补齐平台签名

### Windows

优先评估 SignPath Foundation 或 Azure Artifact Signing，再考虑传统 OV 证书。接入后必须验证 Authenticode、时间戳和下载后的 SmartScreen 体验。

参考：

- [Microsoft code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- [Tauri Windows code signing](https://v2.tauri.app/distribute/sign/windows/)

### macOS

面向普通用户时仍需要 Apple Developer Program、Developer ID Application 证书和 notarization。证书必须在 Mac 上创建或导入，CI 还要保存 Apple 凭据并验证 `codesign`、`spctl` 和公证票据。

参考：

- [Apple Developer Program enrollment](https://developer.apple.com/programs/enroll/)
- [Apple Developer ID certificates](https://developer.apple.com/help/account/certificates/create-developer-id-certificates/)
- [Tauri macOS code signing](https://v2.tauri.app/distribute/sign/macos/)

平台签名以后应使用独立变量重新设门禁，不要改变
`DESKTOP_RELEASE_READY` 已经定义的 updater-signed Beta 语义。

## English summary

The public beta requires Tauri updater signatures and an ad-hoc macOS bundle signature, while intentionally deferring Windows Authenticode, Apple Developer ID, and notarization. The updater signature authenticates future in-app updates; the ad-hoc signature checks bundle integrity. Neither establishes operating-system publisher trust. Tagged builds create a draft Beta Release only after updater keys and validation are ready. Because GitHub's `latest` route excludes prereleases, the GitHub prerelease flag remains false while the alpha version, title, and body clearly identify the build as Beta. Release notes must disclose the platform-trust boundary, and agents must never disable SmartScreen or Gatekeeper on the user's behalf.
