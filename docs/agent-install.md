# Agent 安装契约

这份说明让用户把安装工作交给 Codex、Claude Code 或其他本机 coding agent，同时避免 Agent 自行修改 ChatGPT 应用文件、绕过系统保护或从非官方来源下载。

## 给普通用户的可复制指令

```text
请从 Awesome Codex Theme 的官方仓库安装 Theme Manager：
https://github.com/rwang23/awesome-codex-theme

先识别我的操作系统和 CPU 架构，只能使用 rwang23 在官方 GitHub Releases
发布的安装包。不要修改 WindowsApps、ChatGPT.app、app.asar、应用私有数据或
聊天内容。不要擅自绕过系统安全提示，也不要在没有征得我同意时关闭正在运行的
ChatGPT/Codex。如果当前没有兼容的 Release，请停止并告诉我，不要从其他来源
下载，也不要自行从源码构建。
```

## Agent 必须执行的检查

1. 确认仓库 owner 是 `rwang23`，仓库名是 `awesome-codex-theme`。
2. 只读取官方 [Releases](https://github.com/rwang23/awesome-codex-theme/releases)。
3. 识别平台和 CPU：
   - Windows 首版目标为 x64 NSIS；
   - Apple Silicon 使用 `aarch64` 或 `arm64` DMG；
   - Intel Mac 使用 `x64` 或 `x86_64` DMG。
4. Release 没有匹配文件时停止，不从镜像站、网盘、fork 或聊天附件寻找替代包。
5. 下载后报告文件名、字节数、Release tag 和来源 URL。若 Release 提供校验和，必须核对。
6. 安装前确认 ChatGPT/Codex 是否正在运行。需要退出时先征得用户同意，让应用正常退出，不强制结束进程。
7. 首次启动 Theme Manager 后，让用户选择主题、明暗模式和 Stable/Beta 目标，再执行应用。
8. 应用后核对背景、原生侧栏、输入框和恢复按钮，不把“窗口能打开”当成主题已生效。

## 首个 Beta 的签名边界

公开 Beta 要求 Tauri updater 签名；macOS 应用包还带有 ad-hoc 完整性签名。它们不能替代：

- Windows Authenticode；
- Apple Developer ID；
- Apple notarization；
- SmartScreen 或 Gatekeeper 的系统信誉。

因此 Agent 可以解释系统提示和打开对应设置页面，但不能：

- 关闭 SmartScreen、Gatekeeper 或杀毒软件；
- 执行全局解除隔离命令；
- 把未知发布者提示描述成“已经完成系统签名”；
- 在用户没有明确同意时替用户点击放行。

Mac 用户如需测试未公证 Beta，只对这一个应用使用系统设置中的 **Open Anyway**。不要运行 `spctl --master-disable`，也不要递归清除其他文件的 quarantine 属性。

## 主题应用边界

“应用并保持完整皮肤”会先保存用户选择，再由当前用户级控制器启动或受控重开准确的 ChatGPT 目标。界面必须等到控制器回报 `active` 才能显示成功。Windows 控制器已经在准确 ChatGPT Beta `26.715.3651.0` 上完成常驻和清理闭环；它会在以后启动时安全重放主题，不会把主题写进应用。

Agent 可以向检测到的 Stable/Beta 目标介绍这个开关，但不得把“可发起本机探测”说成“已经兼容”。首次应用必须让用户在应用内确认，因为控制器会注册当前用户登录启动项，并可能关闭和重开用户选择的准确 ChatGPT 通道一次。只有端口、页面和运行时标记的本机读回成功后，那个准确版本才可在以后自动重放；新版本会保持原生，直到用户明确重新应用。macOS 真机常驻尚未验证，Agent 不得在 Mac 上承诺该能力。实现与证据见 [persistent-theme.md](persistent-theme.md)。

Agent 不得：

- 修改 WindowsApps 权限或文件；
- 替换 `ChatGPT.app` 内资源；
- 解包或重写 `app.asar`；
- 读取聊天、账号、Cookie、Token 或应用私有数据；
- 执行主题包携带的脚本；
- 在 Registry 哈希不匹配时继续安装。

## 源码预览指令

只有用户明确要求从源码测试，而且电脑已经具备 Node.js、Rust 和平台构建工具时，才使用下面的指令：

```text
请从 https://github.com/rwang23/awesome-codex-theme 克隆官方仓库。
先显示当前 commit 和 git status，再运行 npm run check 与 npm run desktop:check。
不要修改 ChatGPT/Codex 应用文件，不要注册系统启动项，不要创建 Release。
检查通过后启动开发版 Theme Manager，并在关闭或重启 ChatGPT 前征得我同意。
```

这条路径适合贡献者，不是普通用户安装方式。

## Agent 完成时应报告

- 使用的官方 Release tag 与资产名称；
- 操作系统和 CPU 架构；
- Theme Manager 是否正常启动；
- 用户选择的 Stable/Beta 目标；
- Full Skin 是否通过真实页面读回；
- 用户是否主动开启“始终应用”，以及启动项状态；
- 是否完成恢复测试；
- 是否遇到 SmartScreen 或 Gatekeeper；
- 哪些步骤仍未验证。

## English agent prompt

```text
Install Awesome Codex Theme Manager from the official repository:
https://github.com/rwang23/awesome-codex-theme

Detect my operating system and CPU architecture. Use only an installer published
by rwang23 on the official GitHub Releases page. Do not modify WindowsApps,
ChatGPT.app, app.asar, private app data, or conversations. Do not bypass an
operating-system security warning or close a running ChatGPT/Codex session
without asking me first. If no compatible release exists, stop and tell me
instead of building or downloading from another source.
```
