# Image job 操作手册

## 配置检查

仓库脚本调用用户环境中的 `openai-image-job` runner。默认位置是：

```text
~/.codex/skills/creative-media/openai-image-job/scripts/generate_image_job.py
```

如果 runner 在别处，设置 `OPENAI_IMAGE_JOB_RUNNER`。密钥继续放在 Codex 用户级本地配置中，不要复制到仓库。

## 生成一张

```bash
npm run art:generate -- --ids=qinglan-odyssey
```

已有输出默认跳过。确认要重做时：

```bash
npm run art:generate -- --ids=qinglan-odyssey --force
```

多个 ID 用逗号分隔。批量任务最多四路并发：

```bash
npm run art:generate -- --ids=theme-a,theme-b --concurrency=2
```

## Prompt 写法

`themes/source-art/jobs.json` 有统一约束，单个 job 只描述自己的场景。写清：

- 时间、天气和主色
- 主体是什么，放在哪里
- 前中后景关系
- 城市或幻想世界靠什么气质被识别
- 哪些具体元素不要出现

不要重复 common prompt，也不要写具体画师或工作室。原创 job 不写作品名；Fan Art job 只写 brief 已声明的作品、角色、道具和新构图。

## 失败处理

- 构图挤占安全区：明确把主体推到右侧三分之一，并让左侧保持雾、天空或水面。
- 出现文字或 Logo：在场景 brief 中点名移除，再用 `--force` 重做。
- 原创角色像现成 IP：更改轮廓、服装结构、配色和道具，不能只换颜色。
- Fan Art 出现未声明角色或复制镜头：移除多余角色，改换机位、动作、景别和环境叙事后重做。
- 画面像概念草图：要求完成的动画背景、可信材质和环境细节。
- 3:2 好看但 16:9 被截：把重要内容收进垂直中间 82%。

源图通过后运行 `npm run check`。生成器会完成裁切、明暗分级、哈希、包和预览。
