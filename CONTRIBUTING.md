# 贡献主题

提交主题前，请确认你有权再分发每一份输入素材，也愿意让 Registry 公开记录来源、许可证和 AI 使用情况。

推荐直接使用仓库内的 `$create-codex-theme` Skill：

```text
.codex/skills/create-codex-theme/
```

## 两条素材轨道

默认轨道是原创作品、CC0 或公有领域素材，以及许可证明确允许修改和再分发的作品。这类主题使用 `rightsProfile: original`，只有证据完整时才能标记 `rightsVerified: true`。

非官方同人轨道只接受贡献者明确声明的作品与角色，使用 `rightsProfile: fan-art` 和 [fan-art brief 模板](.codex/skills/create-codex-theme/assets/fan-art-theme-brief.template.json)。必须满足：

- 只用于个人、非商业的粉丝使用
- 标记 `unofficial: true`、`commercialUse: false`、`officialAssetsUsed: false`
- 不使用或重绘官方截图、海报、Logo、宣传素材、镜头构图或他人同人图
- 不模仿具体画师或工作室的标志性画风
- 只出现 manifest 已声明的作品与角色
- 使用 `LicenseRef-ACT-Fan-Art-Notice`，并保持 `rightsVerified: false`

任何轨道都不要提交名人肖像、未经同意的真实人物仿制、品牌素材、无法核对来源的图片或未披露的受保护角色。Fan Art 的详细下架和权利边界见 [docs/fan-art-policy.md](docs/fan-art-policy.md)。

使用 AI 生成不等于自动获得版权许可。贡献者仍然要对输入权利和输出审查负责。

## 主题要求

- 一张 1536×1024 PNG 源图，文件不超过 16 MB
- 左侧保留低信息安全区，主体集中在右侧三分之一
- 源图不能烘焙 Codex UI、假控件、文字、Logo、水印或窗口边框
- 稳定的 kebab-case 主题 ID
- 中文主文案与英文辅助文案
- 明亮、暗色两套 token 和低动态安全行为
- 作者、来源、SPDX 许可证、兼容范围、标签与 provenance
- 标准包只包含 manifest 与声明过的图片
- 标准包内不能出现 JavaScript、CSS、Shell、可执行文件或远程引用

## 本地检查

先生成源图，再运行：

```bash
npm run art:generate -- --ids=<theme-id>
npm run check
npm run serve
```

在浏览器里检查系列筛选、搜索、明暗切换和安装弹窗。要声明某个适配器“可安装”，还需要在真实目标引擎中验证。预览图只能证明外观，不能证明安装成功。

Validator 能检查结构、哈希与对比度，但不能替你确认版权。

## English summary

The default contribution track is original or clearly redistributable artwork. A separate unofficial fan-art track requires declared works and characters, personal non-commercial use, no official assets or copied compositions, `LicenseRef-ACT-Fan-Art-Notice`, and `rightsVerified: false`. Every theme still needs reviewed source art, bilingual copy, dual-mode tokens, explicit provenance, and a code-free canonical package. Run `npm run check` and complete browser review before opening a contribution.
