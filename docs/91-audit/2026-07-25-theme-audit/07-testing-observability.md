# 07 · 测试与可观测性审查

## 1. 当前测试资产

项目并非没有测试。根 Node 测试已经覆盖：

- 主题数量、集合、Registry 结构。
- Original/Fan Art 分类。
- Canonical archive 内容。
- Full Skin/Native 声明。
- Gallery 公开产物。
- Windows installer 边界。
- Full Skin runtime 模板与部分行为。

Rust 源码中也能看到针对解析、平台函数、版本和运行时行为的单元测试。现有测试对“主题包必须无代码”“路径/哈希/结构一致”提供了重要回归保护。

## 2. 本次命令结果

| 命令/检查 | 结果 |
|---|---|
| `npm test` on clean checkout | 20 total / 14 pass / 6 fail，失败均源于生成 Registry/包缺失 |
| `npm run validate` on clean checkout | 失败，缺少 `themes/registry.json` |
| `npm run build` on clean checkout | 失败，缺少 `themes/registry.json` |
| JS/MJS syntax check | 通过 |
| Source/provenance hashes | 68/68 通过 |
| Current capture hashes | 136/136 通过 |
| Historic native capture hashes | 56/56 通过 |
| High-confidence secret scan | 未发现命中 |
| Rust tests | 本环境无 Cargo，未运行 |
| Fresh browser/Playwright | Chromium 在本环境挂起，未运行 |
| Full generator | 超过 20 分钟后终止 |

## 3. 测试结构问题

### 3.1 默认测试依赖昂贵生成物

测试并没有自动说明“先生成”；在缺少 Registry 时显示 6 个看似业务失败。应把缺失 artifact 变成明确的 skip/fixture setup，或把 generated tests 放到单独命令。

### 3.2 Renderer 交互几乎没有自动回归

当前没有证据表明以下流程有 DOM 自动化：

- 键盘筛选与主题选择。
- Dialog focus trap/恢复。
- Ctrl/Cmd+C 与正常复制冲突。
- Mode 切换后的图片节点复用。
- 语言切换后的可访问名称。
- 网络失败、空 Catalog、过期 Catalog。

### 3.3 Runtime 缺少关键故障注入测试

需要 Mock：

- target A 成功、target B 失败，验证 A 回滚。
- rollback 失败进入 degraded。
- monitor 连续错误后 UI 状态变化。
- chunked response 超过上限。
- cache rename 失败保留旧文件。
- 新 Session 验证失败不清理旧 Session。

### 3.4 Screenshot CI 只检查非空文件

Pages 工作流能生成 screenshot 是好起点，但文件非空无法证明 Registry 正确、图片无 404、卡片数量正确、控制台无错误或页面可访问。

## 4. 建议测试金字塔

### Layer 1 · 快速纯函数测试

每个 PR 数秒内完成：

- Catalog normalization/fingerprint。
- focal crop 坐标。
- token-use contrast。
- path/URL validation。
- error enum serialization。
- shortcut context predicate。

### Layer 2 · Contract fixtures

Node、JSON Schema、Rust 共享 valid/invalid fixtures：

- exact keys
- mode pairing
- package entries
- provenance
- hashes/bytes
- capture/native mapping
- revision rollback

### Layer 3 · Rust service tests

使用 mock HTTP/CDP/process adapter：

- streaming limits
- cache atomicity
- transaction/rollback
- monitor health
- graceful/force restart policy
- target discovery diagnostics

### Layer 4 · Renderer DOM/a11y

可使用 jsdom + Testing Library 或浏览器测试：

- state/render diff
- dialog focus
- listbox or plain button keyboard
- i18n accessible names
- copy shortcut
- image lazy/decode behavior
- axe scan

### Layer 5 · Browser Gallery

Playwright：

- 68 卡片、136 模式 metadata。
- Registry/schema/package/capture 请求无 404。
- console/page errors 为 0。
- 搜索、过滤、dialog、语言、键盘。
- 小范围截图 diff。
- 页面和媒体预算。

### Layer 6 · 真机兼容性台

Windows Stable/Beta、macOS Apple Silicon/Intel 分开记录：

- 发现、Apply、readback、重启、replay、更新 gate、Restore。
- 正常退出与强制退出。
- 多窗口/多页面 target。
- 版本升级后保持 Native，显式 Reapply 才恢复。
- 未保存输入保护。

## 5. 可观测性设计

项目应保持不采集用户内容，但可以有本地、结构化、可清洗诊断：

```json
{
  "diagnosticId": "uuid",
  "timestamp": "2026-07-25T00:00:00Z",
  "managerVersion": "0.3.2",
  "platform": "windows-x64",
  "operation": "apply_keep",
  "phase": "verify_target_2",
  "errorCode": "INJECTION_READBACK_FAILED",
  "retryable": true,
  "rollback": "succeeded",
  "targetChannel": "beta",
  "targetVersion": "redacted-or-explicit-user-approved"
}
```

不要记录：聊天内容、页面文本、Token、用户目录、完整 WebSocket URL、端口、窗口标题。用户主动点击“Copy diagnostics”时再复制清洗后的内容。

生成器也应输出机器可读 timing summary，CI 展示 cache hit、每主题耗时和峰值 RSS。

## 6. 发布验收矩阵

| 能力 | PR 必须 | Nightly | Release Gate | 真机人工 |
|---|---:|---:|---:|---:|
| Source tests | ✓ | ✓ | ✓ |  |
| Generated fixture tests | ✓ | ✓ | ✓ |  |
| Full cold generate |  | ✓ | ✓ |  |
| Rust unit/integration | ✓ | ✓ | ✓ |  |
| Renderer keyboard/axe | ✓ | ✓ | ✓ | 部分 |
| Gallery Playwright | ✓ | ✓ | ✓ |  |
| Windows Stable/Beta smoke |  | ✓/定期 | ✓ | ✓ |
| macOS Apple Silicon |  | 定期 | ✓ | ✓ |
| macOS Intel |  | 定期 | 视支持承诺 | ✓ |
| Signing/updater |  |  | ✓ | ✓ |
| SBOM/provenance |  | ✓ | ✓ |  |

## 7. 优先补齐的测试

1. Clean checkout source test。
2. Streaming response limit。
3. Multi-target transaction/rollback。
4. Target discovery error preservation。
5. Dialog focus + list keyboard + shortcut conflict。
6. Gallery 404/console/card count/axe。
7. Focal crop golden fixtures。
8. Long-session observer performance。
9. Windows graceful restart。
10. macOS persistence capability matrix。
