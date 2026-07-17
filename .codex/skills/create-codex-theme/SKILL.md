---
name: create-codex-theme
description: 为 Awesome Codex Theme 创建、补全或校验原创主题或明确披露的非官方 Fan Art。适用于把一句视觉想法变成双语 theme brief、用 OpenAI image job 生成安全留白的源图、写入 themes/catalog.json 与 source-art/jobs.json、导出明暗模式并运行 ACT Registry 校验。Use when a user asks to create, adapt, package, validate, or contribute a Codex theme in this repository.
---

# 创建 Codex 主题

把一个视觉想法交付成可审核的 ACT 主题包。结果必须包含已审查源图、中文和英文名称、明暗两套 token、权利轨道、来源记录，以及通过校验的声明式包。

## 先判断任务类型

- 新主题：从 brief 开始，完成源图、catalog、生成与验证。默认使用原创轨道。
- 明确的 Fan Art：只有用户点名现成作品或角色时才使用同人轨道，并完整披露作品、角色、非官方与非商业边界。
- 改现有主题：先读原 theme、源图 job 和 provenance，只改用户点名的部分。
- 外部图片适配：先确认用户有再分发权，再决定能否进入 Registry。
- 仅做概念稿：可以停在 brief 和预览图，不要把未审查素材写进 catalog。

如果用户只是用作品名描述气质，仍然改成原创世界与原创角色。如果用户明确要求该作品的角色或场景，可以走 Fan Art 轨道，但不能使用官方素材、复制镜头或模仿具体画师和工作室。艺人、真实人物和未经授权的品牌素材不进入 Fan Art 轨道。详细规则见 [references/theme-authoring.md](references/theme-authoring.md)。

## 创建流程

### 1. 读项目约束

先读仓库根目录的 `AGENTS.md`、`docs/agent-brief.md` 和 `themes/catalog.json`。确认 collection、pair、variant 和当前主题数量，不要凭空发明不兼容字段。

### 2. 写 theme brief

原创主题复制 [assets/theme-brief.template.json](assets/theme-brief.template.json)。明确的非官方同人主题复制 [assets/fan-art-theme-brief.template.json](assets/fan-art-theme-brief.template.json)。填写：

- 稳定的 kebab-case `id`
- 中文主名称与英文辅助名称
- 一句话场景 brief
- `original` 或 `fan-art` 权利轨道与相应声明
- 左侧或右侧安全留白
- 明暗模式 token

中文文案先写，英文随后补齐。描述具体画面，不使用“震撼”“极致”“重新定义”等宣传套话。

### 3. 脚手架预检

先运行 dry run：

```bash
node .codex/skills/create-codex-theme/scripts/scaffold-theme.mjs \
  --brief path/to/theme-brief.json
```

确认输出的 theme 与 image job 摘要无误后，再写入：

```bash
node .codex/skills/create-codex-theme/scripts/scaffold-theme.mjs \
  --brief path/to/theme-brief.json \
  --apply
```

脚本只改 `themes/catalog.json` 和 `themes/source-art/jobs.json`，不会生成图片，也不会发布。

### 4. 生成并审查源图

使用仓库的 image job 流程：

```bash
npm run art:generate -- --ids=<theme-id>
```

打开 `themes/source-art/<theme-id>.png` 做人工检查。必须确认：

- 安全区没有人物、建筑、强光或高频纹理
- 画面没有文字、签名、水印、Logo 或 UI
- 原创轨道的人物和物件不像现成 IP；Fan Art 只出现 brief 已声明的角色
- Fan Art 没有复制官方截图、海报、镜头、Logo 或宣传素材
- 16:9 中心裁切不会截断主体
- 图片达到主题 Gallery 的完成度

任何一项不合格，就改 job prompt 后重跑 `--force`。具体命令和检查顺序见 [references/image-job-playbook.md](references/image-job-playbook.md)。

### 5. 生成主题包

```bash
npm run generate
npm run validate
npm test
npm run build
```

生成器会把一张审查过的源图稳定导出为 2560×1440 明暗背景、960×540 预览、`.act-theme` 包和各引擎适配包。

### 6. 看真实页面

运行 `npm run serve`，在浏览器里检查：

- 新卡片能被 collection、风格和搜索筛选找到
- 明暗按钮确实切换两张预览
- 安装弹窗显示正确主题、模式和适配器
- 中文是默认语言，英文切换后没有缺失
- 360px 和桌面宽度都没有横向溢出

构建成功不能替代页面检查。

## 交付标准

只有在以下条件都满足后，才可以说主题完成：

- source art 与 provenance 文件存在
- `npm run check` 通过
- 人工视觉审查通过
- 浏览器交互通过
- diff 中没有第三方图片、秘密或生成服务的完整响应
- Fan Art 使用自定义 notice、`rightsVerified: false` 和公开政策链接，不得标记 CC0
- 未经用户明确授权，不 push、不发布 Pages
