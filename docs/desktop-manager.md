# 桌面主题管理器

## 为什么最终选择 Tauri 2

这个应用要解决的是一个很窄的问题：浏览真实主题截图，拿到经过校验的
Codex Native 字符串，再打开用户已经安装的 ChatGPT Stable 或 Beta。
它不需要一整套内置浏览器。

我们用同一份界面和同一批 28 套主题做了两个 Windows NSIS 候选包：

| 候选方案 | 安装包 | 结果 |
| --- | ---: | --- |
| Electron | 97.45 MiB | 能运行，但为一个轻量管理器附带 Chromium 和 Node.js |
| Tauri 2 | 3.66 MiB | 已完成真实运行、精确复制和 NSIS 打包验证 |

Tauri 包比 Electron 候选包小约 96.2%。这不是只看宣传页后的估算，而是
本仓库在同一台 Windows 机器上的实际构建结果。运行内存会受到 WebView2、
图片缓存和系统版本影响，所以项目只把“安装包明显更小”作为已证实结论，
不承诺固定的内存节省比例。

最终结构是：

```text
原生 HTML / CSS / JavaScript
              ↓ 窄 Tauri commands
Rust：目录校验、缓存、剪贴板、应用发现、更新
              ↓
Windows WebView2 / macOS WKWebView
```

没有 React，也没有把原有 Gallery 重写成另一套前端。

## 进程与信任边界

- Renderer 只加载打包内的页面。CSP 不允许远程脚本，只允许固定 Pages
  域名上的截图。
- 本地资源协议只开放 `catalog/screenshots/**`，不会把任意文件路径暴露给
  页面。
- 前端只能按主题 ID 和明暗模式请求复制。Rust 会再次从当前已验证的
  Registry 取值；前端拿不到可随意传入剪贴板的通用接口。
- Windows 通过 AppX manifest 发现 Stable/Beta 的准确 AUMID；macOS
  只允许系统打开 `ChatGPT` 或 `ChatGPT Beta`。
- 管理器不写入 WindowsApps、ChatGPT 应用包、私有数据或对话，也不会代替
  用户点击最后的“导入”。
- 主题包仍是声明式数据和素材，不带脚本、CSS 或远程可执行内容。

## 两条更新通道

### 主题目录

应用先读取随包发布的 Registry；如果本机已有通过校验的缓存，则优先显示
缓存。随后访问：

```text
https://rwang23.github.io/awesome-codex-theme/downloads/catalog.json
```

远端清单固定 Registry URL 和素材根地址，并记录 SHA-256、字节数、主题数
与标准版本。下载后还要通过 Rust 端结构校验：

- 只接受 `act-theme-pack-v1` 和 Registry Schema v1
- 主题、系列、路径和 Native 值必须安全且唯一
- 两个模式都必须绑定 1440×810 的真实截图记录
- Native 字段必须严格匹配 `codex-theme-v1`
- 字符串的哈希、字节数和 Registry 记录必须一致

任一步失败，应用会明确显示离线状态，并继续使用已验证缓存或内置版本。

### 应用自身

应用更新使用 Tauri updater。这个通道有意保持关闭，直到发布签名材料准备
完成：

1. 编译时注入 `ACT_UPDATER_PUBKEY`。
2. GitHub Actions 使用 `TAURI_SIGNING_PRIVATE_KEY` 为更新产物签名。
3. `tauri-action` 为带版本标签的 Release 生成安装包、签名和 `latest.json`。
4. 客户端验证签名后下载；只有用户点击“重启并安装”才应用更新。

Tauri updater 不允许关闭签名验证。没有公钥的构建会显示“桌面更新签名通道
尚未发布”，不会访问一个不存在的自动更新渠道。

更新签名不能代替操作系统代码签名。面向普通用户发布前，还需要：

- Windows：代码签名，减少 SmartScreen 的未知发布者提示。
- macOS：Developer ID 签名、Apple notarization 和真机读回。

仓库不会把未签名或未公证的产物标成正式发行版。

## Windows 与 macOS

日常开发可以完全在 Windows 上进行。Windows 需要 Node.js 22、Rust
stable、Microsoft C++ Build Tools 和 WebView2。安装器采用 Tauri 默认的
WebView2 在线 bootstrapper，不把约百兆的离线 Runtime 塞进安装包。

macOS 的 `.app` 与 `.dmg` 必须在 macOS 环境构建。本仓库的 GitHub Actions
矩阵分别使用：

```text
aarch64-apple-darwin
x86_64-apple-darwin
```

CI 能证明两套目标可以编译和打包，但不能代替普通用户在真实 Mac 上完成
下载、启动、签名验证、复制和导入。因此“macOS 已支持”至少需要一次
Apple Silicon 真机验收；“macOS 自动更新可用”还需要同一签名身份下的旧版
到新版更新读回。

## 开发与验证

```bash
npm install --prefix apps/theme-manager
npm run generate
npm run desktop:check
npm run desktop:start
npm run desktop:build:win
```

在 macOS 上构建 DMG：

```bash
npm run desktop:build:mac
```

Windows 产物位于：

```text
apps/theme-manager/src-tauri/target/release/bundle/nsis/
```

macOS 产物位于对应 Rust target 下的 `release/bundle/dmg/`。这些都是生成
目录，不进入 Git。只有带版本标签、`DESKTOP_RELEASE_READY=true` 且发布
签名变量与 Secrets 全部就绪时，工作流才创建桌面 Release。

## English summary

The project now uses Tauri 2 with the existing dependency-free HTML, CSS, and
JavaScript interface plus a narrow Rust backend. The verified Windows NSIS
package is 3.66 MiB versus 97.45 MiB for the equivalent Electron candidate.
The manager validates a pinned catalog, keeps verified offline fallbacks,
copies only a Registry-selected Native value, and leaves final import to the
user. Signed updater releases are wired through GitHub Actions but remain
deliberately disabled until updater keys, Windows signing, and macOS
signing/notarization are configured and read back on real devices.
