# 09 · 优先级 Backlog

## 1. 优先级定义

- **P0：** 已确认的严重安全事件、数据破坏或必须立即停止发布的问题。本次没有 P0。
- **P1：** 核心可靠性、用户输入风险、网络资源边界、构建可持续性、关键可访问性或供应链问题。
- **P2：** 明确问题，会随主题、用户、平台或贡献者规模增长而放大。
- **P3：** 产品打磨、治理和维护体验改善。

Effort：S 通常为 1–3 天，M 为数天到一周，L 为跨模块或需要迁移/真机验证。实际工期取决于维护者数量和发布流程。

## 2. 全量清单

| ID | Priority | Category | Finding | Effort | Confidence | Issue Draft |
|---|---|---|---|---:|---|---|
| ACT-001 | P1 | Build/Performance | 全量生成器冷启动不可扩展，并在内存中保留全仓库产物 | L | High | 01-incremental-streaming-generator.md |
| ACT-002 | P1 | Testing/Developer Experience | 干净检出后 `test`、`validate` 和 `build` 不能独立运行 | M | High | 02-hermetic-clean-checkout-and-ci-artifacts.md |
| ACT-003 | P1 | CI/Cost | 同一次变更可能在工作流中重复执行昂贵生成 5 次 | M | High | 02-hermetic-clean-checkout-and-ci-artifacts.md |
| ACT-006 | P1 | Rendering/Visual Quality | 源图裁切忽略焦点与安全区语义，并把 1536×1024 放大到 2560×1440 | L | High | 03-focal-aware-rendering-and-safe-areas.md |
| ACT-008 | P1 | Runtime/Reliability | Full Skin 切换不是事务性的，失败可能留下部分注入或丢失旧主题 | L | High | 04-transactional-full-skin-runtime.md |
| ACT-009 | P1 | Runtime/Observability | 页面监控达到错误阈值后静默停止，但状态仍可能显示 active | M | High | 04-transactional-full-skin-runtime.md |
| ACT-010 | P1 | Security/Networking | 远程 Catalog、Registry 与素材均可能在校验前无上限缓冲响应 | M | High | 05-streamed-network-limits-and-schema-parity.md |
| ACT-013 | P1 | Platform/User Safety | Windows 常驻重启使用强制终止，可能丢失未提交输入 | M | High | 06-graceful-restart-and-platform-diagnostics.md |
| ACT-014 | P1 | Platform/Diagnostics | 目标发现错误被折叠为空列表 | S | High | 06-graceful-restart-and-platform-diagnostics.md |
| ACT-016 | P1 | UI/Accessibility | 常驻授权弹窗缺少完整焦点隔离与恢复 | M | High | 07-theme-manager-accessibility-and-shortcuts.md |
| ACT-017 | P1 | UI/Accessibility | Listbox/Tab ARIA 语义未实现对应键盘交互 | M | High | 07-theme-manager-accessibility-and-shortcuts.md |
| ACT-020 | P1 | Web/Performance | Gallery 卡片使用 1440×810 实机 PNG，而不是轻量预览 | M | High | 08-responsive-thumbnails-and-stable-card-dom.md |
| ACT-025 | P1 | CI/Supply Chain | 构建矩阵权限过宽，Actions 未固定到 commit，缺少供应链检查 | M | High | 09-ci-least-privilege-and-supply-chain.md |
| ACT-004 | P2 | Build/Correctness | 渲染缓存指纹未覆盖全部影响输出的字段 | S | High | 01-incremental-streaming-generator.md |
| ACT-005 | P2 | Metadata/Maintainability | 主题数量、模式数量、测试版本与产品版本存在多处硬编码和漂移 | M | High | 10-metadata-rights-and-governance.md |
| ACT-007 | P2 | Rendering/Performance | 自研逐像素 PNG 编解码器成为主要 CPU 热点且格式能力窄 | L | High | 01-incremental-streaming-generator.md |
| ACT-011 | P2 | Security/Trust | 远程 Catalog 与 Registry 的完整性根仍来自同一站点，没有独立签名 | L | Medium | 05-streamed-network-limits-and-schema-parity.md |
| ACT-012 | P2 | Schema/Correctness | Node、JSON Schema 与 Rust 远程验证存在契约漂移 | M | High | 05-streamed-network-limits-and-schema-parity.md |
| ACT-015 | P2 | Platform/Security | macOS 持久化宿主路径与身份验证仍可收紧 | M | Medium | 06-graceful-restart-and-platform-diagnostics.md |
| ACT-018 | P2 | UI/Interaction | 全局 Ctrl/Cmd+C 可能覆盖用户正常复制 | S | High | 07-theme-manager-accessibility-and-shortcuts.md |
| ACT-019 | P2 | Desktop/Performance | 桌面主题列表会重建全部节点并可能急切解码所有缩略图 | M | High | 08-responsive-thumbnails-and-stable-card-dom.md |
| ACT-021 | P2 | Web/UX/i18n | 卡片详情入口不明显，部分 ARIA/静态文案未本地化且无 JS 数字已过期 | M | High | 08-responsive-thumbnails-and-stable-card-dom.md |
| ACT-022 | P2 | Runtime/CSS | Full Skin CSS 的宽泛选择器可能抹平语义颜色 | M | High | 11-runtime-semantic-states-and-performance.md |
| ACT-023 | P2 | Runtime/Performance | 全页面 MutationObserver 与 fixed 背景需建立性能预算 | M | Medium | 11-runtime-semantic-states-and-performance.md |
| ACT-024 | P2 | Documentation | 运行时文档与实际背景实现不一致 | S | High | 10-metadata-rights-and-governance.md |
| ACT-026 | P2 | Release/Packaging | 发布标签、应用版本和 GitHub prerelease 语义不一致 | M | High | 10-metadata-rights-and-governance.md |
| ACT-027 | P2 | Governance/Rights | 原创素材的 `rightsVerified: true` 由分类自动推导，而非显式审核记录 | M | High | 10-metadata-rights-and-governance.md |
| ACT-028 | P2 | Visual/Accessibility | SurfaceAlt 与 Border token 的使用场景缺少完整对比度门槛 | M | High | 03-focal-aware-rendering-and-safe-areas.md |
| ACT-029 | P2 | Visual/Composition | 所有主题都声明 left 安全区，且部分左区视觉密度明显偏高 | L | High | 03-focal-aware-rendering-and-safe-areas.md |
| ACT-030 | P2 | Testing | 缺少 Renderer 交互、可访问性、网络边界和事务回滚测试 | L | High | 11-runtime-semantic-states-and-performance.md |
| ACT-031 | P2 | Testing/Visual Regression | Pages 截图步骤只验证文件非空，没有控制台、网络或视觉断言 | M | High | 09-ci-least-privilege-and-supply-chain.md |
| ACT-032 | P2 | Compatibility/Product Claims | macOS 构建与物理兼容性证据需要在产品入口更显著地区分 | M | High | 10-metadata-rights-and-governance.md |
| ACT-033 | P3 | UI/Visual Design | Theme Manager 信息密度和关键小字偏高 | M | Medium | 07-theme-manager-accessibility-and-shortcuts.md |
| ACT-034 | P3 | Community/Maintenance | Issue 生命周期与完成状态需要清理 | S | High | 10-metadata-rights-and-governance.md |

