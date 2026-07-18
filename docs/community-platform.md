# 自定义域名与社区平台架构

状态：独立私有社区 Beta 已部署，临时入口为 <https://community.ecomstack.net/>；品牌域名以后再迁移。

## 已实施的 Beta

社区服务与这个开源 Theme Standard、Registry 和 Manager 仓库保持分离。当前实现使用 Next.js、PostgreSQL、Docker Compose、Caddy 和 Cloudflare，运行在已有 Oracle VPS 上，提供：

- 中英文界面与本地账号会话；
- 声明式 `.act-theme` 上传；
- ZIP 路径、manifest、PNG、大小与哈希校验；
- 隔离状态和维护者审核队列；
- 每个账号对每套主题一票；
- 官方 Registry 的只读主题发现。

社区审核与票数不会直接修改公共 Registry。主题仍须在开源仓库经过权利审查、Validator、CI 和真实 Codex 应用/恢复验证后，才能成为官方 Verified 主题。

## 域名能解决什么

购买域名很有价值，但它只解决品牌入口：

```text
www.example.com      Gallery 与项目首页
api.example.com      登录、投稿、投票和审核 API
assets.example.com   经过审核的主题素材
```

域名本身不会自动带来账号、数据库、上传、投票或审核。把域名绑定到一台服务器以后，仍然要建设和维护认证、数据、对象存储、防刷、日志、备份、隐私政策和下架流程。

静态 Gallery 本身不需要应用服务器，仍由 GitHub Pages 承载。社区 Beta 复用了已有 Oracle VPS 和 `ecomstack.net` 临时子域名，因此没有新增云主机采购；未来购买品牌域名时再迁移入口。

## 原始三阶段路线

### 阶段 1：品牌站点

- 购买一个简短、可读、没有商标冲突的域名；
- `www` 或 apex 指向现有 GitHub Pages；
- GitHub Issues 接收主题构想；
- Pull Request 接收通过 Validator 的主题包；
- reaction 只表示社区兴趣；
- 不接收匿名文件，不运行账号系统。

这一阶段只有域名年费，没有应用服务器。

### 阶段 2：受控投稿社区

当 GitHub Issue 对普通用户明显太难，而且每月已经出现稳定投稿时，再增加：

- GitHub 登录；
- 预签名上传；
- 隔离素材区；
- Theme Pack Schema 与图片检查；
- 审核队列；
- 每账号每主题一票；
- 举报、下架和 DMCA 流程；
- 审核通过后自动生成 Pull Request；
- `New`、`Popular` 与人工 `Featured` 三类排序。

上传文件永远不能直接进入公共 Registry。正确流程是：

```text
浏览器选择文件
      ↓
预签名上传到 quarantine/
      ↓
格式、大小、图片、哈希、病毒与权利字段检查
      ↓
人工审核
      ↓
生成 Pull Request
      ↓
CI Validator
      ↓
固定 Codex 版本实机验证
      ↓
发布到 verified/
```

### 阶段 3：完整社区

只有在真实用户量证明需要时，才增加：

- 作者主页与关注；
- 主题版本历史；
- 收藏与安装量；
- 个性化推荐；
- 维护者角色与审核 SLA；
- 多 Registry 或组织级发布者。

这些能力会明显提高运营、隐私和滥用处理成本，不应放进首版。

## 后端选择

以下价格与免费额度在 2026-07-18 核对，后续仍应以官方页面为准。

### 推荐：Cloudflare Workers + D1 + R2 + Turnstile

适合本项目的原因：

- Gallery 可以继续留在 GitHub Pages；
- Worker 只处理 API，不需要常驻服务器；
- D1 保存用户、主题、版本、投票和审核状态；
- R2 保存隔离上传与通过审核的素材；
- Turnstile 处理基础机器人防护；
- 可以从免费额度开始，空闲时没有固定服务器计算费。

当时的官方免费额度包括：

- D1 每天 500 万行读取、10 万行写入和 5 GB 存储；
- R2 每月 10 GB-month、100 万 Class A、1000 万 Class B，直接 egress 免费；
- Turnstile 免费方案可用于大多数生产应用。

