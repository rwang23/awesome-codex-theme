# Awesome Codex Theme

面向 Codex 的开放主题包标准、Registry、Validator 与主题 Gallery。

[在线浏览 28 套主题](https://rwang23.github.io/awesome-codex-theme/) · [English README](README.en.md) · [主题包标准](docs/standard.md) · [Fan Art 说明](docs/fan-art-policy.md) · [贡献指南](CONTRIBUTING.md)

![凡人·虚天殿主题源图](themes/source-art/mortal-void-hall.png)

## 这不是另一个“换背景”脚本

单纯注入 CSS 或替换背景，很容易做出一个能跑的 Demo，却很难回答几个长期问题：这张图能不能再分发，主题包里有没有代码，安装时如何确认文件没有被替换，同一套主题到了不同引擎究竟能还原多少。

Awesome Codex Theme 把这些问题放进同一套公开契约：

- `theme.json` 与 manifest Schema 统一描述身份、素材、明暗模式、来源和兼容范围
- 标准 `.act-theme` 包只允许声明式配置与图片，不含脚本或远程 CSS
- Registry 记录 SHA-256、文件大小、尺寸、版权声明和适配能力
- Validator 检查包内文件白名单、哈希、图片完整性与 WCAG 对比度
- Adapter 在可信主题包之外导出 Codex 原生、Dream Skin、HeiGe Skin Studio 和 CodeDrobe 格式
- GitHub Pages 提供预览、筛选、模式切换、下载和带哈希校验的安装命令

## 主题收藏

当前有 28 套主题、56 张真实明暗预览。Gallery 卡片直接读取生成器输出的 960×540 PNG，不使用概念占位图。

| 系列 | 内容 | 数量 |
| --- | --- | ---: |
| 原创国风修仙 01 | 4 个原创世界，每个世界有原画版和 Q 版 | 8 |
| 中国城市图鉴 01 | 北京、上海、深圳、广州、成都、杭州、重庆、南京 | 8 |
| 国漫角色致意 01 | 4 部作品的男女主原画版与 Q 版 | 8 |
| 国漫名场面 01 | 虚天殿、抢婚、雨巷告白、三年之约 | 4 |

所有源图都通过 OpenAI image job 生成，再由人工检查安全留白、文字、水印、Logo、人物身份和 16:9 裁切。仓库保存 prompt、模型、job ID 与输出哈希的精简 provenance，不保存密钥或带 base64 图片的原始服务响应。

前两个系列是第一方原创素材，采用 CC0 1.0。后两个系列是明确标注的非官方 AI 同人创作，涉及《凡人修仙传》《仙逆》《剑来》和《斗破苍穹》的角色与场景，只面向个人、非商业的粉丝使用。它们不使用官方截图、海报、Logo 或宣传素材，也不声称获得权利方授权或背书；底层作品和角色权利仍归各自权利人。完整边界见 [Fan Art 政策](docs/fan-art-policy.md)。

## 使用主题

最直接的入口是 [在线 Gallery](https://rwang23.github.io/awesome-codex-theme/)：

1. 选择系列或搜索主题。
2. 切换明亮、暗色预览。
3. 打开“安装 / 导出”。
4. 选择目标引擎。
5. Dream Skin 可以复制带完整性校验的安装命令。其他引擎下载适配包后手动导入。

浏览器本身不会直接写入 Codex。Codex 原生适配器目前只导出明暗外观偏好，不承诺背景图和自定义色板能够原生生效。详细能力见 [适配器说明](docs/adapters.md)。

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
- 主题生成、Registry、Validator 与浏览器验收

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

环境要求：Node.js 22 或更高版本。项目没有 npm 运行时或开发依赖。

```bash
npm run check
npm run serve
```

常用命令：

```bash
npm run art:generate          # 通过 image job 生成源图
npm run generate              # 导出主题、预览、Registry 与适配器包
npm run generate:check        # 检查生成产物是否漂移
npm run validate              # 校验主题包和 Registry
npm test                      # 运行仓库测试
npm run build                 # 构建 GitHub Pages
```

## 仓库结构

```text
.codex/skills/               项目级主题创作 Skill
schemas/                     主题包与 Registry JSON Schema
themes/catalog.json          人工维护的主题目录
themes/source-art/           image job 配置、源图与 provenance
themes/registry.json         自动生成的公共 Registry
scripts/                     生成器、校验器、构建和安装器
site/                        无依赖 Gallery
docs/                        标准、架构、适配器和设计说明
```

`themes/<id>/`、`packages/`、`themes/registry.json` 与 `dist/` 都由生成器维护。不要手工修改这些产物。

## 授权与 AI 披露

项目代码采用 MIT。第一方 AI 原创素材在可适用的权利范围内采用 CC0 1.0。非官方同人素材使用 `LicenseRef-ACT-Fan-Art-Notice`，明确标记 `rightsVerified: false`、禁止商业使用，并指向 [Fan Art 政策](docs/fan-art-policy.md)。每套主题都标记 `aiGenerated: true`，并保留可核对的 prompt 哈希和源图哈希。

AI 输出不等于版权许可，也不能消除角色、世界观和其他底层权利。贡献者仍然需要确认输入素材的权利，并检查输出是否包含未披露的第三方角色、Logo、签名或受保护表达。完整说明见 [NOTICE.md](NOTICE.md)。
