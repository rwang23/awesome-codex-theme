# macOS 测试清单

项目已经在 GitHub Actions 生成两份 DMG：

- Apple Silicon: `Awesome Codex Theme_0.3.0-alpha.1_aarch64.dmg`
- Intel: `Awesome Codex Theme_0.3.0-alpha.1_x64.dmg`

这证明 Tauri 应用能在两个 macOS 目标上编译和打包。它没有证明 Gatekeeper、ChatGPT 识别、Full Skin 应用和恢复在真实 Mac 上可用。当前 DMG 是未签名 CI 测试产物，不是正式 Release。

## 测试机器

首轮优先使用 Apple Silicon Mac。开始前记录：

```bash
uname -m
sw_vers
```

还要记录 ChatGPT 应用的实际路径、Bundle ID 和版本。不要根据文件名猜：

```bash
mdls -name kMDItemCFBundleIdentifier "/Applications/ChatGPT.app"
defaults read "/Applications/ChatGPT.app/Contents/Info" CFBundleShortVersionString
```

如果应用不在 `/Applications`，先在 Finder 中确认准确位置，再替换命令中的路径。Beta 需要单独记录。

## 安装测试包

1. 从指定 GitHub Actions run 下载与机器架构匹配的 artifact。
2. 对照维护者提供的 SHA-256。
3. 打开 DMG，把 Awesome Codex Theme 拖到 Applications。
4. 第一次启动时记录 Gatekeeper 的完整提示。

未签名 alpha 可能被 macOS 阻止。测试者可以在系统设置的 Privacy & Security 中对这一个应用选择 Open Anyway。不要关闭 Gatekeeper，也不要运行全局解除隔离的命令。Apple 的用户步骤见 [Open a Mac app from an unidentified developer](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac)。

签名候选版本不应出现这个手动放行步骤。正式候选必须通过：

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

## Full Skin 真机流程

当前正确流程不是“安装主题后自己重新打开 ChatGPT”：

1. 完全退出准备测试的 ChatGPT Stable 或 Beta。
2. 打开 Theme Manager。
3. 选择主题、明暗模式和准确的 ChatGPT 目标。
4. 点击 Apply Full Skin / 应用完整皮肤。
5. Theme Manager 用仅限本机回环的调试参数启动 ChatGPT，并在页面出现后应用主题。
6. 记录背景、半透明材质、文字、composer 和侧栏是否正常。
7. 在同一会话中切换一次主题和模式。
8. 点击 Restore native / 恢复原生。
9. 退出 ChatGPT，再从系统正常打开，确认没有残留样式和调试端口。

检查端口：

```bash
lsof -nP -iTCP:9465 -sTCP:LISTEN
lsof -nP -iTCP:9466 -sTCP:LISTEN
```

恢复与退出后不应有 Theme Manager 启动的监听。

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

完整皮肤也不会跨 ChatGPT 进程永久保存。关闭并正常重开 ChatGPT 会回到原生界面。用户需要再次从 Theme Manager 点击应用。这是当前安全模型，不是安装失败。

## English summary

The two CI-built DMGs prove that the application compiles and packages for Apple Silicon and Intel. They are unsigned test artifacts, not normal public downloads. A physical Mac test must verify system-language selection, catalog filtering, the exact ChatGPT bundle identity, Theme Manager launch, Full Skin apply and restore, loopback listener ownership, Gatekeeper behavior, and cleanup after a normal ChatGPT restart. A Full Skin is session-scoped and must be reapplied after ChatGPT exits.