## 3. P1 详细说明

### ACT-001 · 全量生成器冷启动不可扩展，并在内存中保留全仓库产物

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Build/Performance / L

**证据：** `scripts/generate-themes.mjs:210-260, 398-425` 顺序处理 68 个主题、每个主题渲染 4 张 PNG，并把背景、预览、Manifest、ZIP、Native 文件全部放入一个 `Map` 后统一写入。实测单主题 960×540 约 3.25 秒，2560×1440 约 17.77 秒；全量 `npm run generate` 运行超过 20 分钟仍未完成。

**影响：** 主题继续增长时会显著增加开发等待、CI 分钟、峰值内存和失败重试成本。`--check` 也先完成全部渲染，无法作为快速漂移检查。

**建议：** 按主题流式生成和落盘；有界并发；单次解码复用；支持 `--ids`、`--concurrency`、进度事件和缓存命中统计；高分辨率 Buffer 在主题完成后立即释放。

**验收标准：** 冷构建有持续进度；暖构建在基准机器 60 秒内完成；峰值 RSS 有门槛；单主题构建不触碰其他主题；CI 记录耗时与缓存率。

**Issue 草案：** 01-incremental-streaming-generator.md

### ACT-002 · 干净检出后 `test`、`validate` 和 `build` 不能独立运行

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Testing/Developer Experience / M

**证据：** 在上传 ZIP 的干净检出中，`npm test` 20 项仅 14 项通过，6 项因缺少 `themes/registry.json` 失败；`npm run validate` 和 `npm run build` 同样立即失败。日志见 `11-verification-log.md` 与 `metrics` 旁的测试日志摘要。

**影响：** README/package scripts 暗示这些命令可直接运行，但新贡献者必须先执行昂贵生成；快速源码测试与生成物验证边界不清晰。

**建议：** 拆分 source-only tests 与 generated-artifact tests；让默认 `npm test` 在干净检出通过；CI/release 脚本明确执行一次生成后再跑生成物测试。

**验收标准：** 干净检出 `npm test` 通过且不生成 PNG；生成物套件有明确前置条件；CI 保留完整可复现性证明。

**Issue 草案：** 02-hermetic-clean-checkout-and-ci-artifacts.md

### ACT-003 · 同一次变更可能在工作流中重复执行昂贵生成 5 次

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** CI/Cost / M

**证据：** `.github/workflows/desktop.yml:40-52` 在 validate job 生成一次，`:54-103` 的三平台矩阵各生成一次；`.github/workflows/pages.yml:19-32` 再生成一次。Desktop 缩略图准备也在三平台分别执行。

**影响：** 消耗大量 GitHub Actions 时间，延迟 PR 反馈；生成失败会在多个平台重复发生，增加噪声。

**建议：** Linux job 生成和准备一次，上传短期 artifact；Windows/macOS 矩阵下载复用；Pages 可复用相同构建产物或使用独立缓存键。

**验收标准：** 每次 workflow run 生成器只执行一次；跨平台产物哈希一致；平台 job 只负责 Rust 测试和打包。

