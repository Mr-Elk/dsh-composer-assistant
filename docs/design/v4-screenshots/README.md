# v4 实际组件截图

这些是生产组件在浏览器夹具里的截图，不是设计图。
设计图在 [`../mockups-v4/`](../mockups-v4/)。

| 文件 | 内容 |
| --- | --- |
| `settings-light.png` | 设置页默认，浅色 |
| `settings-dark.png` | 设置页默认，深色 |
| `settings-advanced-light.png` | 高级展开 |
| `settings-tooltip-light.png` | 建议长度 i 提示，浅色 |
| `settings-tooltip-dark.png` | 建议长度 i 提示，深色 |
| `about-light.png` | 关于弹窗，浅色 |
| `about-dark.png` | 关于弹窗，深色 |
| `settings-en-light.png` | 英文界面 |
| `settings-narrow.png` | 720 宽窄窗 |
| `settings-200.png` | 200% 等效 640 宽 |
| `settings-200-tooltip.png` | 200% 等效 360 宽 + i 提示贴边 |
| `composer-light.png` | 输入框 `✦ 优化` + `⚙` |
| `composer-popover-light.png` | 齿轮弹窗，浅色 |
| `composer-popover-dark.png` | 齿轮弹窗，深色 |
| `composer-popover-narrow.png` | 齿轮弹窗，720 宽窄窗 |
| `composer-popover-note-light.png` | 齿轮弹窗标题 i 的两行内联说明 |
| `composer-result-light.png` | 优化结果条，浅色 |
| `composer-result-dark.png` | 优化结果条，深色 |
| `composer-result-narrow.png` | 优化结果条，720 窄窗 |
| `composer-diff-light.png` | 查看改动 |
| `composer-protect-light.png` | 选中文字与“保护” |
| `composer-first-run-light.png` | 首次提示，浅色 |
| `composer-first-run-dark.png` | 首次提示，深色 |
| `composer-first-run-narrow.png` | 首次提示，720 窄窗 |
| `composer-first-run-200.png` | 首次提示，200% 等效 640 宽 |
| `composer-200.png` | 结果条，200% 等效 640 宽 |

生成：设置页用 `node scripts/screenshot-settings.mjs`；输入区/结果条/首次提示用 `node scripts/smoke-web.mjs`（Playwright Chrome）。
