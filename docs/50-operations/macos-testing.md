# macOS 测试清单

每个正式 Beta Release 都会在 GitHub Actions 中生成两份 DMG：

- Apple Silicon：选择文件名中含有 `macOS-Apple-Silicon` 的 DMG。
- Intel：选择文件名中含有 `macOS-Intel` 的 DMG。

这证明 Tauri 应用能在两个 macOS 目标上编译和打包。CI 还会验证 app bundle 的 ad-hoc 签名，但它不等于 Apple Developer ID 或公证，也没有证明 Gatekeeper、ChatGPT 识别、Full Skin 应用和恢复在真实 Mac 上可用。公开 Beta 的版本、标题和正文必须明确标成 Beta，并提示未知发布者。

## 测试机器

首轮优先使用 Apple Silicon Mac。开始前记录：

```bash
uname -m
sw_vers
```

还要记录 ChatGPT 应用的实际路径、Bundle ID 和版本。新版本可能叫
`ChatGPT.app`，旧版本也可能仍叫 `Codex.app`。不要根据文件名判断身份：

```bash
target_app="/Applications/ChatGPT.app" # 如实际名称是 Codex.app，请替换这里
mdls -name kMDItemCFBundleIdentifier "$target_app"
defaults read "$target_app/Contents/Info" CFBundleShortVersionString
```

如果应用不在 `/Applications`，先在 Finder 中确认准确位置，再替换命令中的路径。Beta 需要单独记录。

## 安装测试包

1. 从指定 GitHub Actions run 下载与机器架构匹配的 artifact。
2. 对照维护者提供的 SHA-256。
3. 打开 DMG，把 Awesome Codex Theme 拖到 Applications。
4. 第一次启动时记录 Gatekeeper 的完整提示。

只有 ad-hoc 签名、没有 Developer ID 和公证的 Beta 仍可能被 macOS 阻止。测试者可以在系统设置的 Privacy & Security 中对这一个应用选择 Open Anyway。不要关闭 Gatekeeper，也不要运行全局解除隔离的命令。Apple 的用户步骤见 [Open a Mac app from an unidentified developer](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac)。

不要直接从已挂载的 DMG 开启“始终应用”。控制器会拒绝 `/Volumes/...`
中的临时路径，也会拒绝不位于标准 `.app/Contents/MacOS/` 结构内的可执行文件。
这是为了避免 LaunchAgent 在 DMG 卸载或应用移动后指向一个失效路径。先把应用拖到
Applications，再从 Applications 启动并开启常驻。

以后完成 Apple 签名的候选版本不应出现这个手动放行步骤。该候选必须通过：

```bash
codesign --verify --deep --strict --verbose=2 "/Applications/Awesome Codex Theme.app"
spctl --assess --type execute --verbose=4 "/Applications/Awesome Codex Theme.app"
```

## Theme Manager 界面

检查以下行为：

1. 中文系统默认显示中文，其他系统语言默认显示英文。
2. 顶栏语言按钮可以在中文和英文之间切换，重启后记住选择。
3. 系列、来源和风格筛选可以组合；没有结果时不能应用一张隐藏的旧主题。
4. 明暗模式、主题截图和目标 ChatGPT 列表正常显示。
5. Registry 在线刷新失败时，应用继续使用已验证的内置或缓存目录。
6. 中文界面优先显示“提博大神 / 重置之神”，英文界面优先显示
   “Saint Tibo / God of Reset”；手动切换语言后列表立即重新排序。

## Full Skin 真机流程

首轮要分别验证目标已关闭和目标正在普通模式运行两种情况：

1. 完全退出准备测试的 ChatGPT Stable 或 Beta，再打开 Theme Manager。
2. 选择主题、明暗模式和准确的 ChatGPT 目标。
3. 点击 Apply & Keep Full Skin / 应用并保持完整皮肤。
4. 确认应用内说明。确认面板必须显示在 Theme Manager 内，不能依赖系统浏览器弹窗。
5. 等待控制器启动准确目标并回报 `active`，再记录背景、半透明材质、文字、composer 和侧栏。
6. 在同一会话中切换一次主题和模式。
7. 关闭并从系统正常打开 ChatGPT，确认主题重新生效。
8. 保持 ChatGPT 以普通模式运行，重新执行第 2 至第 5 步，确认控制器只受控重开所选目标一次。
9. 点击 Restore native / 恢复原生，确认运行时、LaunchAgent 和调试端口都已清理。

当前实现会检查四个常见名称，并用 Spotlight 查找其他位置，但候选包必须通过准确的
Bundle ID 和 executable path 校验。控制器先使用
`open -n <bundle path> --args` 启动新实例；如果 LaunchServices 没有真正启动目标，
再调用同一个已验证 bundle 的可执行文件。退出仍绑定 Bundle ID，监听端口必须属于
准确的 executable path 或其有界子进程。Stable 与 Beta 即使显示名称相近，也不能互相冒充。

检查端口时，先取目标 ChatGPT 的准确 PID，再查看该进程的监听；端口不是固定值：

```bash
pid="$(pgrep -x 'ChatGPT' | head -n 1)"
lsof -nP -a -p "$pid" -iTCP -sTCP:LISTEN
```

Beta 的进程名不同时，应按上一步记录的 bundle executable name 替换
`ChatGPT`。恢复只移除主题运行时；完全退出 ChatGPT 并正常重开后，不应再有
Theme Manager 启动的监听。

## 必须保留的证据

- macOS 版本与 CPU 架构
- DMG 文件名、字节数和 SHA-256
- Theme Manager 版本
- ChatGPT 路径、Bundle ID 和版本
- 应用前、应用后、恢复后的截图
- 端口所有者读回
- 语言默认值和手动切换结果
- Gatekeeper、`codesign`、`spctl` 和公证结果

截图要使用空白任务页，不得包含账号、聊天、项目名或本机路径。

## Codex 更新后的处理

Full Skin 不修改 ChatGPT 应用文件，所以更新不会破坏安装器或污染应用目录。它仍依赖当前版本的进程身份、CDP 行为和页面选择器。ChatGPT 更新后先做只读 probe，再做一次应用和恢复；未通过前不能沿用旧版本的兼容声明。

macOS 源码已经包含与 Windows 共用的无补丁常驻控制器路径，但目前只有 Windows 完成真实应用闭环。Mac 用户关闭并正常重开 ChatGPT 后，仍应按会话级行为验收；在 Apple Silicon 真机完成 autostart、受控重开、应用、恢复和端口清理前，不宣传 Mac 常驻能力。

Tauri autostart 在 macOS 默认使用当前用户的 LaunchAgent。源码与跨平台测试可以
验证参数、路径门禁和状态机，但不能替代真机上的 `launchctl`、Gatekeeper 和目标
ChatGPT 读回。参考 [Tauri Autostart](https://v2.tauri.app/plugin/autostart/)、
[Tauri DMG distribution](https://v2.tauri.app/distribute/dmg/) 和
[Tauri macOS signing](https://v2.tauri.app/distribute/sign/macos/)。

## English summary

The two CI-built DMGs prove that the application compiles and packages for Apple Silicon and Intel. CI also verifies each app's ad-hoc bundle signature; this is not Apple Developer ID signing or notarization. Persistence is rejected when the manager runs from a mounted DMG or outside a valid app bundle. A physical Mac test must still verify system-language selection, catalog filtering, the exact ChatGPT bundle identity, Theme Manager launch, Full Skin apply and restore, LaunchAgent registration, loopback listener ownership, Gatekeeper behavior, and cleanup after a normal ChatGPT restart. Until that action-after evidence exists, macOS Full Skin remains a session-scoped claim.