**Issue 草案：** 02-hermetic-clean-checkout-and-ci-artifacts.md

### ACT-006 · 源图裁切忽略焦点与安全区语义，并把 1536×1024 放大到 2560×1440

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Rendering/Visual Quality / L

**证据：** `scripts/lib/png.mjs:599-627` 始终居中 cover crop；未使用 `theme.art.focusX/focusY`。`:568-584` 的可读性 wash 永远强化左侧，不读取 `safeArea`。所有 68 个主题当前恰好声明 left，掩盖了 right/center 路径未实现。3:2 源图转 16:9 会裁掉约 15.6% 垂直内容，并以 1.667× 放大到资产尺寸。

**影响：** Manifest 暴露的构图契约与实际像素不一致；将来右/中安全区主题会渲染错误；放大会降低细节并增加 PNG 体积。

**建议：** 实现 focal-aware cover crop 和方向化 safe-area grading；把 16:9 作为新素材源尺寸或限制输出到源图可支持的分辨率；对现有 68 套进行视觉批准。

**验收标准：** 焦点变化可测地改变裁切；四种 safeArea 均有单测和黄金图；无主题主体被裁切；不再无理由上采样。

**Issue 草案：** 03-focal-aware-rendering-and-safe-areas.md

### ACT-008 · Full Skin 切换不是事务性的，失败可能留下部分注入或丢失旧主题

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Runtime/Reliability / L

**证据：** `skin_runtime.rs:792-817` 先 `runtime.take()` 并清理旧 Session，再验证新 descriptor/target/asset；`:518-527` 多 target 注入在首个错误直接返回，但不回滚此前 target；只有全部成功后才建立可跟踪 Session。

**影响：** 主题切换失败时旧主题已被移除；多页面场景可能遗留未登记 early script/CSS，用户看到部分页面不同步且恢复困难。

**建议：** 先完整准备候选 Session；逐 target 注入并读回；任一失败回滚候选；验证成功后原子交换 Session，最后清理旧 Session。

**验收标准：** target 2 故障测试会清理 target 1；失败切换保留旧主题；不存在未跟踪 early script；恢复可重试。

**Issue 草案：** 04-transactional-full-skin-runtime.md

### ACT-009 · 页面监控达到错误阈值后静默停止，但状态仍可能显示 active

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Runtime/Observability / M

**证据：** `skin_runtime.rs:690-765` 吞掉具体监控错误，达到 `TARGET_MONITOR_MAX_ERRORS` 后退出，仅把 `monitor_running=false`；`:849-853` runtime 仍持有 Session，UI 无 degraded 状态或错误事件。

**影响：** 用户会看到“保持中/active”，但新页面不再注入或现有页面已失效；支持人员缺少可操作诊断。

**建议：** 增加 monitor health 状态、最后错误、连续错误数与事件通知；降级时 UI 明确提示重试/恢复；控制器根据健康状态决定是否重建。

**验收标准：** 模拟 CDP 失败后 UI 在阈值内进入 degraded；诊断保留原因；恢复/重试路径有自动测试。

**Issue 草案：** 04-transactional-full-skin-runtime.md

### ACT-010 · 远程 Catalog、Registry 与素材均可能在校验前无上限缓冲响应

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Security/Networking / M

**证据：** `catalog.rs:445-459` 对 JSON 直接 `.bytes()`；`skin_runtime.rs:292-315` 虽检查声明/Content-Length，仍在 chunked 或虚假长度响应上先完整 `.bytes()`。大小校验发生在内存分配后。

**影响：** 受控站点/CDN 异常、供应链事件或代理篡改可造成过量内存和应用崩溃，形成拒绝服务面。

**建议：** 使用流式读取并在每个 chunk 前执行硬上限；Catalog/Registry/PNG 分别设定上限；同时检查 Content-Length 和实际累计值。

**验收标准：** 无 Content-Length 的超限响应也会在越界前中止；错误响应不写缓存；网络边界测试覆盖截断、超长和错误长度。

**Issue 草案：** 05-streamed-network-limits-and-schema-parity.md

### ACT-013 · Windows 常驻重启使用强制终止，可能丢失未提交输入

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Platform/User Safety / M

**证据：** `platform.rs:454-488` 精确匹配包和 executable 后执行 `Stop-Process -Force`；macOS 路径 `:491-503` 则先请求正常 quit。

**影响：** 身份匹配降低误杀风险，但 ChatGPT 中尚未发送的输入、上传进度或本地状态仍可能丢失；平台体验不一致。

**建议：** Windows 先请求正常关闭并等待；超时后显示明确风险确认；只有用户确认才 force kill；应用前提醒保存输入。

**验收标准：** 默认路径不使用 `-Force`；取消不改变进程和主题；超时升级有自动化/人工测试与可理解文案。

**Issue 草案：** 06-graceful-restart-and-platform-diagnostics.md

### ACT-014 · 目标发现错误被折叠为空列表

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Platform/Diagnostics / S

**证据：** `platform.rs:216-217` 调用 `discover_platform_targets().unwrap_or_default()`，PowerShell/JSON/权限错误都变成“没有目标”。

