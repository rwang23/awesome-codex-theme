# Awesome Codex Theme

面向 Codex Native 的开放主题包标准、Registry、Validator 与主题 Gallery。

[在线浏览 28 套主题](https://rwang23.github.io/awesome-codex-theme/) · [English README](README.en.md) · [主题包标准](docs/standard.md) · [Fan Art 说明](docs/fan-art-policy.md) · [贡献指南](CONTRIBUTING.md)

![Awesome Codex Theme 桌面管理器 Windows 实机界面，画面中展示 ChatGPT Beta 真实主题截图](docs/assets/theme-manager-windows.png)

上图是 Tauri 2 Theme Manager 的 Windows 实机界面，主题预览来自独立 ChatGPT Beta `26.707.3351.0` 测试台，不是概念图，也不是把源插画贴进应用外壳。

## 这不是另一个“换背景”脚本

单纯注入 CSS 或替换背景，很容易做出一个能跑的 Demo，却很难回答几个长期问题：这张图能不能再分发，主题包里有没有代码，导入时如何确认文件没有被替换，以及当前版本的 Codex 到底能原生接收哪些主题字段。

Awesome Codex Theme 把这些问题放进同一套公开契约：

- `theme.json` 与 manifest Schema 统一描述身份、素材、明暗模式、来源和兼容范围
- 标准 `.act-theme` 包只允许声明式配置与图片，不含脚本或远程 CSS
- Registry 记录 SHA-256、文件大小、尺寸、版权声明和 Native 契约版本
- Validator 检查包内文件白名单、哈希、图片完整性、WCAG 对比度与 Native 配色去重
- 每个模式都导出 Codex 桌面版可直接导入的 `codex-theme-v1:` 字符串
- GitHub Pages 与跨平台 Theme Manager 都直接展示真实 Beta 截图，并提供筛选、复制与下载

项目只兼容 Codex Native，不再导出 Dream Skin、HeiGe Skin Studio 或 CodeDrobe 格式，也不注入 CSS。Codex 的原生主题契约支持配色、对比度、字体、代码主题和语义色，但不支持背景图片。仓库插画因此只作为“馆藏封面”，不会被写入应用背景；Gallery 展示的应用画面来自独立的 Beta 实机采集。

## 主题收藏

当前有 28 套主题、56 份不重复的明暗 Native 配色、56 张由源图确定性生成的明暗封面，以及 56 张从独立 ChatGPT Beta `26.707.3351.0` 逐套导入后采集的 1440×810 实机截图。Gallery 默认展示实机截图，封面继续作为创作档案和回退素材，不再用插画冒充应用画面。每张截图都绑定 Native 哈希、应用读回哈希、准确包版本、固定窗口与基线恢复证据。采集规范见 [Codex Native 测试与截图](docs/native-testing.md)。

| 系列 | 内容 | 数量 |
| --- | --- | ---: |
| 原创国风修仙 01 | 4 个原创世界，每个世界有原画版和 Q 版 | 8 |
| 中国城市图鉴 01 | 北京、上海、深圳、广州、成都、杭州、重庆、南京 | 8 |
| 国漫角色致意 01 | 4 部作品的男女主原画版与 Q 版 | 8 |
| 国漫名场面 01 | 虚天殿、抢婚、雨巷告白、三年之约 | 4 |

所有源图都通过 OpenAI image job 生成，再由人工检查安全留白、文字、水印、Logo、人物身份和 16:9 裁切。仓库保存 prompt、模型、job ID 与输出哈希的精简 provenance，不保存密钥或带 base64 图片的原始服务响应。

前两个系列是第一方原创素材，采用 CC0 1.0。后两个系列是明确标注的非官方 AI 同人创作，涉及《凡人修仙传》《仙逆》《剑来》和《斗破苍穹》的角色与场景，只面向个人、非商业的粉丝使用。它们不使用官方截图、海报、Logo 或宣传素材，也不声称获得权利方授权或背书；底层作品和角色权利仍归各自权利人。完整边界见 [Fan Art 政策](docs/fan-art-policy.md)。

## 使用主题

最直接的入口是 [在线 Gallery](https://rwang23.github.io/awesome-codex-theme/)。需要持续同步主题时，使用 Tauri Theme Manager；首个签名 Release 发布前，也可以从源码构建。暂时不安装桌面应用时，Gallery 仍提供 Windows 便携助手。

1. 选择系列或搜索主题。
2. 切换明亮、暗色实机截图。
3. 打开“在 Codex 中使用”。
4. 在 Theme Manager 中选择主题、模式和已检测到的 Stable 或 Beta。
5. 管理器会校验目录、复制主题字符串并打开准确的应用版本。
6. 在 ChatGPT 的“设置 > 外观”中选择对应的明亮或暗色主题，点“导入”并粘贴。

也可以直接从 Gallery 复制 `codex-theme-v1:` 字符串并手动导入。Windows 便携助手仍然保留：下载后解压，双击 `Launch ACT Installer.cmd` 即可。

两种工具都不修改 WindowsApps、应用文件、ChatGPT 私有数据或会话，也不会自动点击最后的“导入”。设置变更始终由用户在 ChatGPT 中确认。标准 `.act-theme` 仍然只包含声明式配置与素材，不含脚本、CSS 或远程资源。当前契约和能力边界见 [Codex Native 兼容说明](docs/adapters.md)。

## 桌面管理器与更新

Theme Manager 把两类更新分开处理：

- 主题目录更新：每次启动从 GitHub Pages 读取 `downloads/catalog.json`，校验 Registry 的 SHA-256、字节数、Schema 和 Native 主题结构；失败时继续使用上次验证通过的缓存或内置目录。
- 应用自身更新：配置发布签名后的打包版会检查 GitHub Releases；下载完成后，由用户决定何时重启安装。没有发布公钥的开发构建不会假装更新通道已经可用。

Windows 与 macOS 共用 Tauri 2、原生 HTML/CSS/JavaScript 和 Rust 安装核心，不再随应用打包 Chromium。当前 Windows NSIS 安装包为 3.66 MiB；同一界面的 Electron 候选包为 97.45 MiB，Tauri 版本缩小约 96.2%。Windows 已完成本机运行、复制链路和打包验证；macOS 的双架构 CI 路径已经提供，但正式更新必须先完成 Apple Developer 签名、公证和真机读回。项目不会把未签名产物冒充正式发行版。设计、安全边界和发布方式见 [桌面主题管理器](docs/desktop-manager.md)。

## 用 Codex 创建新主题

仓库内置项目级 Skill：

```text
.codex/skills/create-codex-theme/
```

用 Codex 打开本仓库后，可以直接说：

```text
使用 $create-codex-theme，为中国城市图鉴创建一套“苏州·运河晨雾”主题。
要求左侧保留工作区安全区，提供明暗模式，并在完成后运行全部校验。
```

Skill 会协助完成：

- 中文主文案与英文辅助文案
- 原创主题与明确披露 Fan Art 的双轨素材检查
- image job prompt 与源图审查
- 明暗 token 与对比度门槛
- `catalog.json` 和 image job 脚手架
- Codex Native 字符串、Registry、Validator 与浏览器验收

原创主题可以复制 [theme brief 模板](.codex/skills/create-codex-theme/assets/theme-brief.template.json)；明确的非官方同人主题使用 [fan-art brief 模板](.codex/skills/create-codex-theme/assets/fan-art-theme-brief.template.json)。然后运行：

```bash
node .codex/skills/create-codex-theme/scripts/scaffold-theme.mjs \
  --brief path/to/theme-brief.json
```

dry run 没问题后加上 `--apply`。接着生成源图：

```bash
npm run art:generate -- --ids=<theme-id>
npm run check
```

## 本地开发

环境要求：Node.js 22 或更高版本。桌面开发还需要 Rust stable；Windows 需要 Microsoft C++ Build Tools，macOS 构建需要 Xcode Command Line Tools。Gallery、Registry 和 Validator 没有 npm 依赖；Tauri CLI 只存在于 `apps/theme-manager`，不会把桌面依赖带进 Pages。

```bash
npm run check
npm run serve
```

常用命令：

```bash
npm run art:generate          # 通过 image job 生成源图
npm run generate              # 导出主题、封面、Registry 与 Native 字符串
npm run generate:check        # 检查生成产物是否漂移
npm run validate              # 校验主题包和 Registry
npm run installer:build       # 构建 Windows 安装助手 ZIP
npm run installer:validate    # 无界面校验安装助手与内置 Registry
npm run screenshots:probe     # 只读核对已启动的固定 Beta 测试台
npm run desktop:test          # 校验 Rust 目录、Native 边界与更新状态
npm run desktop:check         # Rust 格式检查与完整桌面测试
npm run desktop:start         # 启动 Tauri Theme Manager
npm run desktop:build:win     # 构建 Windows NSIS 安装包
npm run desktop:build:mac     # 在 macOS 构建 DMG
npm test                      # 运行仓库测试
npm run build                 # 构建 GitHub Pages
```

## 仓库结构

```text
.codex/skills/               项目级主题创作 Skill
apps/theme-manager/           Windows / macOS Tauri 2 Theme Manager
schemas/                     主题包与 Registry JSON Schema
themes/catalog.json          人工维护的主题目录
themes/source-art/           image job 配置、源图与 provenance
themes/registry.json         自动生成的公共 Registry
scripts/                     生成器、校验器与站点构建
installer/windows/           Windows 安装助手源文件与中英双语文案
screenshots/                 固定 Beta 版本的实机截图与完整性清单
site/                        无依赖 Gallery
docs/                        标准、架构、Native 兼容与测试说明
```

`themes/<id>/`、`packages/`、`themes/registry.json` 与 `dist/` 都由生成器维护。不要手工修改这些产物。

## 授权与 AI 披露

项目代码采用 MIT。第一方 AI 原创素材在可适用的权利范围内采用 CC0 1.0。非官方同人素材使用 `LicenseRef-ACT-Fan-Art-Notice`，明确标记 `rightsVerified: false`、禁止商业使用，并指向 [Fan Art 政策](docs/fan-art-policy.md)。每套主题都标记 `aiGenerated: true`，并保留可核对的 prompt 哈希和源图哈希。

AI 输出不等于版权许可，也不能消除角色、世界观和其他底层权利。贡献者仍然需要确认输入素材的权利，并检查输出是否包含未披露的第三方角色、Logo、签名或受保护表达。完整说明见 [NOTICE.md](NOTICE.md)。
