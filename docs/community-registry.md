# 社区主题 Registry 路线

用户投稿、讨论、投票和精选适合这个项目，但不适合直接塞进 GitHub Pages。Pages 是静态站点，没有可信的用户身份、文件上传、投票去重、举报或审核后端。

首阶段用 GitHub 自己的协作能力。等投稿量证明需要独立服务后，再增加登录和存储。

## 第一阶段：GitHub 原生社区

Gallery 的“提交主题提案”会打开结构化 Issue Form。作者先提交：

- 中英文名称、tagline 和说明
- 内容分类与视觉表达
- 原创或 Fan Art 权利轨道
- 来源、许可证与 AI 生成记录
- 一张不含隐私的预览

社区可以在提案下讨论，用 👍 表示兴趣。这里的票数只代表“想看到它完成”，不代表素材合法、安全或兼容。

准备进入 Registry 时，作者使用 `$create-codex-theme` 生成主题，通过 Pull Request 提交声明式数据和素材。CI 继续执行现有 Schema、路径白名单、PNG、哈希、对比度、版权字段和包完整性校验。主题包不能带 JavaScript、CSS、Shell 或其他可执行代码。

维护者随后在固定 Codex 版本中应用主题，保存实机截图和恢复证据。只有完成这一步的主题才进入 `Verified`。

这一阶段不需要数据库、OAuth、对象存储或新账单。Issue 和 PR 也保留了作者、讨论、审核与变更历史。

## 分类模型

Gallery 和 Theme Manager 使用三个互相独立的维度：

| 维度 | 当前值 | 作用 |
| --- | --- | --- |
| 馆藏 | 原创修仙、城市图鉴、角色致敬、名场面 | 表达内容主题 |
| 来源与授权 | Original、Fan Art | 解释再分发和使用边界 |
| 视觉表达 | Cinematic、Chibi、Cityscape、Scene | 帮用户按画面形式筛选 |

界面语言不是内容分类。所有正式主题继续提供中文和英文元数据；中文系统默认显示中文，其他系统语言默认显示英文。以后出现面向英语文化题材的馆藏时，应增加明确的内容地域字段，而不是把中文主题从英文界面中隐藏。

## 排行与精选

排行只能使用已经通过 Validator 和实机验证的主题。建议提供三个视图：

- `New`: 按进入 Verified 的时间排序
- `Popular`: 使用一段固定时间内的有效反应数，并加入时间衰减
- `Featured`: 由维护者根据视觉质量、可读性、原创性和适配稳定性选择

Popular 不应自动变成 Featured。高票主题仍可能有版权争议、刷票或对比度问题。

GitHub 原生阶段可以由定时 Action 读取提案反应数，生成不含用户身份的 `community-rankings.json`，再随 Pages 静态发布。工作流只读取公开统计，不把 GitHub Token 放进浏览器，也不会让每个访客消耗 API 配额。

在拥有足够真实投稿前，不需要实现这条定时排行。先观察提案数量、有效 PR 比例和维护成本。

## 第二阶段：网页投稿

当 GitHub Issue 对普通用户明显太难时，再做独立投稿页。它至少需要：

- GitHub OAuth 或其他受控登录
- 预签名上传，文件先进入隔离区
- 对象存储和数据库
- 文件大小、格式、病毒和路径穿越检查
- 速率限制、重复投票限制和滥用检测
- 审核队列、举报、下架与 DMCA 流程
- 审核通过后生成 PR，而不是直接写生产 Registry

这时可以选择 Supabase 或 Cloudflare Workers、D1 与 R2。具体平台应在真实投稿量和预算出现后再定。主题文件始终是隔离的声明式数据；网页服务没有权力让上传内容绕过 Validator。

## 不做的事

- 不允许匿名文件一上传就出现在公共 Gallery
- 不把点赞数当作版权或安全证明
- 不执行作者提供的脚本
- 不让外部 Registry 直接进入 Theme Manager
- 不公开投票者的个人资料或邮箱
- 不把 Fan Art 标成权利已验证

## 当前入口

- [提交主题提案](https://github.com/rwang23/awesome-codex-theme/issues/new?template=theme-proposal.yml)
- [贡献指南](../CONTRIBUTING.md)
- [主题包标准](standard.md)
- [Fan Art 政策](fan-art-policy.md)

## English summary

The community starts with a GitHub-native proposal and pull-request flow. Reactions measure interest, while validation, rights review, and real-app evidence decide whether a theme enters the Registry. Gallery and Theme Manager expose independent collection, rights, and visual-form facets, with UI language selected from the operating system. A hosted upload and voting backend should wait until real submission volume justifies authentication, quarantined storage, moderation, abuse controls, and operating cost.
