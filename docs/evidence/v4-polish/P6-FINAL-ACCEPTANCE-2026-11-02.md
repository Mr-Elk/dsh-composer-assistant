# P6 最后验收（重启后）

- 日期：2026-11-02
- 结论：**PASS**
- 没有发布。

## 进程

```text
PID 42345
启动：2026-11-02 16:52:09
端口：127.0.0.1:51272
```

这次是 Cmd+Q 后重新打开的新进程。

## 真实 DSH 验证

全部通过，没有调用模型：

- 齿轮弹窗标题 i：标题下方两行内联说明，`332 × 44`；没有 tooltip。
- 开关：`44 × 24`，SVG `<rect rx="12">` + `<circle r="10">`。
- 设置页标题、副标题、语言选择。
- 关于弹窗：0.3.0、DSH 插件页更新说明；没有统计。
- 恢复草稿：关闭设置再打开，恢复 toast、值恢复、保存可用。
- 保存恢复的草稿。
- 恢复默认后保存。
- 语言切到 English，整页英文。
- 英文错误：`Temperature must be a number from 0 to 2.`
- 语言切回“跟随 DSH”，整页中文。
- 成功和恢复 toast 在设置标题区，不跑到面板外。
- 错误在保存条上方。

## 验证输出

```json
{
  "status": "passed",
  "done": [
    "popover two-line inline note; 44x24 SVG switch",
    "settings header, language selector, about 0.3.0/no stats",
    "draft restore toast, save, restore defaults, save",
    "English switch, English error, back to follow"
  ],
  "noteBox": { "x": 565.515625, "y": 356.5, "width": 332, "height": 44 },
  "switchInfo": { "w": 44, "h": 24, "svg": true, "rx": "12", "r": "10" },
  "alert": "Temperature must be a number from 0 to 2."
}
```

截图：

- `P6-popover-note.png`
- `P6-language-en-final.png`
- `P6-error-en-final.png`
- `P6-about-final.png`
- `P6-toast-restored.png`

## 回归

```text
pnpm typecheck              通过
pnpm test                   17 个文件 / 163 条通过
pnpm build                  通过
Chrome 冒烟                 通过，0 次付费调用
设置页截图脚本              8 项通过
```

## 下一步

- 打本地 `v0.3.0` tag。
- 不推送、不发布，等确认。
