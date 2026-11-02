# 输入助手 · 设计图 v4（已定稿）

这是 0.3.x 收尾版：齿轮弹窗只放设置；操作跟着情境走；设置页新增辅助模型下拉、
高级默认收起、关于入口。语言选择器已恢复：跟随 DSH / 中文 / English。保存条、开关尺寸和文案已按 2026-11-02 的评审更新；
后续收尾计划见 [`POLISH_PLAN.md`](../../POLISH_PLAN.md)。

## 图纸

| 文件 | 内容 | 尺寸（CSS） |
| --- | --- | --- |
| [`settings-light.png`](settings-light.png) / [`settings-dark.png`](settings-dark.png) | 设置页默认：高级收起、保存置灰 | 840 × 1064 |
| [`settings-hover-light.png`](settings-hover-light.png) / [`settings-hover-dark.png`](settings-hover-dark.png) | 设置页悬浮：建议长度说明 | 840 × 1072 |
| [`settings-advanced-light.png`](settings-advanced-light.png) / [`settings-advanced-dark.png`](settings-advanced-dark.png) | 设置页：高级展开 | 840 × 1387 |
| [`settings-model-light.png`](settings-model-light.png) / [`settings-model-dark.png`](settings-model-dark.png) | 辅助模型下拉：选项来自 DSH 模型列表 | 840 × 374 |
| [`about-light.png`](about-light.png) / [`about-dark.png`](about-dark.png) | 关于：版本、插件页更新说明、复制命令 | 536 × 334 |
| [`composer-light.png`](composer-light.png) / [`composer-dark.png`](composer-dark.png) | 输入框入口：星形 16px、齿轮紧挨优化 | 776 × 184 |
| [`popover-light.png`](popover-light.png) / [`popover-dark.png`](popover-dark.png) | 齿轮弹窗：三项设置 + 保存；标题旁 i | 396 × 289 |
| [`popover-hover-light.png`](popover-hover-light.png) / [`popover-hover-dark.png`](popover-hover-dark.png) | 标题 i：展开两行完整设置说明 | 700 × 333 |
| [`context-light.png`](context-light.png) / [`context-dark.png`](context-dark.png) | 情境操作：选中保护、优化后查看/撤销、建议操作 | 776 × 673 |
| [`operation-map-light.png`](operation-map-light.png) / [`operation-map-dark.png`](operation-map-dark.png) | 原操作 → 新位置 | 840 × 430 |
| [`first-run-light.png`](first-run-light.png) / [`first-run-dark.png`](first-run-dark.png) | 首次使用提示 | 776 × 284 |

总览：[`contact-sheet.png`](contact-sheet.png)。

## 已定的结构

- **输入框**：`✦ 优化` + 齿轮；星形 16px，齿轮紧挨优化，中间细分隔线。
- **齿轮弹窗**：只放三项设置（回复后预测、输入续写、建议长度）+ 保存 / 取消；
  标题旁 `i` 提示完整设置位置。没有 tab，没有操作。
- **操作**：跟着情境走（选中保护、优化后查看/撤销、候选卡建议操作），不放进设置。
- **设置页**：通用 / 功能 / 建议 / 优化 / 辅助模型 / 高级（默认收起）/ `恢复默认` + `保存` /
  关于（表单外链接）。
- **语言**：跟随 DSH / 中文 / English，默认跟随 DSH。
- **辅助模型**：一个模型下拉，默认跟随输入框；选项来自 DSH 模型列表，不手填。
- **首次提示**：第一次打开输入框出现一次；本地记住，不再重复。

## 操作去哪了

| 原操作 | 现在的位置 |
| --- | --- |
| 保护选中原文 | 选中文字上方浮出「保护」 |
| 查看改动 | 优化完成后输入框顶部结果条「查看改动」 |
| 撤销 / 复制原文 | 同一条结果条 |
| 换一条建议 | 候选卡里的「换一条」 |
| 暂停至下次编辑 | 候选卡 `×`；灰字建议补 `Esc` 忽略 |
| 版本 / 更新说明 | 设置页底部「关于」弹窗；更新走 DSH 侧边栏「插件」页 |

## 保存逻辑

- 弹窗只保存三项设置；写整份设置草稿，和上次保存的值做 diff，只提交改动字段。
- 语言、高级项等弹窗里没显示的字段不会被清空。
- 没有改动时保存按钮置灰；保存后关闭弹窗；取消 / 点外面丢弃未保存改动。
- 设置页的「恢复默认」只重置表单，点「保存」才写入。
- 操作立即执行，不进设置草稿。
- 设置页和弹窗写同一份存储；两边同时开着时，设置页重新获得焦点要刷新或提示。

## 设置页条件状态

- 提示词优化关闭 → 优化强度置灰。
- 回复后预测和输入续写都关闭 → 建议长度置灰。
- 高级默认收起；展开状态只记在当前界面，不写进设置。
- 关于不参与保存，打开的是独立弹窗。

## 辅助模型

- 下拉选项直接来自 DSH 模型列表；不内置第二份，不提供手动输入。
- 第一项「跟随输入框」；选具体模型时内部写入 provider + model 一对。
- i 显示：当前跟随的模型、列表来源、单独计费。
- 列表加载失败：只保留「跟随输入框」并提示。
- 已选模型被移除：回落「跟随输入框」并提示。
- 推理档固定最低，不暴露。

## 语言

- 默认「跟随 DSH」；也可固定中文或 English。
- 保存后整份插件界面切换；跟随 DSH 时随 DSH 语言变化。
- 范围：设置页、弹窗、首次提示、提示气泡、错误消息。
- 宿主错误消息要补错误码翻译表；不做机器翻译。

## 实现时已经定下的细节

- `Esc` 忽略建议：要补上（现在只关提示/菜单），补完后删「暂停至下次编辑」。
- 首次提示标记存浏览器本地（localStorage），不写进插件设置。
- 高级展开状态只存在当前界面，不持久化。
- 关于弹窗：Esc 关闭、焦点回到入口。
- 模型列表接口只读；不能改 DSH 的模型配置。
- 版本与发布节奏见 [`POLISH_PLAN.md`](../../POLISH_PLAN.md)。

## 重新生成

```shell
node scripts/render-mockups-v4.mjs
```

脚本会把 22 张 PNG 写到本目录；图片是 2 倍像素。
