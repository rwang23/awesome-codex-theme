# Full Skin 测试与实机截图

这个文件沿用原来的 `native-testing.md` 路径，避免旧链接失效。当前主要记录 Full Skin；Native 只作为配色回退。

## 固定测试台

- Stable：`OpenAI.Codex_26.715.2305.0_x64__2p2nqsd0c76g0`
- Stable 版本：`26.715.2305.0`
- Beta：`OpenAI.CodexBeta_26.715.3651.0_x64__2p2nqsd0c76g0`
- Beta 版本：`26.715.3651.0`
- Full Skin 端口：由操作系统为每次受控会话动态分配，仅监听 `127.0.0.1`
- 截图尺寸：1440×810，DPR 1
- fixture：`full-skin-home-v1`

截图只使用独立 Beta。主 Codex 实例可以继续运行，两个 Store 包和端口互不混用。

## 版本边界

主题包和公开 Registry 继续使用 `act-full-skin-v1`。这个版本号描述声明式主题包的格式，没有发生不兼容变化。

注入实现使用单独的 `act-full-skin-runtime-v2` 标记。管理器会同时检查两层版本，因此旧运行时不会被误判为健康，新实现也不会破坏现有主题包、Schema 或 Validator。

## 测试前提

1. Beta 必须由准确的 Store AUMID 启动，并带有仅限 `127.0.0.1` 的动态调试端口参数。
2. 端口监听进程的可执行路径必须属于固定 Beta 包。
3. CDP 目标必须是 `app://` 页面。
4. 测试进入新任务首页、选择“不在项目中工作”并隐藏侧栏，避免把项目名、会话或私有内容写入公开截图。
5. Native 外观设置不在 Full Skin 采集过程中改变。

任一身份检查失败，采集脚本立即停止。

## 每个模式的验证

`scripts/capture-full-skin-screenshots.mjs` 对 53 套主题的明亮、暗色模式依次执行：

1. 从 Registry 读取主题记录。
2. 读取本地 PNG，复核字节数和 SHA-256。
3. 把模型选择切换到当前测试台实际提供的 `5.6 Sol Max`，逐张读回可见标签，并在采集结束后恢复原模型选择；脚本不会伪造不存在的 Ultra 标签。
4. 切换模拟的 `prefers-color-scheme`，等待 Codex 页面稳定。
5. 通过 `Page.addScriptToEvaluateOnNewDocument` 注册运行时。
6. 在当前页面执行同一份运行时。
7. 读回 `act-full-skin` 根标记、主题 ID、模式、主区域和 composer 选择器。
8. 确认图片已解码为 Blob URL，并由 `body` 的文档级背景持有；根变量和计算后的背景都必须引用同一个 Blob。
9. 截取 1440×810 PNG，记录截图哈希、素材哈希、运行时哈希和实现版本。
10. 移除该模式的 early script。

批量结束后，脚本调用 cleanup，并确认：

- `window.__ACT_FULL_SKIN_STATE__` 不存在；
- 根节点没有 `act-full-skin`；
- style、caption 与 artwork 节点都已移除；
- 设备尺寸模拟和媒体模拟已清空。

当前清单位于：

```text
screenshots/codex-beta-26.715.3651.0/manifest.json
```

结果是 106/106 捕获成功，`fixture.project` 为 `none`，
`runtime.implementationVersion` 为 `act-full-skin-runtime-v2`，
`runtime.earlyInjection` 为 `true`，`runtime.removedAfterCapture` 为 `true`。

## Theme Manager 端到端测试

截图采集直接验证运行时；管理器还要单独验证 UI 到 Rust 的调用链。

`scripts/smoke-theme-manager.mjs` 会：

1. 验证调用方传入的 Theme Manager WebView2 动态调试端口，其进程祖先包含准确 release EXE。
2. 从 Beta 的 `DevToolsActivePort` 发现动态端口，并验证监听属于固定 Store 包。
3. 在真实管理器 UI 中选择主题、模式和 Beta。
4. 点击“应用完整皮肤”。
5. 从 Beta 页面读回主题 ID、模式、根 class、style、caption 和 artwork。
6. 依次进入内置的 Pull requests 页面和实际的 `Awesome Codex Theme` 对话，再返回新任务首页。
7. 在每个路由读回 Blob 背景、`act-full-skin-home` / `act-full-skin-task` 状态和修复计数；对话页面的前景容器还要保持透明，不能遮住文档背景。
8. 为 README 与 Gallery 采集管理器实机截图。
9. 点击“恢复原生”，再确认所有运行时标记消失。

`--active-runtime` 用于检查已经启用的永久主题。它不会调用恢复操作，也不会关闭用户的持久化选择。2026-07-21 的实机回归在 Pull requests 和真实对话之间往返后仍保持 2560×1440 图片、Blob 来源和文档背景。稳定路由的 1.2 秒观察窗口内，额外 `ensure()` 次数不超过 1 次；20.01 秒空闲采样中，持久化控制器使用 0.12 CPU 秒，约等于单核 0.62%。

本地预发布测试可以用 `--seed-local-art` 把经过同一 Registry 哈希验证的图片放入应用缓存。它只绕过尚未部署的 Pages URL，不绕过管理器的素材哈希、进程身份、CDP 或恢复逻辑；脚本结束后会删除自己创建的缓存文件。正式发布前还要对已部署 Pages URL做一次不带 seed 的测试。

## 视觉抽检

106 张截图会按模式生成 contact sheet。抽检关注：

- 原生标题、建议卡片和模型选择文字是否可读；
- composer 是否仍有未主题化的纯白或纯黑块；
- 背景主体是否落在声明的焦点区域；
- 左侧工作区是否保留足够安静的区域；
- 亮色和暗色是否属于同一主题；
- 是否出现聊天内容、账号信息或本机路径。

contact sheet 是临时 QA 文件，不进入公开 Registry。公开证据以单张截图和 manifest 为准。

## Native 回退

Validator 仍解析 106 份 `codex-theme-v1:` 字符串，核对字段白名单、模式、颜色、哈希、Registry 路径和包内副本，并拒绝重复 payload。这个测试只证明回退配色自洽，不代表它能安装 Full Skin 背景。

## 版本升级

截图证据只绑定 Beta `26.715.3651.0`。Codex 升级后先运行只读 probe，确认包身份、动态端口所有权、`app://` 目标和关键选择器。任何一项变化都要停止批量采集，修正运行时后重新生成全部 106 张截图。

## English summary

The pinned Beta `26.715.3651.0` test bench produced 106 real Full Skin captures. The public package contract remains `act-full-skin-v1`; each capture also records the `act-full-skin-runtime-v2` implementation. The fixture clears the selected project before capture, verifies the Blob-backed document background, and binds every screenshot to the theme asset, runtime hash, exact package, and selector readback. A separate persistent-runtime smoke test opens a built-in route and a real conversation, returns to the home view, and confirms that the image remains visible through transparent content layers. The controller stays enabled after that test. These results apply only to the pinned Beta version and must be rerun after a Codex update.
