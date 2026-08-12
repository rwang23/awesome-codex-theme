# 03 · 安全、信任边界与供应链审查

## 1. 安全结论

本次没有发现高置信凭据、私钥、GitHub Token、OpenAI Key、AWS Key、Slack Token，也没有发现 `eval`、`new Function` 或 Rust `unsafe`。主题归档不含可执行代码，远程素材使用固定来源、路径、字节数、PNG 签名与 SHA-256 验证，CDP 只接受 loopback 和经过身份核对的目标。这些是项目最成熟的部分。

审查发现的安全相关问题主要属于 **DoS/资源边界、事务一致性、平台操作风险和供应链最小权限**，而不是已证实的远程代码执行漏洞。优先级仍然较高，因为 Theme Manager 会管理本地进程、网络内容和用户持续主题状态。

## 2. 威胁模型

| 资产/边界 | 可能威胁 | 当前控制 | 剩余风险 |
|---|---|---|---|
| Theme Pack | 社区贡献植入代码或路径穿越 | 固定 archive layout、Schema、路径与哈希、无代码包 | Validator 多实现漂移可能形成绕过差异 |
| Registry/Catalog | 远程篡改、回滚、超大响应 | 固定 origin、revision、hash、byte count | Catalog 与 Registry 同源；部分响应在校验前完整缓冲 |
| PNG 素材 | 内容替换、格式炸弹、资源耗尽 | 路径、签名、SHA、声明长度 | Chunked/虚假长度下仍可能先占用过多内存 |
| Local cache | 更新中断导致损坏 | 临时路径与校验思路存在 | 某路径先 remove 再 rename，有短暂无有效缓存窗口 |
| CDP target | 连接错误进程/页面 | exact package/executable/port owner/app:// target | 正式签名后仍可增加 Team ID/designated requirement |
| Runtime apply | 部分页面注入、旧主题丢失 | 注入后 readback、cleanup function | 非事务、多 target 失败不回滚、旧 Session 提前清理 |
| Persistence controller | 静默失效、状态误报 | 错误阈值、版本 gate | 监控失败退出后 UI 可能仍显示 active |
| Windows restart | 未保存输入丢失 | 精确匹配进程 | `Stop-Process -Force` 没有 graceful-first 和二次确认 |
| GitHub Actions | 依赖/Action 被替换、写权限滥用 | GitHub 托管 runner、release 条件 | 可变 Action tag，矩阵 job 写权限过宽，缺 SBOM/provenance |

## 3. 已做得很好的控制

### 3.1 数据与代码隔离

主题作者只能提交 Manifest、PNG 和严格 Native 字符串。Runtime CSS/JS 不由 Theme Pack 提供，避免“主题即插件”的执行风险。

### 3.2 内容寻址与实机证据

本次重新计算 68 张源图、136 张当前 capture、56 张历史 Native capture，全部与记录哈希一致。Provenance 中 source/prompt hash 全部匹配，未发现重复 source SHA 与 job ID。

### 3.3 CDP 身份验证思路正确

代码没有把“本地端口”自动等同于可信。它绑定了用户选定包、进程、executable、listener ownership 与 `app://` target。这一控制应在任何兼容性重构中保持。

### 3.4 前端能力较窄

Tauri capability 没有把任意文件系统、Shell 或进程权限直接暴露给 Renderer；敏感操作集中在 Rust 命令中。

## 4. P1 安全与可靠性问题

### 4.1 网络响应必须在读取过程中限流

`catalog.rs` 与 `skin_runtime.rs` 部分路径使用 `.bytes()`。声明长度检查不是硬内存上限，因为服务器可以使用 chunked encoding、错误 Content-Length 或在连接中持续发送。

正确流程：

1. 请求设置总超时、连接超时与重定向策略。
2. 先检查允许的状态码、Content-Type 与可选 Content-Length。
3. 按 chunk 读取；每次追加前判断 `current + chunk > hard_limit`。
4. 超限立即关闭连接并返回稳定错误码。
5. 完成后再检查声明 byte count、PNG signature 和 SHA-256。
6. 写入临时文件，验证后原子 rename。

Demo：capped_download.rs。

建议初始上限应从当前分布和产品契约推导，而不是随意设很大：Catalog/Registry 数 MiB 内、单 PNG 可按 Manifest 上限、Updater 独立策略。上限需要留增长余量并写测试。

