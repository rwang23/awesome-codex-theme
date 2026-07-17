Awesome Codex Theme 安装助手

使用方法

1. 双击 “Launch ACT Installer.cmd”。
2. 选择主题、明暗模式和要打开的 ChatGPT 版本。
3. 点“复制并打开 ChatGPT”。
4. 在 ChatGPT 中按 Ctrl+,，进入“外观”，在对应模式下点“导入”。
5. 粘贴主题字符串并确认。

安全边界

安装助手读取随压缩包附带的 Registry，并校验每一份 codex-theme-v1
字符串的字段、模式、字节数和 SHA-256。它不会改 WindowsApps、app.asar、
ChatGPT 数据目录或任何对话。主题包仍然只有声明式配置和素材，不含脚本。

Codex Native 目前没有公开的无人值守安装接口，所以最后一次“导入”必须由你
在 ChatGPT 内确认。Gallery 插画是馆藏封面，不会成为 ChatGPT 背景。

安装助手不需要管理员权限。启动器中的 ExecutionPolicy Bypass 只作用于这一次
用户主动打开的 PowerShell 进程，不会修改系统或企业策略。

English

1. Run “Launch ACT Installer.cmd”.
2. Choose a theme, a mode, and the ChatGPT build to open.
3. Select “Copy and open ChatGPT”.
4. In ChatGPT, press Ctrl+, and open Appearance.
5. Choose Import for the matching Light or Dark theme, paste, and confirm.

The helper validates the bundled Registry and copies a declarative
codex-theme-v1 string. It never edits the ChatGPT package, private app data, or
conversation history. Codex Native does not expose an unattended install API,
so the final import remains an explicit action inside ChatGPT.