**影响：** 用户会误以为 ChatGPT 未安装；支持排查缺少真实错误；持久化控制器可能作出错误状态判断。

**建议：** 向前端返回结构化 Result/diagnostic，区分未安装、命令失败、权限、解析、版本与不受支持平台。

**验收标准：** 注入 PowerShell 失败时 UI 显示原因和修复操作；“未安装”只用于成功发现但结果为空。

**Issue 草案：** 06-graceful-restart-and-platform-diagnostics.md

### ACT-016 · 常驻授权弹窗缺少完整焦点隔离与恢复

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** UI/Accessibility / M

**证据：** `renderer/index.html:199-222` 使用自定义 `div role=dialog`；`renderer/app.js:313-325` 仅聚焦确认按钮，未设置 inert、焦点循环、关闭后焦点恢复。

**影响：** 键盘和读屏用户可能移出模态区域或失去上下文；这是涉及重启与持久化的高风险确认步骤。

**建议：** 优先改用原生 `<dialog>`；否则完整实现 focus trap、背景 inert、初始焦点、Escape、关闭后恢复焦点和自动化测试。

**验收标准：** 键盘无法进入背景；Escape/取消/确认行为一致；关闭后回到触发按钮；axe 无严重问题。

**Issue 草案：** 07-theme-manager-accessibility-and-shortcuts.md

### ACT-017 · Listbox/Tab ARIA 语义未实现对应键盘交互

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** UI/Accessibility / M

**证据：** `renderer/index.html:77,83,102` 声明 tablist/listbox；`renderer/app.js:450-580` 创建 tab/option，但全局 keydown 仅处理快捷键，未实现 Arrow/Home/End、roving tabindex、tabpanel 关系。

**影响：** 辅助技术得到“复杂控件”语义，却无法按规范操作；Tab 可能依次经过 68 个 option，效率很差。

**建议：** 若不需要复合控件语义，改成普通按钮/列表；否则完整实现 APG 键盘模型与焦点管理。

**验收标准：** Arrow/Home/End/Enter/Space 按所选语义工作；只有一个 option 在 Tab 顺序；读屏状态正确。

**Issue 草案：** 07-theme-manager-accessibility-and-shortcuts.md

### ACT-020 · Gallery 卡片使用 1440×810 实机 PNG，而不是轻量预览

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** Web/Performance / M

**证据：** `site/assets/app.js:379, 544-603` 的 `visualFor` 优先 capture，卡片虽设置 lazy loading，但滚动后会请求全尺寸证据图。当前 136 张 Full Skin capture 总计约 128.4 MiB，单模式约 55.7/72.7 MiB；所有 68 张卡片节点一次创建。

**影响：** 移动端和慢网首访成本高；图片解码占内存；真实证据图与浏览缩略图职责混在一起。

**建议：** 生成 320/480/960 WebP/AVIF；卡片用 srcset，弹窗按需加载较大图，原始 PNG 只作为证据/下载；增加资源预算。

**验收标准：** 冷启动交互前资源建议 <3 MiB；滚动不自动下载全部原始 PNG；LCP 和长任务进入 CI 门槛。

**Issue 草案：** 08-responsive-thumbnails-and-stable-card-dom.md

### ACT-025 · 构建矩阵权限过宽，Actions 未固定到 commit，缺少供应链检查

**优先级 / 严重度 / 置信度：** P1 / High / High
**类别 / 工作量：** CI/Supply Chain / M

**证据：** `.github/workflows/desktop.yml:54-57` 整个三平台 desktop job 都有 `contents: write`，包括 PR/非发布构建；Actions 使用可变 tag（checkout@v7、setup-node@v7、rust-cache@v2、tauri-action@v1）。未发现 CodeQL、Dependabot、actionlint/zizmor、cargo audit/deny、SBOM 或 provenance。

**影响：** 第三方 Action 或构建步骤被攻破时影响面扩大；签名 secrets 与写 token 所在 job 复杂；依赖风险缺少持续反馈。

**建议：** 所有验证/构建保持 contents:read；独立 tag release job 才给 write/secrets；Actions 固定 SHA；加入依赖、workflow、SBOM/provenance 检查。

**验收标准：** PR job 无写权限；签名 secret 仅 release job 可见；Actions 全 SHA pin；安全检查状态为 required。

**Issue 草案：** 09-ci-least-privilege-and-supply-chain.md


## 4. P2 详细说明

### ACT-004 · 渲染缓存指纹未覆盖全部影响输出的字段

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Build/Correctness / S

**证据：** `scripts/generate-themes.mjs:66-74` 的 fingerprint 只含 renderer ID、source hash、mode、尺寸和 background；未包含 `focusX/focusY`、`safeArea`、`taskMode` 与完整 grading 参数。复用逻辑 `:77-103` 也仅检查背景色与文件哈希。

**影响：** 构图或算法参数变化时可能错误复用旧图片；依赖维护者手动升级 renderer ID，容易遗漏。

**建议：** 将完整 `theme.art`、所有影响像素的 token/常量与算法 schema 进入规范化 fingerprint；为缓存失效写回归测试。

**验收标准：** 任一像素相关字段变化都会改变 fingerprint；无关文案变化不会触发图像重渲染。

