# 主题常驻、城市图鉴、社区与桌面 Beta 交付报告

日期：2026-07-18

## 交付结果

本轮把 Awesome Codex Theme 从“主题展示库”推进成了四个相互独立、又能闭环工作的部分：

1. 公开仓库继续维护声明式主题标准、Registry、Validator、Gallery 和开源
   Theme Manager。
2. Windows Theme Manager 增加用户主动开启、随时可关闭的“始终应用”控制器。
3. 八套中国城市主题全部重制，并在准确 ChatGPT Beta 中重新完成 16 张明暗实机截图。
4. 投稿、审核和投票社区拆到独立私有仓库，并部署在 Oracle VPS。

## 主题常驻边界

Windows 常驻不是把皮肤写进 ChatGPT。它保存当前用户选择，并注册一个当前用户级
控制器。用户以后正常打开已验证的 ChatGPT 版本时，控制器可以按有限重试流程只
重开这个准确目标，再用回环端口重放 Full Skin。

已验证：

- 准确目标、版本列车和端口所有者检查；
- 状态文件原子写入与跨进程锁；
- 三次重试上限；
- “始终应用 → 普通启动 Beta → 受控重开 → 页面标记读回”；
- 点击“恢复原生”后注销 autostart、移除运行时并清空固定端口；
- 未修改 WindowsApps、`app.asar`、ChatGPT 文件、快捷方式、聊天或私有数据；
- 用户正在运行的 Stable 通道没有被触碰。

实机闭环使用 ChatGPT Beta `26.715.3651.0`。未知版本保持原生。macOS 已有同一套
源码路径和 CI 构建，但在 Apple Silicon 真机完成应用、恢复、常驻和 Gatekeeper
读回前，不能把 Mac 常驻描述成已验证。

## 城市图鉴重制

北京、上海、深圳、广州、成都、杭州、重庆和南京全部改用城市专属的地形、街区、
水系或生活线索，减少通用赛博城市和“只靠一个地标认城市”的问题。

每张图都保存：

- `gpt-image-2` job id；
- 完整提示词与提示词 SHA-256；
- 输出图片 SHA-256；
- 生成时间、尺寸、模型和来源声明；
- 对应的明暗主题包与真实应用截图。

Validator 最终读回 28 张源图、28 套主题、56 个模式、28 个无代码主题包、
56 条 Full Skin 记录、56 个 Native 回退和 56 张真实 Beta 截图。

## 独立社区

社区使用私有仓库 `rwang23/codex-theme-community`，没有与公开标准仓库混在一起。
当前实现包括：

- 中英文账号与会话；
- 官方 Registry 浏览；
- 声明式 `.act-theme` 上传；
- ZIP 路径、manifest、PNG、尺寸、哈希和代码文件检查；
- quarantine 审核队列；
- 维护者审核；
- 每个账号对每套主题一票；
- 搜索、分类、明暗模式和移动端布局。

Oracle 上的 Compose 项目位于 `/opt/codex-theme-community`，Web 只监听
`127.0.0.1:3500`，由 Caddy 反向代理并经过 Cloudflare：

- 线上地址：<https://community.ecomstack.net/>
- 健康检查：<https://community.ecomstack.net/api/health>
- 社区 CI：GitHub Actions run `29641100770`
- 社区部署：GitHub Actions run `29641133636`

线上主页和健康接口均返回 HTTP 200。社区票数只影响社区排序，任何主题进入公开
Registry 仍要经过公开仓库 Review、Validator、CI 和真实应用证据。

## Gallery 与公开仓库

Gallery 和 Theme Manager 现在使用馆藏、素材权利与视觉形式三组独立筛选，
中英文搜索互通。系统语言决定默认界面，用户可以手动切换并记住选择。

已完成：

- 城市分类准确返回 8 套主题；
- 搜索“杭州”准确返回 `hangzhou-lake-letter`；
- 卡片展示准确 Beta 版本和真实截图证据；
- 桌面与 390×844 移动端检查；
- 社区链接指向独立站点；
- 浏览器控制台和页面错误均为零；
- GitHub Pages run `29643186452` 和最终修正 run `29645267564` 均成功；
- 线上 Gallery、脚本和社区链接读回 HTTP 200。

公开功能 commit 为 `bc0c459d08788a2ba5d58490195f5bd88f533ab3`。

## 桌面发布与信任

Updater 密钥不需要开发者账号。私钥和 DPAPI 加密密码保存在仓库外的当前用户受限
目录，GitHub Actions 只保存两个 Secret；仓库只保存公钥。GitHub 公钥变量、本地
备份和 Tauri 配置已经完成同源哈希读回。