推荐域名布局：

```text
www.<domain>       GitHub Pages Gallery
api.<domain>       Cloudflare Worker
assets.<domain>    R2 public verified assets
```

`quarantine/` 不设公共域名，只允许短时预签名写入和审核服务读取。

### 备选：Supabase

Supabase 更适合最快做出账号、Postgres、Storage 和管理后台。2026-07-18 的 Free 方案包含 50,000 MAU、500 MB 数据库、1 GB 文件存储和 500,000 Edge Function 调用；Free 项目闲置一周会暂停。Pro 从每月 25 美元起，Supabase 自身的 custom domain 另收每月 10 美元。

如果团队更重视后台管理速度，可以选 Supabase。若更重视低固定成本和与静态 Gallery 分离，优先选 Cloudflare。

### 当前实施：复用现有 Oracle VPS

本项目已经有成熟的 Oracle VPS、Docker、Caddy、Cloudflare 和部署工作流，因此首版选择复用现有平台。仍需持续负责：

- 系统更新和防火墙；
- 数据库升级与备份恢复；
- 对象存储或磁盘容量；
- TLS、日志和监控；
- DDoS 与上传滥用；
- 高可用和事故响应。

这个选择适合当前试验规模，不代表 VPS 对所有新项目都优于 serverless。上传始终留在隔离区，数据库只绑定容器网络，Web 服务只监听 `127.0.0.1:3500`，公网 TLS 与安全头由 Caddy 和 Cloudflare 处理。规模或滥用成本上升后，可以再把隔离素材迁移到 R2，把边缘防刷迁移到 Turnstile。

## 身份与权限

用户登录只需要公开身份时，可以使用 GitHub OAuth。不要申请仓库写权限或私有仓库权限。

如果后台需要自动创建 Pull Request，使用只安装到
`rwang23/awesome-codex-theme` 的专用 GitHub App，并只授予所需的单仓库权限。不要把维护者 PAT 放进浏览器，也不要让普通用户的 OAuth token 直接修改 Registry。

数据库最小模型：

```text
users
theme_submissions
theme_versions
assets
votes
moderation_actions
reports
```

`votes` 对 `(user_id, theme_submission_id)` 建唯一约束。Popular 使用固定窗口和时间衰减；Featured 始终由维护者决定，不能由票数自动升级。

## 原设计门槛与当前决定

原设计建议满足以下任一组合后再进入阶段 2：

- 连续两个月每月至少 20 个有效主题提案；
- 非开发者提交者明显因为 GitHub 流程放弃；
- 维护者每周花 4 小时以上整理附件和重复信息；
- 社区确实需要独立投票，而不是只有少量 reaction。

本次由项目所有者明确授权提前上线隔离 Beta，用真实使用验证流程，同时继续把主题质量、Mac 真机验证、安装器和首个 Release 放在主线。Beta 不会自动发布用户内容，也不会让社区服务获得公共仓库写权限。

## 接下来的动作

1. 观察真实注册、投稿、审核和投票行为，不开放自动发布。
2. 为数据库与隔离上传补充定期备份和恢复演练。
3. 上线举报、下架、隐私与 DMCA 页面后再扩大推广。
4. 继续使用现有 Issue Form 与 PR 作为官方 Registry 收录路线。
5. 确定无商标冲突的品牌域名后，把临时子域名平滑迁移过去。

购买新域名、接入第三方身份或给社区服务增加公共仓库写权限，仍然属于新的外部状态变更，需要单独评审。

## English summary

The community beta now runs separately from the open-source runtime repository at `community.ecomstack.net`. It uses Next.js, PostgreSQL, Docker Compose, Caddy, and Cloudflare on an existing Oracle VPS, with account sessions, quarantined code-free uploads, strict package validation, moderation, and one vote per account per theme. Community approval never writes directly to the official Registry; rights review, repository CI, and real-app evidence remain mandatory. A dedicated brand domain, stronger abuse controls, and backup drills are the next operating gates.
