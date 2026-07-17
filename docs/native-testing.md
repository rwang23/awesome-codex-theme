# Codex Native 测试与实机截图

这份流程把“格式可解析”“Codex 能导入”和“Gallery 有真实截图”分成三条证据，避免用生成封面代替实机结果。

## 当前基线

- 本地已检查 Codex 桌面版 `26.715.2305.0`
- Native 分享格式前缀为 `codex-theme-v1:`
- 官方设置说明确认“外观”支持基础主题、强调色、背景色、前景色、UI 与代码字体，并支持分享自定义主题
- Native v1 没有背景图片字段

官方设置参考：[Codex settings and appearance](https://learn.chatgpt.com/docs/reference/settings)

## 三层验证

### 1. 仓库级

运行：

```bash
npm run check
```

Validator 会解析 56 份 Native 字符串，核对格式、明暗模式、颜色、语义色、哈希、体积、Registry 值和 `.act-theme` 内副本。这能证明生成结果自洽，但不能证明 Codex 已经渲染它。

### 2. 实机导入

在测试实例中：

1. 记录 Codex 版本和待测 Native 文件 SHA-256。
2. 打开“设置 > 外观”。
3. 先选择对应的明亮或暗色主题。
4. 点“导入”，粘贴完整 `codex-theme-v1:` 字符串。
5. 重新打开外观设置，确认字段仍能读回。
6. 打开固定测试任务，检查导航、正文、代码块、diff、Skill 标记和焦点状态。
7. 恢复测试实例原设置。

当前正在工作的 Codex 实例可以即时导入，不必退出应用，但设置会影响该实例的全局外观。除非用户明确同意，不应在正在工作的实例里做批量采集。

### 3. 截图证据

每张实机截图至少绑定：

- theme id 与明暗模式
- Codex 桌面版本
- Native 文件 SHA-256
- 采集日期
- 固定窗口尺寸与固定测试任务版本
- 导入成功后的应用画面

封面与截图必须分开命名和展示。封面继续来自 `themes/<id>/previews/`；实机截图建议进入 `themes/<id>/screenshots/`，并在 Registry 明确标记为 `capture`, 不能覆盖 `preview` 字段。

## 是否需要第二台电脑

不需要物理第二台电脑。优先顺序是：

1. **独立的 ChatGPT Beta 包**：Microsoft Store 当前列出 `ChatGPT (Beta)`，产品 ID 为 `9N8CJ4W95TBZ`；稳定版 `ChatGPT` 的产品 ID 为 `9PLM9XGG6VKS`。Beta 尚未在本机安装。不同 Store ID 说明它值得作为同机测试台候选，但安装前不能假定它一定拥有独立的数据目录或能与当前包完全隔离。
2. **Windows VM**：最稳妥。使用独立用户目录、固定分辨率和专门测试账号，适合后续接入自托管 Windows runner。
3. **单独 Windows 用户**：成本低，但仍需确认应用包和登录态隔离是否满足批量截图要求。

OpenAI 关于新版桌面应用的说明提到，它在迁移期间可能与现有或 Classic 应用并存：[Moving to the new ChatGPT desktop app](https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app)。这不能替代对 Beta 包身份和数据目录的实机检查。

普通 GitHub 托管 runner 不适合自动安装 Microsoft Store 应用、完成登录并操作桌面 GUI。稳定的自动截图应使用预装并登录的自托管 Windows VM；GitHub Actions 只负责派发、收集和校验证据。

## 下一步的安全门

安装 Beta 会改变本机软件状态，因此需要单独确认。获得确认后，先安装产品 `9N8CJ4W95TBZ`，再核对 package family、数据目录和登录态是否与稳定版隔离。只有隔离成立，才导入一套测试主题并采集第一组明暗截图。

## English summary

Repository validation proves that Native strings are internally consistent. A real screenshot requires an import in the named Codex desktop version, a fixed fixture, and evidence linking the capture to the Native file hash. A second physical computer is unnecessary. A separately identified Beta package may work as a same-machine test bench, but package and data isolation must be verified after an explicitly approved installation. A dedicated Windows VM remains the most reliable automation target.
