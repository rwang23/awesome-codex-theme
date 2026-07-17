# ACT 主题创作规范

## 主题的最小组成

每套主题需要：

- 一个唯一的 kebab-case ID
- 中文主文案与英文辅助文案
- 一个已有 collection
- `cinematic`、`chibi` 或 `cityscape` variant
- 左右焦点、安全区和任务模式
- 符合对比度门槛的明暗 token
- 一张 1536×1024 原创源图及 provenance

`cinematic-chibi` collection 要求同一 `pair` 同时有原画版和 Q 版。新增此类主题时准备两份 brief，并在运行完整校验前把两个 variant 都加入 catalog。`standalone` collection 可以一次加入一套。

生成后的 `.act-theme` 包只含 `manifest.json` 与两张声明过的背景图。可执行脚本和引擎 CSS 只能放在包外的 adapter bundle。

## 原创性边界

可以使用宽泛题材，例如国风修仙、城市雨夜、太空幻想、Q 版角色。不能要求模型复制：

- 已有角色的脸、发型、服装、武器或标志
- 动漫、游戏、电影的场景构图
- 具体画师、工作室或系列的可识别风格
- 城市 Logo、官方吉祥物、品牌招牌
- 未授权截图、海报、摄影或同人图

当用户用作品名说明气质时，先提炼为抽象属性，例如“孤独的逆行感、冷蓝星空、克制红光”，再设计新的世界、角色和构图。

## 工作区构图

源图不是海报。它需要给 Codex 控件留位置。

- `safeArea: left` 时，左侧约 46% 保持低对比、低细节。
- 主体放在右侧三分之一，不能贴边。
- 重要内容放在垂直中间 82%，以适应 3:2 到 16:9 的裁切。
- 避免满屏人脸、强烈放射光、碎片和密集文字形状。
- Q 版角色要有完整剪影和可信材质，不能像随机贴纸。

## token 门槛

每个模式都需要：

`background`、`surface`、`surfaceAlt`、`text`、`muted`、`accent`、`accentContrast`、`border`

校验器要求：

- text/surface ≥ 4.5
- muted/surface ≥ 4.5
- accent/background ≥ 3.0
- accentContrast/accent ≥ 4.5

不要只看色卡。把预览放进 Gallery 和安装弹窗后再判断。

## 来源与授权

第一方 image job 源图需要保存 prompt 哈希、输出哈希、模型、尺寸和 job ID。仓库发布时只保留精简 provenance，不能提交 API key、代理地址、完整服务响应或包含 base64 图片的原始 job JSON。

外部贡献者必须说明素材作者、原始链接、许可证、修改方式与再分发范围。无法验证时，不进入 Registry。
