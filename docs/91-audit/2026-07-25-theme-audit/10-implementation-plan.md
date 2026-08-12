# 10 · Implementation Plan 与接口优化计划

## 1. 实施原则

1. **先建立可重复验证，再改核心实现。** 没有 hermetic tests 和结构化基线时，不重写生成器或 Runtime。
2. **每个 PR 可独立回滚。** 构建、Runtime、平台、UI、视觉和治理分开。
3. **保留 last-known-good。** Registry cache、主题 Session、发布 artifact 都先验证候选，再原子提交。
4. **不把真机兼容性用静态推断替代。** Windows/macOS 能构建不等于 Keep/Persistence 已验证。
5. **内容证据与浏览媒体分层。** 原始 PNG 保留用于审计，UI 使用优化缩略图。

## 2. 阶段总览

| Phase | 目标 | 主要 PR 蓝图 | 退出条件 |
|---|---|---|---|
| 0 · Baseline | 固定命令、性能、契约和发布基线 | PR-01 | 干净检出 source test 可重复；基准 artifact 可下载 |
| 1 · Build foundation | 生成一次复用、增量/流式生成 | PR-01, PR-02, PR-09 | PR CI 不重复全量生成；暖构建有缓存 |
| 2 · Runtime safety | 网络硬上限、缓存原子、事务注入、监控状态 | PR-04, PR-05 | 失败不破坏旧 Session；超限不会完整缓冲 |
| 3 · Platform diagnostics | 结构化发现错误、正常关闭优先、身份收紧 | PR-06 | 未安装/权限/解析/版本可区分；force 需确认 |
| 4 · UI/Media | 缩略图、稳定 DOM、dialog/键盘/快捷键 | PR-07, PR-08 | 关键键盘流通过；列表不解码全部证据图 |
| 5 · Rendering quality | 焦点裁切、安全区方向、Token-use gate | PR-03 | 68 套新 renderer 输出逐批批准 |
| 6 · Governance/Release | 单一元数据、attestation、SBOM/provenance | PR-09, PR-10 | Release manifest 与 capability matrix 自动生成 |

## 3. Phase 0 · 固定基线

### 任务

- 增加 `test:source`、`test:generated`、`check:full`。
- 保存一个最小生成 fixture，不要求 68 主题全量渲染。
- CI 上传 generator timing、RSS、artifact size、test summary。
- 建立 Node/Schema/Rust contract fixture 目录。
- 将当前 68/136 数量和版本输出为 machine-readable baseline。

### 验收

- 新 clone 后 `npm ci && npm test` 可通过，或在缺工具链时给出明确 skip/先决条件，而不是 6 个业务失败。
- `npm run check:full` 仍覆盖完整生成与包验证。
- 基准结果可比较，不依赖维护者口头描述。

### 回滚

仅新增脚本与测试命令，不改变生成物格式；可安全回滚。

## 4. Phase 1 · 构建基础

### 4.1 CI 先生成一次

- Linux validate job 执行 generate/validate/prepare。
- 上传 generated repository subset 与 desktop thumbnails。
- Windows/Linux/macOS job 下载相同 artifact。
- Pages 下载相同 artifact 或通过相同 cache key 复用。
- 非 release job `contents:read`。

### 4.2 增量生成器

- 完整 fingerprint：renderer schema、source hash、mode、尺寸、focus、safeArea、taskMode、tokens、grading constants。
- 支持 `--ids`、`--concurrency`、`--summary`。
- 每主题原子写入与 Buffer 释放。
- 单次 source decode，多输出复用。
- 先串行流式，再加入有界并发，避免一次同时改两类变量。

### KPI

- 暖构建 0 pixel rerender。
- 单主题改动不触碰其它主题 mtime/hash。
- CI 同一 commit 只完成一次 canonical generate。
- 峰值 RSS 不随主题总数近似线性增长。

## 5. Phase 2 · Runtime 安全

### 5.1 Download 接口

推荐 Rust API：

```rust
async fn download_verified(
    client: &reqwest::Client,
    url: &Url,
    policy: DownloadPolicy,
    expected: ExpectedArtifact,
) -> Result<VerifiedArtifact, DownloadError>;
```

`DownloadPolicy` 包含 hard byte limit、timeout、redirect policy、allowed content types；`VerifiedArtifact` 只在累计字节、声明 bytes、signature/hash 全部通过后返回。

### 5.2 Session 接口

```rust
enum ApplyPhase { Preparing, Injecting, Verifying, Committing, Active, RollingBack, Degraded }

struct CandidateSession {
    descriptor: PreparedDescriptor,
    targets: Vec<VerifiedTarget>,
    applied: Vec<AppliedTarget>,
}
```

- `prepare_candidate()` 不改变 active Session。
- `apply_candidate()` 记录每个 target undo token。
- `verify_candidate()` 全部 readback。
- `commit_candidate()` 原子交换。
- `rollback_candidate()` 逆序清理。

### 5.3 Monitor health

```ts
interface RuntimeHealth {
  state: 'idle' | 'active' | 'degraded';
  consecutiveErrors: number;
  lastErrorCode?: string;
  lastSuccessfulCheckAt?: string;
  recoverable: boolean;
}
```

UI 不再只显示 active 布尔值。

### 验收

