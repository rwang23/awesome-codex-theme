# ACT 主题创作规范

## 主题的最小组成

每套主题需要：

- 一个唯一的 kebab-case ID
- 中文主文案与英文辅助文案
- 一个已有 collection
- `cinematic`、`chibi`、`cityscape` 或 `scene` variant
- 左右焦点、安全区和任务模式
- 符合对比度门槛的明暗 token
- 一张 1536×1024 已审查源图及 provenance

`cinematic-chibi` collection 要求同一 `pair` 同时有原画版和 Q 版。新增此类主题时准备两份 brief，并在运行完整校验前把两个 variant 都加入 catalog。`standalone` collection 可以一次加入一套。

生成后的 `.act-theme` 包只含 `manifest.json`、两张声明过的 Full Skin 背景和两份声明式 Codex Native 回退字符串。包内不能出现可执行脚本、CSS 或远程资源。所有主题共用的 CSS 与 CDP 逻辑属于经过审查的 Theme Manager，不属于主题作者。

## 权利轨道

原创是默认轨道，可以使用国风修仙、城市雨夜、太空幻想、Q 版角色等宽泛题材。不能要求模型复制：

- 已有角色的脸、发型、服装、武器或标志
- 动漫、游戏、电影的场景构图
- 具体画师、工作室或系列的可识别风格
- 城市 Logo、官方吉祥物、品牌招牌
- 未授权截图、海报、摄影或同人图

当用户只用作品名说明气质时，先提炼为抽象属性，例如“孤独的逆行感、冷蓝星空、克制红光”，再设计新的世界、角色和构图。

只有用户明确要求作品角色或场景时才使用 Fan Art 轨道。此时必须声明作品、角色、`unofficial: true`、`commercialUse: false` 和 `officialAssetsUsed: false`。素材不能是官方截图、海报、Logo、宣传图、模型文件或他人同人图；构图不能复刻具体镜头；prompt 不能模仿具体画师或工作室。Fan Art 使用 `LicenseRef-ACT-Fan-Art-Notice` 和 `rightsVerified: false`，不能标记为 CC0。

## 工作区构图

源图不是实机截图，但会生成 Full Skin 使用的 2560×1440 背景。Codex Native 回退仍然只改变配色。安全区要同时照顾左侧导航、主标题、建议卡片和底部 composer，不能只为了 Gallery 卡片好看。

- `safeArea: left` 时，左侧约 46% 保持低对比、低细节。
- 主体放在右侧三分之一，不能贴边。
- 重要内容放在垂直中间 82%，以适应 3:2 到 16:9 的裁切。
- 避免满屏人脸、强烈放射光、碎片和密集文字形状。
- Q 版角色要有完整剪影和可信材质，不能像随机贴纸。

## Full Skin 实机门槛

主题包通过静态校验后，还要在 `docs/native-testing.md` 指定的独立 Beta 中完成明暗两次应用。每次都要：

- 核对背景图 SHA-256、字节数和准确素材路径；
- 读回主题 ID、模式、根节点、主区域和 composer 标记；
- 检查侧栏、标题、建议卡片、输入框和模型选择文字；
- 采集隐私安全的 1440×810 截图；
- 移除当前样式与预加载脚本，并确认运行时标记消失。

没有这组证据时，Gallery 只能展示生成预览，不能标成 Beta 实机截图。

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

第一方 image job 源图需要保存 prompt 哈希、输出哈希、模型、尺寸、job ID 和权利轨道。仓库发布时只保留精简 provenance，不能提交 API key、代理地址、完整服务响应或包含 base64 图片的原始 job JSON。

外部贡献者必须说明素材作者、原始链接、许可证、修改方式与再分发范围。无法验证时，不进入 Registry。