**Issue 草案：** 01-incremental-streaming-generator.md

### ACT-005 · 主题数量、模式数量、测试版本与产品版本存在多处硬编码和漂移

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Metadata/Maintainability / M

**证据：** `scripts/prepare-desktop.mjs:62-65` 硬编码 68；`site/index.html:115-128, 227` 仍有 53；`site/assets/app.js:120,245` 写 106 个模式，但当前是 136；根 `package.json` 为 0.1.0，Theme Manager/Cargo 为 0.3.2。多个脚本重复写测试版本。

**影响：** 新增主题或发布版本后容易出现 UI、文档、安装器和更新器不一致，削弱用户信任并造成测试脆弱。

**建议：** 建立单一 release/catalog metadata；构建时注入所有数量和测试版本；禁止 UI 文案维护数字；增加 drift test。

**验收标准：** 全仓搜索不再出现手工主题/模式计数；应用、Cargo、安装器、Release 名称和 updater 版本一致。

**Issue 草案：** 10-metadata-rights-and-governance.md

### ACT-007 · 自研逐像素 PNG 编解码器成为主要 CPU 热点且格式能力窄

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Rendering/Performance / L

**证据：** `scripts/lib/png.mjs:408-440` JavaScript 双重循环编码、固定 Sub filter、level 9 同步压缩；`:463-533` 仅支持 8-bit RGB/RGBA、非交错 PNG；`:536-554` 每像素分配数组；`:599-627` 每个输出重新解码并逐像素 grade。

**影响：** 生成速度慢、事件循环阻塞、压缩选择不理想；贡献者素材稍有格式差异即失败；维护自研图像栈增加风险。

**建议：** 优先评估 Sharp/libvips 或平台工具的确定性输出；若保留自研实现，至少复用解码、使用 typed-array 内核/worker_threads、降低临时分配并测试压缩质量。

**验收标准：** 基准显示至少 5× 冷构建提升；输出具确定性；支持或明确转换常见 PNG；视觉差异通过 golden test。

**Issue 草案：** 01-incremental-streaming-generator.md

### ACT-011 · 远程 Catalog 与 Registry 的完整性根仍来自同一站点，没有独立签名

**优先级 / 严重度 / 置信度：** P2 / Medium / Medium
**类别 / 工作量：** Security/Trust / L

**证据：** `catalog.rs:13-17, 462+` 固定 GitHub Pages 来源，并由 Catalog 中的 Registry hash 绑定内容，这是良好基础；但 Catalog 和 Registry 同源，站点被替换时攻击者可同时替换两者。

**影响：** HTTPS 与 GitHub Pages 降低风险，但无法提供独立于托管面的发布者真实性；Theme Manager 会信任新的合法格式资产。

**建议：** 为 Catalog/Registry 增加离线 release key 签名或使用已签 updater 元数据承载 Registry 摘要；支持 key rotation 和回滚保护。

**验收标准：** 篡改 Catalog+Registry 仍无法通过签名；旧 revision 回滚被拒绝或需显式确认；签名失败自动使用已验证缓存。

**Issue 草案：** 05-streamed-network-limits-and-schema-parity.md

### ACT-012 · Node、JSON Schema 与 Rust 远程验证存在契约漂移

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Schema/Correctness / M

**证据：** `catalog.rs:322-373` 只校验运行所需子集，没有复用仓库权威 schema 的全部 exact-key、package/provenance/关系约束；`catalog.rs:526-548` 读取 Full Skin capture 中并不存在的 `nativeSha256`，结果长期为 null。

**影响：** 同一 Registry 在 CI 与客户端可能得到不同结论；新字段/缺失字段造成静默 UI 数据错误，安全修复容易只落在一侧。

**建议：** 生成共享规范测试向量；Rust validator 与 Schema/Node 测试保持字段和关系等价；删除或正确映射 `nativeSha256`。

**验收标准：** 同一 adversarial corpus 在 Node/Rust 得出一致结果；presented catalog 不含无意义 null 字段；schema drift 测试在 CI 执行。

**Issue 草案：** 05-streamed-network-limits-and-schema-parity.md

### ACT-015 · macOS 持久化宿主路径与身份验证仍可收紧

**优先级 / 严重度 / 置信度：** P2 / Medium / Medium
**类别 / 工作量：** Platform/Security / M

**证据：** `platform.rs:701-715` 只拒绝 `/Volumes` 并要求路径含 `.app/Contents/MacOS/`，因此 `/tmp/Foo.app/...` 也会通过，尽管提示要求 Applications。进程身份主要绑定 bundle/executable 路径，未绑定签名 Team ID。

**影响：** 恶意或临时 App bundle 可能满足宽松路径形状；未来正式签名后仍缺少发布者身份断言。

**建议：** 只允许 `/Applications` 或 `$HOME/Applications`；正式签名后检查 designated requirement/TeamIdentifier；记录身份诊断。

**验收标准：** `/tmp` 等路径被拒绝；两类 Applications 路径通过；签名身份不符时持久化/连接停止。

**Issue 草案：** 06-graceful-restart-and-platform-diagnostics.md

### ACT-018 · 全局 Ctrl/Cmd+C 可能覆盖用户正常复制

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** UI/Interaction / S

