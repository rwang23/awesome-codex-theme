# 08 · 社区、版权、版本与文档治理审查

## 1. 总体判断

项目对社区主题的权利边界比多数视觉开源库更认真：明确 Original 与 Fan Art 两条轨道、禁止官方资产和模仿特定艺术家、Fan Art 强制非商业与 `rightsVerified:false`、Provenance 记录 source/prompt hash、真实应用截图和素材源分开。这些规则应继续作为项目品牌的一部分。

治理问题主要在于：**“规则写得很好”还没有完全转化成机器可验证、可追责、可追踪的审核记录与发布元数据。**

## 2. Provenance 与权利审核

### 已验证结果

- 68/68 source hash 匹配。
- 68/68 prompt hash 匹配当前有效 prompt 组合。
- 0 个重复 source SHA group。
- 0 个重复 job ID。
- 49 个 Original、19 个 Fan Art。

### 需要改进

生成器对非 Fan Art 自动输出 `rightsVerified:true`。但“分类为 original”只能说明选择了哪条贡献轨道，不能证明已经完成来源、输入、输出、相似性、真人、Logo 与授权检查。

建议新增独立 attestation：

```json
{
  "themeId": "example",
  "sourceSha256": "...",
  "reviewer": "github-handle-or-team",
  "reviewedAt": "2026-07-25T00:00:00Z",
  "decision": "approved",
  "checks": {
    "sourceRights": true,
    "noOfficialAssets": true,
    "noThirdPartyFanArt": true,
    "noRealPersonLikeness": true,
    "noEmbeddedLogoOrText": true,
    "promptAndOutputReviewed": true
  },
  "notes": ""
}
```

只有 schema 有效、source SHA 相同、decision approved 时生成 `rightsVerified:true`。源图变化必须自动使旧审核失效。Demo：review-attestation.schema.json。

## 3. Fan Art 产品呈现

当前政策写得清楚，但 Gallery 和外部传播中仍建议：

- Fan Art badge 不只在详情页，卡片可见。
- 明确 unofficial、personal non-commercial、not endorsed。
- 不把 Fan Art 放在默认“Verified Rights”排名中。
- 提供清晰下架/权利人联系渠道。
- 社区点赞只代表兴趣，不代表版权批准，这一点继续保留。

## 4. 版本与发布通道

根包、Theme Manager、Cargo 和 Release 文案存在多个版本源；Workflow 把 release 命名 Beta，却设置 `prerelease:false`。建议：

- `managerVersion`、`catalogRevision`、`runtimeVersion`、`rendererVersion` 分开定义。
- Beta/alpha 使用 GitHub prerelease。
- release manifest 记录构建 commit、Action SHA、SBOM、签名、平台/架构和测试证据。
- Catalog 更新不必强制 Manager 更新；Runtime/compatibility/security boundary 变化必须 Manager 更新。README 已有这个产品边界，应机器化。

## 5. 兼容性声明

README 已明确 Windows persistence 有实测、macOS physical persistence pending，这是诚实且正确的。问题是下载区和产品主入口仍容易让普通用户把“能构建 macOS DMG”理解为“Full Skin Keep 在 macOS 已验证”。

建议在 Gallery、Release 与 Manager 中统一 capability matrix：

| 平台 | Browse/Preview | Native copy | One-time Full Skin | Keep/Persistence | 签名状态 |
|---|---|---|---|---|---|
| Windows x64 | Verified | Verified | Verified on named build | Verified on named build | 未 Authenticode |
| macOS Apple Silicon | Build available | 待/已验证 | Experimental | Physical test pending | ad-hoc / 未 notarized |
| macOS Intel | Build available or not | 明确状态 | 明确状态 | 明确状态 | 明确状态 |

状态必须由 release metadata 注入，不能手写多份。

## 6. Issue 与贡献流程

当前只有 Theme Proposal 模板；Issue #2 的验收项全部完成却仍 open。建议增加：

- Bug report：平台、CPU、Manager version、target channel/version、完整清洗诊断、复现步骤。
- Performance report：操作、主题数、耗时、RSS、截图/trace（不得含聊天）。
- Accessibility report：键盘/读屏器/缩放/步骤。
- Compatibility report：Stable/Beta、版本、发现/Apply/Keep/Restore 阶段。
- Theme proposal：继续保留。
- Security：不使用 public Issue，指向 GitHub Security Advisory 或实际私密渠道。

建议标签：`area:generator`、`area:runtime`、`area:platform`、`area:gallery`、`area:desktop-ui`、`area:theme-quality`、`security-hardening`、`accessibility`、`performance`、`good-first-issue`、`needs-reproduction`。

## 7. 文档治理

### 当前优点

- README、中文 README、架构、标准、安装、持久化、签名、macOS 测试、Fan Art 政策齐全。
- 明确不修改 ChatGPT 文件、不读取聊天/Token、不把 screenshot mock 当实机证据。
- 对未知 publisher、签名/公证边界表达较诚实。

### 改进方式

- 关键数字和版本由构建注入。
- Runtime/Adapter 架构片段由测试生成快照。
- 每个 release note 链接具体验证 artifact。
- 文档中的命令标注冷/暖耗时和先决条件。
- `SECURITY.md` 给出可执行的私密报告方法。
- `CHANGELOG` 与 GitHub Release channel 同步。

## 8. 社区扩展建议

在工程基础修复前，不建议以“快速增加主题数”为第一 KPI。更健康的社区指标：

- 主题提案 → 合格 source art 转化率。
- 审核平均时长。
- Rights attestation 完整率。
- 实机 capture 覆盖率。
- 主题更新后回归通过率。
- Original/Fan Art 清晰披露率。
- 首次贡献者本地 check 成功率。

完成增量生成与 hermetic test 后，再扩大社区贡献会显著降低维护成本。
