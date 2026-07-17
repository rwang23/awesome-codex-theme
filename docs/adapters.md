# Codex Native compatibility

Awesome Codex Theme 只导出 Codex Native 格式，不再兼容第三方皮肤引擎。

## 当前契约

每个明亮或暗色模式都会生成一段以 `codex-theme-v1:` 开头的主题字符串。其声明式 payload 包含：

- `variant`: `light` 或 `dark`
- `codeThemeId`: 当前使用 `codex`
- `accent`、`surface` 与 `ink`
- 0 到 100 的对比度
- UI 与代码字体选择
- diff added、diff removed 与 skill 三类语义色
- 窗口透明度偏好

导入入口是 Codex 的“设置 > 外观”。先选择对应的明亮或暗色主题，再点“导入”并粘贴字符串。Gallery 也提供同内容的 `.codex-theme.txt` 下载。

当前导出格式已按 Codex 桌面版 `26.715.2305.0` 校验。应用版本变化后，需要重新确认导入 Schema，不能把旧版本验证自动延伸到新版本。

## 明确不支持

Codex Native v1 不接受背景图片。仓库中的国风、城市与 Fan Art 插画只用于 Gallery 封面和创作归档，不会成为 Codex 应用背景，也不能当作实机截图。

项目不做以下事情：

- 不注入 CSS 或 JavaScript
- 不修改 Codex 安装目录或应用文件
- 不导出 Dream Skin、HeiGe Skin Studio 或 CodeDrobe 格式
- 不从网页自动写入用户设置

## 包与 Registry

标准 `.act-theme` 包仍然是纯声明归档。它包含 manifest、两张已声明封面和两份 Native 主题字符串，不含可执行代码或远程资源。Registry 记录每份 Native 字符串的路径、SHA-256、字节数、格式和已测试 Codex 版本。

真实应用截图的证据要求见 [native-testing.md](native-testing.md)。

## English summary

Awesome Codex Theme exports Codex Native only. Each light or dark mode provides a declarative `codex-theme-v1:` string for Settings > Appearance > Import. The contract supports colors, contrast, fonts, the built-in code theme, and semantic colors. It does not support background images. Gallery illustrations are cover art, not Codex screenshots.