Windows 本地 release 预检已生成 NSIS 和 444-byte Tauri `.sig`。macOS bundle
使用 ad-hoc 签名，并在 CI 中验证 DMG、Bundle ID、CPU 架构、
`codesign --verify` 和 `Signature=adhoc`。

第一次 draft 检查发现工作流只要求 `dmg` target，因此 `latest.json` 只有 Windows
平台。这个 draft 从未公开，已连同临时 tag 删除。工作流随后改为同时构建
`app,dmg`，并增加 `.app.tar.gz` 与 `.sig` 的强制检查，再从新 commit 重新发布。

这两类签名解决的是更新来源和包内完整性，不等于 Windows Authenticode、Apple
Developer ID 或公证。首个 Beta 仍可能出现 SmartScreen 或 Gatekeeper 提示。

### 首个公开 Beta

- Release：<https://github.com/rwang23/awesome-codex-theme/releases/tag/v0.3.0-alpha.1>
- Tag：`v0.3.0-alpha.1`
- Commit：`30044ed15128d786861c2bf9013511911c56af73`
- 发布工作流：GitHub Actions run `29646244505`，全部四个 job 成功
- 发布状态：非 draft、非 prerelease，发布时间 `2026-07-18T14:08:19Z`

最终 Release 包含 9 个资产：

| 资产 | Bytes | SHA-256 |
| --- | ---: | --- |
| `Awesome.Codex.Theme_0.3.0-alpha.1_aarch64.app.tar.gz` | 20,247,573 | `d6b7fe9b8d97a92bbe0b92ccb4c4b06679d8a8344c5b6b4e21b0dc4e1c7f8be6` |
| `Awesome.Codex.Theme_0.3.0-alpha.1_aarch64.app.tar.gz.sig` | 420 | `a242c3f0eb5e0ca2f8d9dc000e6d27b039ab78b13c1fb476281ba6d74486a6ef` |
| `Awesome.Codex.Theme_0.3.0-alpha.1_aarch64.dmg` | 20,457,588 | `54d356bc5832c4854154135044c28b71fc9f5c9c4b50bddb2c23e20eb9d1f5b2` |
| `Awesome.Codex.Theme_0.3.0-alpha.1_x64-setup.exe` | 19,781,910 | `4238af4a8b6de2681b0668e441f459eaec70af0fc6686f89ad93b37b0d46a607` |
| `Awesome.Codex.Theme_0.3.0-alpha.1_x64-setup.exe.sig` | 444 | `5d662199055e17ea6839e2925998a504d0373f7d50f1d01bd4aef013c14fedc3` |
| `Awesome.Codex.Theme_0.3.0-alpha.1_x64.app.tar.gz` | 20,423,073 | `2a7710710f4c4a2071cd532c2fa034255c1d51f4367b356d6b9333c97435f71f` |
| `Awesome.Codex.Theme_0.3.0-alpha.1_x64.app.tar.gz.sig` | 420 | `3a6f567a8785349c056af691bbd552409d7b1ded23a7712bb9761fec3041b869` |
| `Awesome.Codex.Theme_0.3.0-alpha.1_x64.dmg` | 20,628,539 | `bb71b079369cb9aad0c1382777df19d5c970196c6b39bedb3f274753390d4d6b` |
| `latest.json` | 4,007 | `a2a734e3def92b7cf42b2b948a8044f23341cbc4ed1af0dee473d6fd0c242083` |

公开 `releases/latest/download/latest.json` 返回 HTTP 200，版本为
`0.3.0-alpha.1`，包含 `darwin-aarch64`、`darwin-x86_64` 和
`windows-x86_64`，以及对应的新安装器键。三个主要平台的下载 URL 均在未使用
GitHub Token 的请求中返回 HTTP 200，字节数与 Release 资产一致；三份 manifest
签名也与独立 `.sig` 文件逐字节一致。

macOS 两个更新归档均可正常展开为 `Awesome Codex Theme.app`，各含 72 个条目且
没有绝对路径或 `..` 路径。Windows 安装器具有有效 PE 头；按本轮明确边界，
Authenticode 状态为 `NotSigned`。

## 本地校验

- `npm run check`：通过；
- Node：14 项通过；
- Rust：8 项通过；
- Pages 构建：28 套主题、308 个下载产物；
- `workflow-lint.ps1`：无问题；
- staged secret pattern scan：0 命中；
- Windows updater-signed NSIS 本地预检：通过。

## 仍需后续补齐

- Apple Silicon 真机上的 Full Skin、恢复、常驻、语言和 Gatekeeper 闭环；
- Windows Authenticode；
- Apple Developer ID 与 notarization；
- 社区正式域名、邮件找回、对象存储和更完整的审核运营工具。

这些边界不会阻止公开 Beta，但必须继续在 README、Release Notes 和安装流程中明确
披露。