**证据：** `renderer/app.js:1039+` 在非搜索焦点时把 Ctrl/Cmd+C 作为“复制主题”快捷键；未先判断文本选区、可编辑元素或其它控件上下文。

**影响：** 用户选择诊断、哈希、状态或说明文字后按复制，可能复制主题字符串而非选中文本，造成困惑。

**建议：** 仅在无文本选区、焦点不在 editable/control、且主舞台明确 active 时触发；考虑改为带 Shift 的快捷键。

**验收标准：** 选中文字后 Ctrl/Cmd+C 保持系统复制；输入控件不被拦截；快捷键仍有可发现文案。

**Issue 草案：** 07-theme-manager-accessibility-and-shortcuts.md

### ACT-019 · 桌面主题列表会重建全部节点并可能急切解码所有缩略图

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Desktop/Performance / M

**证据：** `renderer/app.js:553-640` 每次 render 新建 card 和 `<img>`；多处 mode/filter/search 事件调用 `renderThemeList()`；图片没有 `loading=lazy`。当前 136 张原始 capture 约 128.4 MiB，准备阶段又生成 720×405 缩略图。

**影响：** 首开、模式切换和搜索可能发生不必要 DOM/图片解码和 GC；主题数量增长后滚动与输入延迟恶化。

**建议：** 卡片只创建一次；模式切换只更新属性；本地缩略图分层/懒解码或虚拟列表；搜索做轻量 hidden 更新。

**验收标准：** 模式切换不 replace 整个 list；启动时只解码可见区域；输入性能有 trace/预算。

**Issue 草案：** 08-responsive-thumbnails-and-stable-card-dom.md

### ACT-021 · 卡片详情入口不明显，部分 ARIA/静态文案未本地化且无 JS 数字已过期

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Web/UX/i18n / M

**证据：** `site/assets/app.js:560` 固定英文 `Preview mode`；`:614-616` 只有视觉区域双击或小箭头进入详情；`site/index.html` 多个 aria-label 固定中文。无 JS/加载失败时显示 53，能力说明写 106 而实际为 68 主题/136 模式。

**影响：** 详情发现率和键盘可用性差；英文用户读屏会遇到中文；加载异常时产品数据不可信。

**建议：** 让整张卡片有清晰单击/键盘详情按钮；所有可访问名称进入 i18n；构建时注入正确数字并提供 noscript/错误状态。

**验收标准：** 鼠标、触摸、键盘均可单步打开详情；两种语言的 accessibility tree 一致；断网/JS 失败不展示错误数量。

**Issue 草案：** 08-responsive-thumbnails-and-stable-card-dom.md

### ACT-022 · Full Skin CSS 的宽泛选择器可能抹平语义颜色

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Runtime/CSS / M

**证据：** `packages/full-skin/runtime.css:121-148` 对 composer 后代、`[class*="text-"]` 和 SVG 强制主题 text/accent 色；可能覆盖错误、禁用、diff、警告或状态图标颜色。

**影响：** 在目标应用 DOM 变化后可能降低可理解性，特别是错误、权限与 destructive 操作；自动捕获主页无法覆盖所有语义状态。

**建议：** 缩小选择器作用域；保留显式 semantic classes/ARIA states；建立错误、diff、disabled、focus、high-contrast fixture。

**验收标准：** 语义状态截图/DOM 测试通过；forced-colors 模式可用；主题规则不覆盖已知 destructive/error token。

**Issue 草案：** 11-runtime-semantic-states-and-performance.md

### ACT-023 · 全页面 MutationObserver 与 fixed 背景需建立性能预算

**优先级 / 严重度 / 置信度：** P2 / Medium / Medium
**类别 / 工作量：** Runtime/Performance / M

**证据：** `packages/full-skin/runtime.js:241-279` 观察整个 document subtree 并周期 ensure；`runtime.css:21` 使用 `background-attachment: fixed !important`。实现有 debounce/健康指标，是积极控制，但缺少长会话性能测试。

**影响：** 大型聊天、流式输出或高频 DOM 变化时可能增加样式重算与主线程工作；fixed 背景在部分 GPU/缩放组合上触发额外 repaint。

**建议：** 限定观察根/属性；只在标志元素缺失时修复；记录 observer 回调和 ensure 耗时；评估独立固定伪元素替代 fixed background。

**验收标准：** 长对话/流式输出 30 分钟基准无明显 CPU/内存增长；回调频率与 P95 时间可观测。

**Issue 草案：** 11-runtime-semantic-states-and-performance.md

### ACT-024 · 运行时文档与实际背景实现不一致

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Documentation / S

**证据：** `docs/20-architecture/adapters.md:19` 描述 manager-created `<img>` layer 且无 app:// blob URL，而当前 `runtime.js/runtime.css` 使用 Blob-backed body background，并清理旧 `#act-full-skin-art`。

**影响：** 维护者、审计者和贡献者会根据过期架构做错误判断；安全说明与实际数据流不一致。

**建议：** 从代码生成或测试关键架构声明；更新 adapters/architecture 文档，并加入 docs drift test。

**验收标准：** 文档准确描述 Blob URL、style/caption、early injection、清理和健康监控；相关字符串由测试锁定。

