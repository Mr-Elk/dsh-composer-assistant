# P6 前置：暂时关闭语言选择

- 日期：2026-11-02
- 结论：**已被 `P6-LANGUAGE-ON-2026-11-02.md` 取代**（语言选择器已恢复）

## DSH 支持的语言

DSH `0.2.1-rc.5` 内置：

- 中文 `zh`
- English `en`

`dsh-client-locale` 的 `LOCALE_IDS` 只有 `zh` / `en`；语言包插件可以通过注册机制增加其他 locale，但当前安装没有额外内置语言。

## 本次改动

- 设置页隐藏“通用 → 语言”整组。
- `LANGUAGE_SELECTION_ENABLED = false`。
- `effectiveLanguage()` 在关闭期间固定返回 `follow`。
- `language` 配置字段保留，旧记录不丢；以后恢复选择器时可继续使用。
- 所有 UI 解析统一走 `effectiveLanguage()`：
  - 设置页
  - 齿轮弹窗
  - 控制器提示
  - BrowserRuntime 兜底
- 设置页、README、SETTINGS、v4 设计图同步为“暂时隐藏语言”。

## 验证

```text
pnpm typecheck              通过
pnpm test                   17 个文件 / 163 条通过
pnpm build                  0.3.0 构建通过
Chrome 冒烟                 12 项通过
screenshot-settings         8 项通过
```

真实 DSH 新页面验证：

```json
{
  "languageHidden": true,
  "switch": { "w": 44, "h": 24, "svg": true, "rect": "12" },
  "alert": "温度必须是 0 到 2 之间的数字。"
}
```

截图：`P6-language-hidden-final.png`

## 说明

- 语言选择器隐藏后，界面跟随 DSH 当前语言。
- 中英文文案仍保留在 i18n 字典里，恢复功能时不需要重写。
- 没有发布；npm/GitHub 仍待确认。
