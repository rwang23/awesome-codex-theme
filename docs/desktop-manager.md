# 桌面主题管理器

Awesome Codex Theme Manager 是 Windows 与 macOS 共用的 Tauri 2 应用。它浏览 Registry 中的真实截图，并把所选 `ACT Full Skin v1` 应用到准确的 ChatGPT Stable 或 Beta 会话。

## 技术选择

| 方案 | 结果 |
| --- | --- |
| Electron | 能快速开发，但会为一个小型管理器附带 Chromium 和 Node.js |
| Tauri 2 | 复用系统 WebView，前端保持简单，Rust 负责高权限边界 |
| 两套原生应用 | UI 和安装逻辑都要重复维护 |

项目使用：

```text
Tauri 2
HTML / CSS / JavaScript
Rust stable
GitHub Pages Registry
GitHub Actions
GitHub Releases
```

Windows 开发不需要 Xcode。macOS 构建由 GitHub Actions 的 macOS runner 完成；正式分发仍需要 Apple Developer 证书、公证和真机测试。

## 界面

管理器提供：

- 根据系统语言自动选择中文或英文，并允许手动切换和记住选择；
- 馆藏、素材来源与授权、视觉表达三类组合筛选；
- 双语搜索和主题列表；
- 56 张真实 Beta 明暗截图；
- Stable/Beta 目标选择；
- 应用、重新应用和恢复；
- Native 配色复制；
- Registry 状态；
- 应用更新状态。

![Theme Manager Windows 实机截图](assets/theme-manager-windows.png)

截图来自 release EXE 的真实 WebView2 页面。主按钮处于应用成功状态，内嵌预览来自同一 Beta 测试批次。

## Rust 命令边界

前端通过 Tauri bridge 调用有限命令：

```text
bootstrap
refresh_catalog
copy_theme
apply_full_skin
restore_full_skin
open_external
check_for_app_update
install_app_update
```

前端不拼接下载路径，不读取原始 Native 值，不访问任意文件，也不能直接连接任意调试端口。

## Registry 与素材

管理器包含一个构建时 Registry，以及从 56 张已验证实机截图确定性缩放出的
720×405 浏览缩略图。完整 1440×810 证据仍保留在仓库和 Pages；桌面包不重复
携带全部原始 PNG。启动后，管理器会读取 GitHub Pages 的
`downloads/catalog.json`，先核对 Registry URL、SHA-256、字节数、主题数和
模式数，再下载 Registry。远端失败时使用上次验证的缓存或内置目录。

Full Skin 图片按需下载。Rust 要求：

- URL 由固定 Pages 根地址和 Registry 相对路径组成；
- 响应长度不超过上限；
- 字节数与 Registry 一致；
- 文件头是 PNG；
- SHA-256 完全一致。

通过后，图片写入应用缓存。临时文件先写入同目录，再原子重命名。

## Windows 会话

Windows 目标从已安装 Store 包读取，不依赖猜测路径。管理器记录：

- Package Family Name；
- Package Full Name；
- AUMID；
- 准确 executable path；
- version。

如果目标正在普通模式运行，应用操作停止并要求用户退出。管理器不强制结束 ChatGPT。

关闭后，管理器用 `IApplicationActivationManager::ActivateApplication` 把仅限回环的 CDP 参数传给准确 AUMID。监听出现后，Rust再次核对端口所有者和包路径，再读取 `/json/list`。

## 注入与恢复

每次应用会：

1. 移除上一个管理器会话。
2. 生成由固定模板、声明式主题数据和已验证 PNG 组成的脚本。
3. 为每个 `app://` page target 注册 early script。
4. 在当前页面立即执行。
5. 读回主题 ID、模式和运行时标记。
6. 把 target ID、early script ID 和会话信息留在内存。

恢复会移除每个 early script，并调用页面 cleanup。用户退出并正常重开 ChatGPT 后，调试端口随进程关闭。

完整皮肤是会话级行为。关闭 ChatGPT 并从系统正常打开后会回到原生界面，需要由
Theme Manager 再次应用。这样可以避免修改应用包；代价是它不是跨进程永久保存的
皮肤。

## 已完成的 Windows 证据

- Rust 1.97.1 编译通过；
- 5 个 Rust 测试通过；
- x64 release EXE 构建通过；
- NSIS 安装包构建通过；
- 管理器真实 UI 完成应用与恢复；
- Beta 页面读回主题 ID、模式、style、caption 和根 class；
- 恢复后所有标记消失；
- 28 套主题、56 个模式完成实机截图；
- Pages 构建包含 56 张 Full Skin 原图。

## 发布与签名

正式 Windows Release 需要可信代码签名。当前 PFX 路径使用：

- `WINDOWS_CERTIFICATE`：Base64 编码的代码签名 PFX；
- `WINDOWS_CERTIFICATE_PASSWORD`：PFX 导出密码；
- `WINDOWS_TIMESTAMP_URL`：证书颁发方提供的时间戳地址；
- 已部署 Pages 的无缓存端到端测试；
- `TAURI_SIGNING_PRIVATE_KEY`、密码和
  `TAURI_UPDATER_PUBKEY`，用于不可关闭的 updater 签名校验；
- GitHub Release 元数据与签名。

正式 macOS Release 还需要：

- Developer ID Application 证书；
- `APPLE_CERTIFICATE`、证书密码和签名身份；
- `APPLE_ID`、app-specific password 与 `APPLE_TEAM_ID` 公证凭据；
- Apple Silicon 与 Intel 构建；
- 至少一台真实 Mac 的安装、启动、应用、恢复读回。

仓库可以生成未签名测试包，但不会把它标成正式发行版。

Windows 也可以改用 SignPath Foundation 或 Azure Artifact Signing。macOS
账号、证书、GitHub Secrets 与 updater 密钥的逐项配置见
[桌面发布签名配置](release-signing.md)。

CI 只有在仓库变量 `DESKTOP_RELEASE_READY=true` 且推送版本 tag 时才会走
签名发布路径。Windows runner 会把 PFX 临时导入当前用户证书库，检查私钥和
有效期，再把准确 thumbprint 写进一次性 Tauri 配置；PFX 临时文件随后删除。
macOS runner 会在构建前检查签名和公证字段。缺少任意门槛时，工作流只上传
未签名的 CI 测试产物，不创建正式 Release。

未签名 macOS CI 路径还会执行 `hdiutil verify`，挂载 DMG，并检查 Bundle ID、
声明的可执行文件和目标 CPU 架构。它证明构建产物结构正确，但不能替代
Gatekeeper、公证、ChatGPT 识别与 Full Skin 真机读回。执行步骤见
[macOS 测试清单](macos-testing.md)。

## 自动更新

主题目录更新和应用更新是两条链路：

- Registry 通过 GitHub Pages 更新，始终经过描述文件和 Schema 校验。
- 应用通过 GitHub Releases 和 Tauri updater 更新，必须有发布签名。

应用可以下载更新，但安装发生在用户点击并重启后。没有 updater 公钥的构建会显示“签名通道尚未发布”，不会伪装成在线更新。

## English summary

The manager uses Tauri 2 with a dependency-free bilingual frontend and a Rust security boundary. It selects language from the operating system, supports a manual override, and combines collection, rights, and visual-form facets. Rust validates the catalog, downloads hash-bound PNGs, launches the exact Stable or Beta package with a loopback-only CDP port, injects one fixed runtime, and records enough session state to restore it. Windows build and real-app apply/restore are verified. macOS CI verifies both DMG architectures, while public distribution remains gated on signing, notarization, and physical-device readback.