**Issue 草案：** 10-metadata-rights-and-governance.md

### ACT-026 · 发布标签、应用版本和 GitHub prerelease 语义不一致

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Release/Packaging / M

**证据：** 根 package 为 0.1.0，Theme Manager/Cargo 为 0.3.2；desktop workflow 将 Release 命名为 Beta，却配置 `prerelease: false`，同时 `releaseDraft: true`。便携助手使用根版本的可能性需要统一验证。

**影响：** 更新器、用户下载页和 GitHub Release 可能显示不一致版本/稳定性；自动化工具把 Beta 当正式版本。

**建议：** 定义唯一版本源和发布通道；Beta 使用 prerelease；构建检查所有 metadata；发布前输出 manifest。

**验收标准：** 安装包/About/updater/GitHub Release/portable helper 版本一致；Beta 在 API 中确为 prerelease。

**Issue 草案：** 10-metadata-rights-and-governance.md

### ACT-027 · 原创素材的 `rightsVerified: true` 由分类自动推导，而非显式审核记录

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Governance/Rights / M

**证据：** `scripts/generate-themes.mjs:39-63` 只要不是 fan-art 就自动输出 `rightsVerified: true`；provenance 声明“reviewed”，但没有 reviewer、时间、检查项、决策和与 source hash 绑定的独立 attestation。

**影响：** 代码字段表达的是事实审核结论，却无法证明谁在何时检查；素材变化后仍可能自动获得 verified。

**建议：** 新增 source review attestation，包含 reviewer、日期、检查清单、决策和 source SHA；生成器只在有效 approved 记录时设 true。

**验收标准：** 替换 source PNG 会使 attestation 失效；未审核原创不能进入发布 Registry；审核记录可公开回查。

**Issue 草案：** 10-metadata-rights-and-governance.md

### ACT-028 · SurfaceAlt 与 Border token 的使用场景缺少完整对比度门槛

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Visual/Accessibility / M

**证据：** 量化结果显示 text/muted 对 background/surface 和 accent label 均通过现有门槛；但 muted 对 surfaceAlt 有 23/136 低于 4.5，最低 3.76。Border 对 background 128/136 低于 3:1、对 surface 136/136 低于 3:1。当前 validator 只检查 muted/surface，不检查这些组合。

**影响：** 若 surfaceAlt 上使用小号 muted 文本，或 border 是控件唯一边界，可能产生实际可访问性问题；并非所有装饰 border 都要求 3:1，因此需要按组件语义验证。

**建议：** 建立 token-use matrix；对真实组件组合做约束；提升需要承载文字/控件边界的 token；装饰线与交互边界分离。

**验收标准：** 所有实际小文本组合 >=4.5；交互控件可见边界/状态 >=3:1 或有其它足够线索；validator 与组件契约一致。

**Issue 草案：** 03-focal-aware-rendering-and-safe-areas.md

### ACT-029 · 所有主题都声明 left 安全区，且部分左区视觉密度明显偏高

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Visual/Composition / L

**证据：** 68/68 `safeArea=left`；量化排名中 Shenzhen Circuit Rain、Sword of Coming Duo、Nanjing Wall Plum 等左侧边缘/亮度变化最高。实机中央文案复杂度高的主题包括 Jiangnan Rain Courtyard、Sword of Coming Duo、Mortal Journey Chibi 等。

**影响：** 主题库构图多样性受限；声明的“安静左区”在若干主题上只是经 wash 后勉强成立，标题、推荐卡和 composer 仍与人物/树枝/建筑竞争。

**建议：** 建立安全区热图和人工 gate；允许 right/center 主题；为标题、任务卡、composer 定义多个 UI 占位模板；高风险主题重新裁切/降噪。

**验收标准：** 每个主题通过 light/dark、至少两种窗口宽度和关键 UI fixture；安全区复杂度阈值仅作预筛，最终有人工批准。

**Issue 草案：** 03-focal-aware-rendering-and-safe-areas.md

### ACT-030 · 缺少 Renderer 交互、可访问性、网络边界和事务回滚测试

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Testing / L

**证据：** Node 测试主要覆盖 Registry/包/运行时模板；Rust 测试覆盖若干解析和平台函数。未发现 Desktop renderer DOM 测试、axe、键盘流、Full Skin 多 target rollback、monitor degraded、响应硬上限或焦点裁切测试。

**影响：** 高风险逻辑靠人工 smoke；回归通常要到真实应用/发布前才出现，修复成本高。

**建议：** 建立分层测试：纯函数、Rust mock backend、jsdom/Playwright renderer、axe、网络 mock、固定目标真机 smoke。

**验收标准：** P1 场景均有自动回归；测试矩阵区分快速 PR、nightly 和受控真机；失败输出可诊断。

**Issue 草案：** 11-runtime-semantic-states-and-performance.md

### ACT-031 · Pages 截图步骤只验证文件非空，没有控制台、网络或视觉断言

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Testing/Visual Regression / M

**证据：** `.github/workflows/pages.yml:34-45` 启动站点后仅执行 Chrome screenshot 和 `test -s gallery-home.png`。页面可以显示错误 Registry、缺图或过期数量仍通过。

