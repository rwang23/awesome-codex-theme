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

当前导出格式已在 Stable `26.715.2305.0` 和 Beta `26.707.3351.0` 的“设置 > 外观”中校验。应用版本变化后，需要重新确认导入 Schema，不能把旧版本验证自动延伸到新版本。

## Windows 安装助手

Gallery 提供一个独立的 Windows 安装助手。它不是 Codex 插件，也不进入 `.act-theme`：

- 校验内置 Registry、主题字符串、SHA-256 和体积
- 识别准确的 Stable 或 Beta 包，而不是调用两者共用的 `codex://`
- 复制用户选择的主题字符串
- 通过已注册的 AUMID 打开用户选择的应用

安装助手不需要管理员权限，不修改 WindowsApps、应用文件、私有数据或会话。用户仍需在 ChatGPT 的“设置 > 外观”中点击“导入”，这是刻意保留的信任边界。

## 明确不支持

Codex Native v1 不接受背景图片。仓库中的国风、城市与 Fan Art 插画只用于 Gallery 封面和创作归档，不会成为 Codex 应用背景，也不能当作实机截图。

项目不做以下事情：

- 不注入 CSS 或 JavaScript
- 不修改 Codex 安装目录或应用文件
- 不导出 Dream Skin、HeiGe Skin Studio 或 CodeDrobe 格式
- 不从网页或安装助手自动写入用户设置

## 包与 Registry

标准 `.act-theme` 包仍然是纯声明归档。它包含 manifest、两张已声明封面和两份 Native 主题字符串，不含可执行代码或远程资源。Registry 记录每份 Native 字符串的路径、SHA-256、字节数、格式和已测试 Codex 版本。

真实应用截图的证据要求见 [native-testing.md](native-testing.md)。

当前 28 套主题的 56 个模式均已在独立 Beta `26.707.3351.0` 中完成导入、语义读回和实机截图。Registry 的 `capture` 字段将每张截图绑定到 Native 哈希、应用读回哈希、准确包身份、固定 fixture 和采集时间；Gallery 默认使用这些截图。

## English summary

Awesome Codex Theme exports Codex Native only. Each light or dark mode provides a declarative `codex-theme-v1:` string for Settings > Appearance > Import. The contract supports colors, contrast, fonts, the built-in code theme, and semantic colors. It does not support background images. Repository illustrations remain cover art; Gallery application views are separately verified Beta captures.
