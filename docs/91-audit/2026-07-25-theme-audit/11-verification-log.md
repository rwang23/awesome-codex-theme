# 11 · 验证记录、方法与限制

## 1. 审查输入

- 用户上传：`awesome-codex-theme-main.zip`
- 解压路径：`/mnt/data/awesome-codex-theme-main/awesome-codex-theme-main`
- GitHub：`rwang23/awesome-codex-theme`，默认分支 `main`
- 关键元数据交叉核对：根 package version/scripts、Catalog revision/theme defaults 与远程 main 一致
- 日期：2026-07-25

## 2. 环境

| 项目 | 值 |
|---|---|
| OS | Linux 隔离审查容器 |
| Node | v22.16.0 |
| npm | 10.9.2 |
| Rust/Cargo | 未安装 |
| Browser automation | Headless Chromium 在该环境中挂起 |

## 3. 仓库与资产盘点

| 指标 | 结果 |
|---|---:|
| 文件数 | 435 |
| 解压总字节 | 301,622,716 |
| 主题/集合 | 68 / 11 |
| 源图 | 68 / 161,635,231 bytes |
| 当前 capture | 136 / 134,635,912 bytes |
| 历史 Native capture | 56 / 2,452,498 bytes |

详细 CSV：[repository-inventory.csv](metrics/repository-inventory.csv)、[language-summary.csv](metrics/language-summary.csv)、[text-file-lines.csv](metrics/text-file-lines.csv)。

## 4. 完整性验证

| 检查 | 结果 |
|---|---:|
| Source SHA mismatch | 0 |
| Prompt SHA mismatch | 0 |
| Duplicate source SHA groups | 0 |
| Duplicate job IDs | 0 |
| Current capture hash mismatch | 0 |
| Historic Native capture mismatch | 0 |

详细数据：[provenance-verification.csv](metrics/provenance-verification.csv)、[native-capture-verification.csv](metrics/native-capture-verification.csv)。

## 5. 命令验证

### `npm test` on clean checkout

- Total: 20
- Pass: 14
- Fail: 6
- 失败测试均依赖缺失的 generated Registry/package/site artifact。
- 日志：the retained verification notes

失败项：

1. repository validates sixty-eight dual-mode code-free themes in eleven collections
2. registry exposes original and disclosed fan-art collections
3. canonical archives contain only declared art, manifest, and Codex Native themes
4. registry exposes declarative full skins, Native fallbacks, and no third-party adapters
5. static gallery builds with every public contract artifact
6. Windows installer is a no-admin helper with a bundled Registry

### `npm run validate`

干净检出立即因缺少 `themes/registry.json` 失败。日志：the retained verification notes。

### `npm run build`

干净检出立即因缺少 `themes/registry.json` 失败。日志：the retained verification notes。

### `npm run generate`

全量运行超过 20 分钟仍未完成，随后在审查环境终止。代表性主题基准见 the retained verification notes。

### Syntax / secret / dynamic code scan

- Node `--check` 对仓库 JS/MJS 通过。
- 高置信 GitHub/OpenAI/AWS/Slack/private-key 模式未发现命中。
- 未发现 `eval`、`new Function`。
- 未发现 Rust `unsafe {`。
- Secret scan 空日志代表无命中：the retained verification notes。

## 6. 视觉量化方法

### Source/capture properties

读取 PNG header 和像素，统计尺寸、模式、字节数、亮度、局部边缘/复杂度。生成 source/capture contact sheets 供人工回查。

### Safe-area complexity

对声明左侧安全区的图像区域计算降采样后的边缘和亮度变化，用于排序视觉风险。这个分数：

- 不是用户研究。
- 不是 WCAG 判定。
- 不等于“主题不可用”。
- 只用于挑出需要优先人工查看的主题。

### Token contrast

按 WCAG 相对亮度/对比度公式计算 Token 组合。Border 结果需要结合真实用途解释，装饰线不必自动满足控件边界门槛。

数据：[theme-visual-metrics.csv](metrics/theme-visual-metrics.csv)、[capture-metrics.csv](metrics/capture-metrics.csv)、[token-contrast.csv](metrics/token-contrast.csv)。

## 7. 未完成的验证

### Rust/Tauri

本环境没有 Cargo/Rust，因此：

- 没有重新编译 Rust。
- 没有运行 Rust test。
- 没有构建 MSI/DMG/AppImage。
- Rust 结论来自源码审查和现有测试代码，而非本次动态执行。

### 浏览器

Headless Chromium 在简单本地页面也挂起，因此：

- 没有本次新生成的 Lighthouse/Playwright/axe 报告。
- 没有重新截图 live GitHub Pages。
- UI 结论基于源码、仓库 capture 和产品截图。

### 真实目标应用

没有在 Windows/macOS 真实 ChatGPT Stable/Beta 上执行：

- CDP ownership/probe。
- Apply/Keep/Reapply/Restore。
- 多 target 注入。
- app update version gate。
- graceful/force restart。
- updater signing/notarization。

这些必须作为正式实施后的 release gate，而不能由本报告替代。

## 8. Demo 校验

交付前执行：

- JS/MJS `node --check`。
- JSON Schema parse。
- YAML parse。
- Markdown 相对链接检查。

Rust Demo 因缺少工具链只进行语法/结构性人工审查，不能宣称已编译。

## 9. 可复现建议

维护者应在有 Node 22、Rust stable、平台 SDK 和浏览器的机器上执行：

```bash
npm ci
npm run test:source       # 实施 PR-01 后
npm run generate -- --summary=build-summary.json
npm run validate
npm run test:generated
npm run desktop:check
npm run build
cargo test --manifest-path apps/theme-manager/src-tauri/Cargo.toml
```

再在固定 Windows/macOS 目标上完成真机矩阵，并将清洗后的日志、截图、hash 和版本绑定到 release manifest。
