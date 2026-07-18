# 国风修仙 01：静境

“静境”是首发修仙系列的视觉原则。背景要像一个仍在画框外继续生长的世界，同时给工作区留下真正安静的区域。主视觉集中在右侧三分之一，左侧约 46% 只保留雾、天空、水面或低对比远景。

四个世界各有一套原画版和 Q 版：

- 青岚以墨绿山脊、月门和长路建立秩序
- 星河以钴蓝天路和克制红光表现逆行
- 山河以黑墨山体和一笔朱红剑光建立力量
- 云海以浮岛、浅玉色和原创风灵表现轻盈

原画版强调尺度、距离和单一视觉向量。Q 版保留同一世界的天气与色彩记忆，但重新设计角色轮廓、服装和道具，不能把原画人物简单缩小，也不能靠现成动漫角色来建立亲切感。

## 源图工作流

每套主题只有一张经过审查的 1536×1024 源图。`themes/source-art/jobs.json` 保存场景 brief 与统一原创性约束，OpenAI image job 负责生成，人工审查以下内容：

- 左侧安全区是否低对比、低细节
- 是否出现文字、签名、水印、Logo 或 UI
- 角色、服装、武器与场景是否接近现成 IP
- 3:2 源图裁成 16:9 后是否仍保留完整主体
- 画面是否达到正式动画背景或主题 Key Art 的完成度

通过审查后，生成器会从同一源图稳定导出明暗两套 2560×1440 背景和 960×540 预览。模式差异由 token、暗部压缩和安全区叠色共同完成，输出哈希可重复验证。

## 不做什么

作品名只能帮助解释题材，不能进入生成 prompt。项目不复制《凡人修仙传》《仙逆》《剑来》或其他作品的角色、服装、法器、场景构图、标志与可识别画风，也不使用现成动漫截图或同人图。

The English summary is simple: Quiet Realms uses reviewed, original image-job source art for four xianxia worlds and their chibi companions. Each composition reserves the left workspace safe area and avoids named artists, franchises, characters, and copied scenes.