**影响：** 所谓“截图证据”不能阻止核心 UI/资源回归；浏览器错误、404 和可访问性问题不会失败。

**建议：** 用 Playwright 检查 console/page errors、关键文本和 68 卡片；拦截 404；做小范围视觉 diff 与 axe；记录性能预算。

**验收标准：** Registry 加载失败、缺图、console error、卡片数量错误会使 CI 失败；视觉基线有审阅流程。

**Issue 草案：** 09-ci-least-privilege-and-supply-chain.md

### ACT-032 · macOS 构建与物理兼容性证据需要在产品入口更显著地区分

**优先级 / 严重度 / 置信度：** P2 / Medium / High
**类别 / 工作量：** Compatibility/Product Claims / M

**证据：** README 已诚实说明 macOS 持久化真机闭环仍待完成，这是优点；但 Gallery/Theme Manager 主文案突出 Windows + macOS，用户可能误认为 Full Skin 常驻同等验证。CI 只能验证 DMG/架构/ad-hoc 签名。

**影响：** Mac 用户可能在未充分理解功能级验证差异时下载；支持预期与产品承诺不一致。

**建议：** 在下载按钮和功能卡旁显示 capability matrix；未验证功能标 Beta/Experimental；完成 Intel/Apple Silicon 真机矩阵后再升级。

**验收标准：** 每个平台/功能明确显示 buildable、smoke-tested、physically verified 三种状态；文档与 UI 同源。

**Issue 草案：** 10-metadata-rights-and-governance.md


## 5. P3 详细说明

### ACT-033 · Theme Manager 信息密度和关键小字偏高

**优先级 / 严重度 / 置信度：** P3 / Low / Medium
**类别 / 工作量：** UI/Visual Design / M

**证据：** 仓库截图显示左栏两列卡片、多个筛选层、状态/哈希/版本同时展示；CSS 中存在约 7–10px 的 label/status/consent 文字。桌面宽屏视觉精致，但在缩放、高 DPI、小窗口与中文长文案下可读性风险较高。

**影响：** 核心状态和风险说明容易被忽略；低视力与 125–150% 缩放用户负担增加。

**建议：** 正文和风险说明至少 12–13px；次要哈希折叠到详情；提供 compact/comfortable density；对 125/150/200% 缩放测试。

**验收标准：** 关键操作与风险文案在 150% 缩放无裁切；焦点/状态清晰；小窗口有可用布局。

**Issue 草案：** 07-theme-manager-accessibility-and-shortcuts.md

### ACT-034 · Issue 生命周期与完成状态需要清理

**优先级 / 严重度 / 置信度：** P3 / Low / High
**类别 / 工作量：** Community/Maintenance / S

**证据：** 当前公开 Issue #2 的验收项全部勾选且说明 v0.3.2 行为已实现，但仍保持 open；仓库仅有主题提案模板，缺少 bug/performance/security-friendly 模板与 triage SLA。

**影响：** 贡献者难以判断已解决事项；未来用户反馈可能缺少诊断字段，维护者反复追问。

**建议：** 确认 #2 后关闭或重开未完成项；增加 bug/performance 模板、版本/平台/完整诊断字段和标签约定。

**验收标准：** 完成 issue 不长期 open；新 bug 报告默认包含版本、平台、目标 channel、日志脱敏提示和复现步骤。

**Issue 草案：** 10-metadata-rights-and-governance.md


## 6. 推荐 Release Gate

### Gallery 内容发布 Gate

- Source/provenance/hash/schema 全部通过。
- Rights attestation 对 Original 有效；Fan Art 保持 `rightsVerified:false`。
- Light/Dark Token-use matrix 通过。
- Safe-area fixture 和真实 capture 人工批准。
- 多尺寸缩略图已生成，证据 PNG 不作为卡片默认资源。

### Theme Manager Beta Gate

- 网络硬上限、cache atomicity。
- Runtime transaction/rollback 与 monitor degraded。
- 目标发现结构化错误。
- Windows graceful-first 与 force confirmation。
- Dialog/list/shortcut 可访问性。
- CI least privilege 与固定 Action SHA。

### Stable Gate

- Windows Stable/Beta 固定矩阵通过。
- macOS 支持范围与真机证据匹配产品声明。
- 签名、公证/Authenticode 状态明确。
- SBOM、provenance、release manifest 完整。
- P1 全部关闭；与核心路径相关的 P2 有明确处置。

## 7. Issue 写入状态

本次 GitHub 连接器可以读取仓库，但创建 Issue 的写入调用被拒绝。11 个草案的历史映射见 [12-created-github-issues.md](12-created-github-issues.md)；原始草案和创建脚本已在 2026-08-12 清理。此页不声明当前远程 Issue/PR 状态。

## 8. 不建议一次性合并的组合

- 生成器重写 + Runtime 事务 + UI 重构。
- Canonical renderer 更换 + 68 套视觉重审 + 缩略图格式迁移。
- 平台发现重构 + CDP 兼容范围扩大 + 签名身份验证。

这些组合会让回归来源无法定位。请按 [10-implementation-plan.md](10-implementation-plan.md) 和 PR 蓝图 小步实施。
