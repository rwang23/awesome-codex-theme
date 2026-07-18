# 桌面发布签名配置

桌面发布涉及三套彼此独立的凭据。它们不能混用，也不要发到聊天、Issue、Pull Request 或仓库文件中。

| 用途 | 是否需要开发者账号 | 当前项目中的配置 |
| --- | --- | --- |
| Tauri 应用更新签名 | 不需要 | 本地生成一对密钥；私钥进入 GitHub Secret，公钥进入 GitHub Variable |
| Windows 安装包签名 | 直接从 GitHub 分发不需要 Microsoft 开发者账号，但需要可信签名身份 | 当前工作流支持 PFX；如果选择 Azure Artifact Signing 或 SignPath，需要切换签名步骤 |
| macOS 签名与公证 | 需要 Apple Developer Program | Developer ID Application 证书、导出的 P12、Apple 公证凭据 |

## 先决定发布者身份

Apple 的个人账号会显示账号持有人的法定姓名。若希望显示组织名称，需要以组织身份加入 Apple Developer Program，通常还要提供 D-U-N-S Number、组织域名和公开网站。个人开发者只需要符合年龄要求的 Apple Account、法定姓名和双重认证。

本项目当前由个人 GitHub 账号 `rwang23` 发布。首版用 Apple 个人账号最省步骤；如果以后成立正式组织，再迁移证书和发布流程。Apple Developer Program 当前是每年 99 美元，地区价格以注册页面为准。申请入口见 [Apple Developer Program enrollment](https://developer.apple.com/programs/enroll/)。

## Tauri updater 密钥

updater 密钥不需要购买，也不需要注册账号。它只证明后续更新与首次安装的应用来自同一个发布者。

在安全的本机目录生成密钥，设置强密码，并做一份离线备份：

```powershell
Set-Location C:\projects\tools\awesome-codex-theme\apps\theme-manager
npm run tauri -- signer generate -- -w C:\Secure\awesome-codex-theme-updater.key
```

生成后：

- 私钥内容保存为 GitHub Secret `TAURI_SIGNING_PRIVATE_KEY`
- 私钥密码保存为 GitHub Secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- 公钥内容保存为 GitHub Variable `TAURI_UPDATER_PUBKEY`

私钥丢失后，已经安装的应用无法验证新更新。不要只把它留在一台电脑上。Tauri updater 的签名校验不能关闭，具体格式见 [Tauri Updater: Signing updates](https://v2.tauri.app/plugin/updater/#signing-updates)。

## Windows 签名怎么选

直接发布 NSIS `setup.exe` 不要求 Microsoft 开发者账号。未签名程序仍可运行，但浏览器下载后会遇到 SmartScreen 或企业策略拦截，不适合面向普通用户的正式 Release。

建议按这个顺序选择：

1. 先申请 [SignPath Foundation](https://signpath.org/) 的开源项目免费签名。是否通过取决于它的项目审核。
2. 如果需要更快落地，并且发布者位于支持地区，使用 Microsoft Azure Artifact Signing。它需要 Azure 账号、订阅和身份验证，适合 CI，不需要导出硬件密钥。
3. 最后再考虑传统 CA 的 OV 代码签名证书。现代 OV 证书通常要求硬件令牌或云 HSM，未必能导出成当前工作流使用的 PFX。

Microsoft 的当前对比与费用范围见 [Code signing options for Windows app developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)。Tauri 同时支持证书指纹和自定义签名命令，见 [Tauri Windows code signing](https://v2.tauri.app/distribute/sign/windows/)。

当前 `.github/workflows/desktop.yml` 的 Windows 发布分支期待：

- Secret `WINDOWS_CERTIFICATE`
- Secret `WINDOWS_CERTIFICATE_PASSWORD`
- Variable `WINDOWS_TIMESTAMP_URL`

这条路径适合可导出的 PFX。选择 Azure Artifact Signing 或 SignPath 后，不要伪造这三个值；应先把工作流改成对应服务的签名方式。

## macOS 账号与证书

正式 GitHub 下载版使用 `Developer ID Application`，不是 App Store 的 `Apple Distribution` 证书。Apple 要求 Developer ID 应用同时完成公证。免费 Apple Developer 账号只能用于开发测试，不能完成面向公众的公证。

准备步骤：

1. 加入 Apple Developer Program。
2. 在一台 Mac 上用 Keychain Access 创建 Certificate Signing Request。
3. 由账号持有人在 Certificates, Identifiers & Profiles 创建 `Developer ID Application` 证书。
4. 把证书和私钥从 Keychain 导出为带密码的 `.p12`。
5. 把 `.p12` 转成 Base64，存入 GitHub Secret，不提交文件。
6. 为 Apple Account 创建 app-specific password，用于公证；不要使用主账号密码。

项目当前期待：

- Secret `APPLE_CERTIFICATE`
- Secret `APPLE_CERTIFICATE_PASSWORD`
- Variable `APPLE_SIGNING_IDENTITY`
- Secret `APPLE_ID`
- Secret `APPLE_PASSWORD`
- Variable `APPLE_TEAM_ID`

证书创建与 CI 导出步骤见 [Apple Developer ID certificates](https://developer.apple.com/help/account/certificates/create-developer-id-certificates/) 和 [Tauri macOS code signing](https://v2.tauri.app/distribute/sign/macos/)。

## GitHub 中放在哪里

打开仓库：

```text
Settings
  -> Secrets and variables
  -> Actions
```

敏感值放在 `Secrets`，可以公开的配置放在 `Variables`。GitHub 不会在保存后再次显示 Secret 内容。官方步骤见 [Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)。

最后才添加：

```text
DESKTOP_RELEASE_READY=true
```

它是发布总开关。证书、updater 密钥和 Mac 真机测试都完成前，不要开启。开启后再推送版本 tag，工作流才会创建带签名更新文件的草稿 Release。

## 当前最省事的行动顺序

1. 申请 Apple Developer Program。
2. 同时提交 SignPath Foundation 申请；若等待时间不合适，再决定 Azure Artifact Signing。
3. 找一台 Apple Silicon Mac 创建证书并执行真机测试。
4. 在安全位置生成 updater 密钥并做离线备份。
5. 只把凭据写入 GitHub Actions。
6. 验证 Windows Authenticode、Apple `codesign`、`spctl` 与公证票据后，再打开 `DESKTOP_RELEASE_READY`。

## English summary

The release uses three independent trust systems. Tauri updater keys are generated locally and require no developer account. Direct Windows distribution needs a trusted signing provider but not a Microsoft developer account; SignPath Foundation is the preferred free application for a qualifying open-source project, with Azure Artifact Signing as the practical fallback. Public macOS distribution requires a paid Apple Developer Program membership, a Developer ID Application certificate, and notarization. Store every private value in GitHub Actions Secrets and enable `DESKTOP_RELEASE_READY` only after signature and physical Mac checks pass.