- target 2 失败时 target 1 被恢复，旧 Session 仍 active。
- rollback 失败明确进入 degraded。
- chunked 超限测试不分配完整 payload。
- cache 更新中断仍保留旧版本。

## 6. Phase 3 · 平台发现与重启

### 6.1 结构化发现结果

```rust
enum DiscoveryError {
    UnsupportedPlatform,
    CommandUnavailable,
    PermissionDenied,
    CommandFailed { exit_code: Option<i32> },
    ParseFailed,
    NoSupportedInstall,
}
```

不要 `unwrap_or_default()`。前端给每种错误提供不同动作。

### 6.2 Graceful-first

- Windows 请求正常关闭。
- 等待进程退出并显示倒计时状态。
- 超时后用户二次确认才 force。
- macOS 限制 `/Applications` 与 `$HOME/Applications`。
- 正式签名后增加 Team ID/designated requirement。

### 真机矩阵

- Windows 10/11，Stable/Beta，单窗口/多窗口。
- macOS Apple Silicon；如发布 Intel，则 Intel 也必须实测。
- 正常关闭、拒绝关闭、未保存输入、升级后 version gate。

## 7. Phase 4 · UI 与媒体

### 7.1 Thumbnail pipeline

生成：320、480、960 WebP/AVIF，带 width/height、hash、byte count。Registry capture 保留 original evidence URL，并新增 presentation variants，不破坏现有证据字段。

```json
{
  "capture": {
    "evidence": { "url": "...png", "sha256": "...", "bytes": 123 },
    "presentation": [
      { "width": 320, "format": "webp", "url": "...", "sha256": "...", "bytes": 123 },
      { "width": 960, "format": "webp", "url": "...", "sha256": "...", "bytes": 456 }
    ]
  }
}
```

### 7.2 Stable DOM

- keyed theme card map。
- 筛选只更新 hidden/order。
- 模式切换只更新可见 image src。
- `loading=lazy`、`decoding=async`、固定 aspect ratio。

### 7.3 Accessibility

- 自定义 overlay 改原生 dialog。
- 复合控件要么完整 APG，要么简化为 button/list。
- 快捷键先检查 selection/editable/dialog context。
- 200% zoom、forced-colors、reduced-motion。

### KPI

- Gallery 首屏与滚动媒体预算达标。
- Desktop 首开不解码全部 136 证据 PNG。
- axe serious/critical 为 0。
- 关键操作全键盘完成。

## 8. Phase 5 · Renderer v2 与视觉重审

### 8.1 不原地静默改变所有主题

Renderer v2 改变像素 hash，必须：

- 增加 renderer version。
- 旧输出可复现。
- 为每套主题生成 before/after contact sheet。
- 按集合分批批准，不一次性替换 68 套。

### 8.2 焦点与安全区

- focal-aware cover crop。
- left/right/center/none grading。
- Home/Task/Diff/Settings/Dialog fixture。
- 新主题使用 16:9 >=2560×1440 源图。

### 8.3 Token-use matrix

Validator 不只检查 token 对 token，而检查实际组件组合。装饰 border 和交互 border 分开。

## 9. Phase 6 · 治理与发布

- 单一 release metadata。
- source review attestation。
- Actions 固定 SHA、Dependabot。
- CodeQL/actionlint/zizmor/cargo-audit 或等价工具。
- 生成 CycloneDX/SPDX SBOM。
- GitHub artifact attestation/release provenance。
- Beta 标记为 prerelease。
- Capability matrix 注入 Gallery、README 和 Manager。

## 10. PR 切片

| PR | 内容 | 依赖 | 回滚风险 |
|---|---|---|---|
| PR-01 | Hermetic build/tests | 无 | 低 |
| PR-02 | Incremental generator | PR-01 | 中 |
| PR-03 | Focal-aware rendering | PR-01/02 | 高，像素 hash 变化 |
| PR-04 | Runtime transaction | PR-01 | 中高，需真机 |
| PR-05 | Network bounds/cache atomicity | PR-01 | 中 |
| PR-06 | Platform restart/diagnostics | PR-01 | 中高，需跨平台 |
| PR-07 | Thumbnail/media performance | PR-02 | 中，Registry 扩展 |
| PR-08 | Accessibility/shortcuts | PR-01 | 低中 |
| PR-09 | CI/supply chain | PR-01/02 | 中 |
| PR-10 | Governance/metadata | PR-01 | 低中 |

原始非生产蓝图已在 2026-08-12 清理；当前实现、测试和发布文档是后续执行的权威。

## 11. 建议责任分工

- **Build/Release owner：** generator、CI artifact、版本、SBOM。
- **Runtime owner：** network、cache、transaction、monitor。
- **Platform owner：** discovery、restart、identity、真机矩阵。
- **UI owner：** Gallery/Desktop media、a11y、i18n。
- **Design/Governance owner：** safe area、Token、rights attestation、视觉批准。

小团队可以一人多角色，但每个 PR 必须至少有“实现者”和“审查者”两个视角，尤其是 Runtime 与权利审核。

## 12. 完成定义

一个优化不能只以“代码合并”为完成。至少包含：

- 自动测试。
- 失败与回滚路径。
- 文档与 release metadata。
- 性能/资源指标。
- 对应平台真机证据（若涉及平台/Runtime）。
- 不含用户内容的清洗诊断。
- Issue 验收项关闭。