### 4.2 Full Skin 切换应保留 last-known-good

当前先清理旧 Session，再准备新 Session；多 target 任一失败也不回滚前面已注入页面。安全属性应从“失败后尽量清理”升级为“提交前不破坏旧状态”。

推荐两阶段：

- **Prepare**：下载、限流、hash、descriptor、target、Runtime 模板全部就绪。
- **Apply candidate**：对每个 target 注入，记录 undo token，并 readback。
- **Commit**：所有 target 成功后原子交换 active Session。
- **Cleanup old**：新 Session 已 active 后再清理旧 Session。
- **Rollback**：任何 candidate target 失败，逆序执行 undo；若 rollback 也失败，进入 degraded 并明确展示。

Demo：transactional_injection.rs。

### 4.3 Windows 重启不能默认 force kill

即使进程匹配准确，强制终止仍可能丢失未发送 prompt、草稿或任务状态。推荐：

- 先通过正常窗口关闭/应用协议请求退出。
- 等待并检测进程状态。
- 超时后显示“可能丢失未保存输入”的明确二次确认。
- 用户确认后才执行 force kill。
- 记录结果，但不记录聊天内容或用户路径。

### 4.4 CI 权限和 Action 固定

验证与构建矩阵应保持 `contents: read`。只有受保护 tag/release job 能获得写权限、签名密钥和 release token。第三方与官方 Actions 都应固定 commit SHA，并由 Dependabot 或 Renovate 提交升级 PR。

## 5. P2 信任增强

### 5.1 同源 hash 不是独立签名

固定 GitHub Pages origin + Catalog 中 Registry hash 能防止传输损坏和只替换单个文件，但如果站点发布权限被接管，攻击者可同时替换 Catalog、Registry 和素材记录。建议用离线 release key 对 Catalog 或 release manifest 签名，并实现 key rotation、最低 revision 和 rollback protection。

### 5.2 Schema/Validator 等价性

Node、JSON Schema、Rust 对 exact-key、相对路径、package 关系和 Provenance 的判断应共享 fixtures。网络边界最怕“本地生成器认为无效，远程客户端却接受”的差异。

### 5.3 macOS 身份验证

当前路径检查可拒绝 `/Volumes`，但 `/tmp/Foo.app/Contents/MacOS/...` 仍可能满足字符串条件。持久化目标应限制在 `/Applications` 或 `$HOME/Applications`。正式 Developer ID 签名后，进一步检查 TeamIdentifier/designated requirement。

### 5.4 Source rights 的 `verified` 不能自动推导

“原创轨道”不是“已经人工核验”的同义词。生成器应只在存在绑定 source SHA 的 approved attestation 时输出 `rightsVerified: true`。Demo：review-attestation.schema.json。

## 6. CSS/DOM 兼容性安全

`runtime.css` 中部分宽泛选择器会把 text/SVG 强制成主题色，可能掩盖错误、警告、diff、禁用状态。它不是传统安全漏洞，但会降低用户对危险或失败状态的感知。应建立 semantic fixture，明确保留：error、warning、success、disabled、focus、selection、diff add/remove、链接 visited/hover 和 high-contrast mode。

全页面 MutationObserver 与 fixed background 也应设置长会话性能预算，避免主题系统在大量任务输出时成为资源放大器。

## 7. 安全发布 Gate

下一次把 Theme Manager 标记为稳定版前，至少要求：

- 所有网络响应在流式读取阶段有硬上限和测试。
- Cache 更新原子，不先删除 last-known-good。
- Full Skin 多 target 事务与 rollback 测试通过。
- Monitor degraded 可见，状态不会假 active。
- Windows force kill 需要二次确认。
- 验证 job 无写权限，release job 隔离。
- Actions 固定 SHA；生成 SBOM 和 release provenance。
- SECURITY.md 给出可实际使用的私密报告渠道或 GitHub Security Advisory 指引。

## 8. 隐私判断

代码设计明确避免读取聊天、Token、私有应用数据；本次审查也未发现主动收集遥测或上传本地诊断的路径。后续增加 observability 时，应坚持 **本地结构化诊断、用户主动复制、默认不上传**，并自动清洗用户名、路径、端口、WebSocket URL 和页面标题。
