# 自定义域名与社区平台架构

状态：可执行方案，尚未购买域名或部署后端。

## 域名能解决什么

购买域名很有价值，但它只解决品牌入口：

```text
www.example.com      Gallery 与项目首页
api.example.com      登录、投稿、投票和审核 API
assets.example.com   经过审核的主题素材
```

域名本身不会自动带来账号、数据库、上传、投票或审核。把域名绑定到一台服务器以后，仍然要建设和维护认证、数据、对象存储、防刷、日志、备份、隐私政策和下架流程。

第一阶段不需要购买云服务器。GitHub Pages 官方支持自定义域名，公共仓库可以继续免费托管静态 Gallery。建议同时配置 apex 与 `www`，把 `www` 作为稳定主入口。

## 推荐的三阶段路线

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

### 暂不推荐：自管 VPS

VPS 看起来最自由，但首版要自行负责：

- 系统更新和防火墙；
- 数据库升级与备份恢复；
- 对象存储或磁盘容量；
- TLS、日志和监控；
- DDoS 与上传滥用；
- 高可用和事故响应。

这些工作不会让 Gallery 更好看，也不会让主题更安全。除非已经有成熟运维体系或平台能力超过 serverless 边界，否则不需要。

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

## 上线门槛

满足以下任一组合后再进入阶段 2：

- 连续两个月每月至少 20 个有效主题提案；
- 非开发者提交者明显因为 GitHub 流程放弃；
- 维护者每周花 4 小时以上整理附件和重复信息；
- 社区确实需要独立投票，而不是只有少量 reaction。

在此之前，优先把时间投入主题质量、Mac 真机验证、安装器和首个 Release。

## 现在可以执行的动作

1. 先确定 3 到 5 个域名候选并检查商标与可用性。
2. 购买后只把它绑定到 GitHub Pages。
3. 在仓库开启域名验证和 HTTPS。
4. 继续用现有 Issue Form 与 PR 流程收集真实需求。
5. 达到阶段 2 门槛后，再创建 Cloudflare 项目、GitHub OAuth/App 和隐私政策。

购买域名、配置 DNS、创建云账号或部署服务都属于外部状态变更，需要在候选域名和账号归属确定后单独执行。

## English summary

A custom domain is useful branding, but it is not a community backend. Start by mapping a branded domain to the existing GitHub Pages Gallery. Keep proposals and validated theme packs in GitHub until real submission volume justifies accounts and uploads. The recommended second-stage stack is Cloudflare Workers, D1, R2, Turnstile, GitHub login, quarantined uploads, moderation, and PR-based publication. Supabase is the faster managed alternative; a self-managed VPS is unnecessary for the first community release.
