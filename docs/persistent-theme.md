# “保持主题常驻”方案

状态：已完成架构决策，尚未作为用户功能发布。

这里的“常驻”不是把 CSS 永久写进 ChatGPT，也不是修改 `app.asar`。它表示用户明确打开一次开关后，Theme Manager 记住选择，并由一个当前用户级控制器在以后的 ChatGPT 启动中重新建立经过验证的 Full Skin 会话。

## 先说结论

可以做到接近“设置一次，以后一直使用”的体验，而且不需要管理员权限。推荐方案是：

```text
用户打开“保持主题常驻”
        ↓
保存声明式选择和一次性同意
        ↓
注册当前用户级后台控制器
        ↓
发现准确的 ChatGPT Stable/Beta 进程
        ↓
必要时安全重启为 loopback CDP 会话
        ↓
校验版本、进程、端口、页面和主题哈希
        ↓
应用主题并持续修复页面刷新
```

它是“持久选择 + 每次安全重放”，不是“永久修改应用”。

## 上游源码证据

本次调研固定在 2026-07-18，并记录了具体 commit。

### Codex Dream Skin

[`Fei-Away/Codex-Dream-Skin`](https://github.com/Fei-Away/Codex-Dream-Skin/tree/3af1d6d62f3a0388cc640d2f497ac3100998938e) 使用专用启动入口、托盘或菜单栏和会话 watcher。它明确不修改 `.app`、`app.asar` 或 WindowsApps。

macOS watcher 可以由 `launchctl submit` 独立托管，但官方 Codex 本身使用普通进程启动。源码还会主动移除旧版“退出后自动拉起 Codex”的 launchd job，避免用户关掉应用后又被强制重开。Windows 安装器创建专用启动快捷方式，而不是劫持系统里的原生 Codex 入口。

这套方法的优点是行为清楚，缺点是用户仍需从专用入口启动。

### HeiGe Codex Skin Studio

[`HeiGeAi/heige-codex-skin-studio`](https://github.com/HeiGeAi/heige-codex-skin-studio/tree/ac01c5109dbb0d4d6838d187a3137f5372298ba2) 更接近用户所说的“常驻”：

- 状态中保存 `persistenceEnabled` 和所选主题；
- macOS 使用当前用户的 LaunchAgent；
- Windows 使用当前用户登录触发的 Scheduled Task，权限级别为 Limited；
- 后台控制器发现一个普通、不带 CDP 的 Codex 进程后，将它受控重启为 loopback CDP 会话；
- 控制器设有重试预算，避免版本不兼容时无限重启；
- 关闭常驻后，本次会话可以继续保留主题，下次启动回到原生界面。

关键事实是：它也没有把主题永久写进应用。所谓常驻依然是后台控制器在每次启动时重建主题会话。

### CodeDrobe

[`CodeDrobe/skills`](https://github.com/CodeDrobe/skills/tree/7450ba041cbd1e84e256fb64a46ff746f186af6f) 同样把 apply、watch、verify 与 restore 交给一个统一 CDP runtime，并明确禁止修改应用 bundle、`app.asar` 或 WindowsApps。

三者共同说明，安全的跨平台路线是“受控启动与重放”，不是应用文件补丁。

## 本项目采用的产品语义

Theme Manager 提供三个清楚的状态：

| 状态 | 用户看到的行为 |
| --- | --- |
| 仅本次应用 | 当前 ChatGPT 会话使用主题，退出后回到原生 |
| 保持主题常驻 | 以后启动所选 Stable/Beta 时，控制器自动恢复主题 |
| 恢复原生 | 关闭常驻、移除当前注入、注销后台入口 |

开启常驻前必须显示一次明确说明：

1. 以后直接打开 ChatGPT 时，控制器可能需要立即正常退出并重启它一次；
2. 只处理用户选择的 Stable 或 Beta，不触碰另一个通道；
3. 不修改应用文件；
4. 遇到未验证版本时保持原生，不反复重启；
5. 可以随时一键关闭并恢复。

用户确认后，后续启动不应重复弹窗。

## 实现选择

项目已经使用 Tauri 2。代码阶段优先采用 Tauri 官方
[`autostart` plugin](https://v2.tauri.app/plugin/autostart/) 注册当前用户级启动入口，
而不是分别维护一套 PowerShell Scheduled Task 和一套手写 LaunchAgent。

后台控制器仍由 Rust 实现，负责：

- 保存和原子读取持久选择；
- 精确识别 Stable/Beta 包身份与版本；
- 检测普通进程与 CDP 进程；
- 在用户已经明确开启常驻时执行一次受控重启；
- 只连接 `127.0.0.1` 或 `::1`；
- 核对监听进程、可执行路径、版本和 `app://` target；
- 应用固定 runtime；
- 页面重载后重新验证；
- 失败后停止，而不是无限重启。

不把任意文件系统或进程权限暴露给 WebView。前端只调用：

```text
get_persistence_state
enable_persistence
disable_persistence
restore_native
```

## 状态与更新

持久状态放在 Theme Manager 自己的当前用户数据目录，至少记录：

```json
{
  "schemaVersion": 1,
  "enabled": true,
  "themeId": "beijing-meridian",
  "mode": "dark",
  "channel": "beta",
  "lastVerifiedAppVersion": "26.715.3651.0"
}
```

真实文件还要带 revision、transition nonce 和最后一次结果，用原子替换写入。它不保存聊天、账号、项目路径或应用 Cookie。

Theme Manager 自身更新后保留这份选择。ChatGPT 更新则进入版本门禁：

- 版本已经验证：正常恢复主题；
- 版本未知：保持原生，显示“等待兼容验证”；
- 页面读回失败：清理当前注入并停止重试。

因此它不会被 ChatGPT 更新“永久破坏”，但也不能承诺所有未来版本无需适配。

## 卸载与恢复

卸载前必须按顺序执行：

1. 将持久状态改为关闭；
2. 移除当前页面注入；
3. 注销 autostart；
4. 确认后台控制器已经退出；
5. 保留或按用户选择删除已下载主题缓存；
6. 不为了恢复而额外启动已经关闭的 ChatGPT。

如果某一步失败，卸载器要报告仍然存在的准确入口，不能显示假成功。

## 验收门槛

发布“保持主题常驻”前至少需要：

- Rust 状态机、并发锁、失败预算和恢复单元测试；
- Windows 当前用户 autostart 的隔离测试；
- macOS LaunchAgent 的 CI 结构检查；
- Windows Stable 与 Beta 分别执行普通启动、受控重启、应用、退出、再启动、关闭常驻；
- Apple Silicon Mac 上执行同一完整流程；
- 未验证 ChatGPT 版本不会进入重启循环；
- Theme Manager 更新后选择仍在；
- 卸载后系统启动项、控制器、CDP 端口和页面样式全部消失。

在这些证据完成前，README 只能称它为“已设计”，不能称为已发布功能。

## English summary

Persistent theming should mean a durable user choice plus a per-user controller that safely replays the verified Full Skin on future launches. It must not patch ChatGPT, `app.asar`, WindowsApps, or private data. The recommended implementation uses Tauri's official autostart plugin, a Rust controller, exact app and port identity checks, version gating, a bounded restart budget, and a complete disable/uninstall path. The design is approved, but the feature remains unreleased until Windows and physical-Mac evidence is complete.
