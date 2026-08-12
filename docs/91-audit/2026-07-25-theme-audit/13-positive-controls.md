# 13 · 应保留并防止回归的优秀设计

优化不能只看问题。以下设计构成 Awesome Codex Theme 的核心竞争力和信任基础，后续重构必须有回归测试保护。

## 1. 主题包无代码

Canonical `.act-theme` 只包含 Manifest、两张图片与两份严格 Native fallback。社区主题不能自带 JavaScript、CSS、Shell 或远程引用。不要为了“主题更灵活”放开任意脚本。

## 2. 固定 Runtime 由 Manager 管理

所有主题共享审查过的 `runtime.css`/`runtime.js`，兼容性和安全修复集中发布。不要把 Runtime 复制进每个主题归档。

## 3. 内容完整性链

- relative path
- byte count
- PNG signature
- SHA-256
- package entries
- Registry records
- capture hash/readback

本次重新计算的 source、capture 和 native capture 哈希全部匹配。这套链路应继续扩展，而不是被替换成只信 URL。

## 4. 真实应用截图与 mock 分离

README 明确实机 capture 来自具体 Beta 版本，不把壁纸贴进窗口 mock 当成验证。这种诚实表达非常重要。

## 5. CDP 目标身份检查

Loopback 不自动等于可信。项目检查选定包、进程、executable、listener ownership 与 `app://` target。后续兼容性改动不能用“连接得上就行”简化。

## 6. 不修改 ChatGPT 安装文件

项目目标是不写 WindowsApps、ChatGPT.app、app.asar 或私有对话数据。Keep 是受控 replay，不是永久 patch。这个产品边界应继续在 UI 和文档中突出。

## 7. 版本更新 Gate

ChatGPT 目标更新后保持 Native，只有用户显式 Reapply 且本地 probe 成功才记录新版本。这是比静态 allowlist 更安全、也更符合快速更新桌面应用现实的策略。

## 8. Catalog revision 防回滚

远程或缓存 Catalog 不能用更旧 revision 覆盖新的 bundled data。增加签名时应保留 revision monotonicity，而不是只做签名不做 rollback protection。

## 9. Original / Fan Art 双轨

Fan Art 明确 unofficial、personal non-commercial、无官方资产、`rightsVerified:false`。不要为了简化 UI 把两轨合并成模糊的“community theme”。

## 10. 双语与主题叙事

主题名称、短文案、集合与贡献流程有中英文，这让项目同时服务中文社区和全球用户。i18n 修复应扩展到 aria/error/status，而不是减少现有双语内容。

## 11. Reduced motion 与原生布局保留

Version 1 不移动 composer、不替换导航、不把 Codex 变成截图式 UI。主题系统保持氛围层而非重做信息架构，这降低了版本脆弱性。

## 12. 窄 Tauri capability

Renderer 没有直接获得任意文件系统、Shell 或进程能力，敏感操作集中在 Rust。后续新增命令要保持最小 capability，并对参数和返回值做结构化约束。

## 13. 文档对签名边界较诚实

Updater signature、ad-hoc Mac signature、SmartScreen、Gatekeeper、Developer ID/Authenticode 的差异有明确说明。修复版本元数据时应保持这种不夸大安全保证的写法。

## 14. Provenance 与 Prompt Hash

68 张源图的 source/prompt hash 全部匹配，且无重复 job ID。这为进一步加入人工 rights attestation 和 perceptual duplicate 检查提供了良好基础。

## 15. 回归保护建议

为以上每项建立命名测试或 release checklist。任何优化 PR 若削弱这些控制，必须在 PR 描述中明确列出理由、替代控制与迁移计划。
