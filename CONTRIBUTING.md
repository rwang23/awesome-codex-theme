# 贡献主题

提交主题前，请确认你有权再分发每一份输入素材，也愿意让 Registry 公开记录来源、许可证和 AI 使用情况。

推荐直接使用仓库内的 `$create-codex-theme` Skill：

```text
.codex/skills/create-codex-theme/
```

## 素材边界

可以提交原创作品、CC0 或公有领域素材，以及许可证明确允许修改和再分发的作品。

不要提交：

- 名人肖像或未经同意的真实人物仿制
- 受保护角色、服装、武器、Logo 或截图
- 模仿具体在世画师、工作室、动漫、游戏或电影的生成图
- 城市官方吉祥物、品牌招牌或旅游照片复刻
- 无法核对作者、链接与再分发许可的素材

使用 AI 生成不等于自动获得版权许可。贡献者仍然要对输入权利和输出审查负责。

## 主题要求

- 一张 1536×1024 PNG 原创源图，文件不超过 16 MB
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

Submit only artwork you can legally redistribute. Every theme needs reviewed source art, bilingual copy, light and dark tokens, explicit provenance, and a code-free canonical package. Do not submit protected characters, celebrity likenesses, screenshots, logos, exact landmarks, or generated images that imitate a named artist, studio, or franchise. Run `npm run check` and complete the browser review before opening a contribution.
