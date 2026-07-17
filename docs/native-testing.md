# Codex Native 测试与实机截图

这份流程把“格式可解析”“Codex 能导入”和“Gallery 有真实截图”分成三条证据，避免用生成封面代替实机结果。

## 当前基线

- Stable：`OpenAI.Codex_26.715.2305.0_x64__2p2nqsd0c76g0`，版本 `26.715.2305.0`
- 独立 Beta 测试台：`OpenAI.CodexBeta_26.707.3351.0_x64__2p2nqsd0c76g0`，版本 `26.707.3351.0`
- Beta AUMID：`OpenAI.CodexBeta_2p2nqsd0c76g0!App`
- Stable 与 Beta 使用不同 package family 和数据目录；本轮只修改 Beta 的测试主题，稳定版未触碰
- Native 分享格式前缀为 `codex-theme-v1:`
- 两个版本的“设置 > 外观”都提供明亮/暗色主题导入与复制
- Native v1 没有背景图片字段

官方设置参考：[Codex settings and appearance](https://learn.chatgpt.com/docs/reference/settings)

## 三层验证

### 1. 仓库级

运行：

```bash
npm run check
```

Validator 会解析 56 份 Native 字符串，核对格式、明暗模式、颜色、语义色、哈希、体积、Registry 值和 `.act-theme` 内副本，并拒绝两个条目复用同一份可安装 Native 配色。这能证明生成结果自洽且每个展品的安装结果不同，但不能证明 Codex 已经渲染它。

### 2. 实机导入

手动验证时：

1. 记录 Codex 版本和待测 Native 文件 SHA-256。
2. 打开“设置 > 外观”。
3. 先选择对应的明亮或暗色主题。
4. 点“导入”，粘贴完整 `codex-theme-v1:` 字符串。
5. 重新打开外观设置，确认字段仍能读回。
6. 打开固定测试任务，检查导航、正文、代码块、diff、Skill 标记和焦点状态。
7. 恢复测试实例原设置。

当前正在工作的 Codex 实例可以即时导入，不必退出应用，但设置会影响该实例的全局外观。除非用户明确同意，不应在正在工作的实例里做批量采集。

仓库的固定 Beta 流程使用：

```bash
npm run screenshots:probe
npm run screenshots:capture -- --expected-baseline=<approved-sha256>
```

`probe` 只读核对端口所有者、准确包路径、`app://-/index.html` 目标、Appearance 导入入口、当前明暗分享字符串和 shell 模式。`capture` 还会：

1. 要求调用方提供已批准的基线指纹。
2. 逐套导入 56 份 Native 字符串。
3. 从应用的 Copy theme 读回 payload；Beta 会把十六进制颜色规范化为小写，比较时按语义字段核对。
4. 隐藏含私人项目和任务名称的主侧栏。
5. 在固定的 `settings-appearance-v1` fixture 以 1440×810 采集。
6. 写入截图 SHA-256、Native 哈希、读回哈希、版本与时间。
7. 在 finally 阶段恢复两份原始主题、System shell 和原始侧栏状态，再次读回基线指纹。

本轮结果在 `screenshots/codex-beta-26.707.3351.0/manifest.json`：56/56 唯一模式、错误日志为空，结束指纹与开始指纹一致。

### 3. 截图证据

每张实机截图至少绑定：

- theme id 与明暗模式
- Codex 桌面版本
- Native 文件 SHA-256
- 采集日期
- 固定窗口尺寸与固定测试任务版本
- 导入成功后的应用画面

封面与截图分开命名和记录。封面继续来自 `themes/<id>/previews/`；实机截图位于 `screenshots/codex-beta-26.707.3351.0/`，并在 Registry 的 `capture` 字段中绑定证据，不覆盖 `preview` 字段。Gallery 优先展示 capture，缺失时才回退到 cover。

## 是否需要第二台电脑

不需要物理第二台电脑。优先顺序是：

1. **独立的 ChatGPT Beta 包**：本机已经安装并核对 package family、准确可执行文件和独立数据目录。本轮 56 次导入、截图和回滚均在该包完成。
2. **Windows VM**：最稳妥。使用独立用户目录、固定分辨率和专门测试账号，适合后续接入自托管 Windows runner。
3. **单独 Windows 用户**：成本低，但仍需确认应用包和登录态隔离是否满足批量截图要求。

普通 GitHub 托管 runner 不适合自动安装 Microsoft Store 应用、完成登录并操作桌面 GUI。稳定的自动截图应使用预装并登录的自托管 Windows VM；GitHub Actions 只负责派发、收集和校验证据。

## 后续版本更新

截图证据只绑定 Beta `26.707.3351.0`，不能自动延伸到下一版本。应用升级后先运行 probe；包身份、Appearance 契约或基线任一变化，都要停止批量导入，重新核对脚本和批准新的基线。长期 CI 应迁移到预装、已登录、可回滚的自托管 Windows VM。

## English summary

Repository validation proves that Native strings are internally consistent. The current 56 real screenshots were captured from the separately identified ChatGPT Beta `26.707.3351.0` package after semantic import readback, with the private sidebar hidden and the original theme baseline restored. A second physical computer is unnecessary. A dedicated Windows VM remains the most reliable long-term automation target.
