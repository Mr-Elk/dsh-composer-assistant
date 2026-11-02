# P1 Spike：DSH 设置关闭钩子

- 日期：2026-11-02
- 目标：确认 DSH 是否提供公开的 before-close 能力
- 结论：**没有公开 before-close 钩子**

## 查到的公开契约

`@deepseek-ai/dsh-client-ui-settings` 的 `settings.section`：

```ts
export interface SettingsSectionOwnerProps {
  /** Close the settings panel (the shell owns the open state). */
  close: () => void
}
```

只有 `close()`，没有 `beforeClose` / `onBeforeClose` / `requestClose`。

`settings.action` 是标题栏动作槽，`settings.close` 只是关闭按钮的无障碍文案槽。

## 壳的实现

`@deepseek-ai/dsh-client-ui-settings-general/lib/client.js` 的 `SettingsPanel`：

- 遮罩：`onClick: onClose`
- 关闭按钮：`onClick: onClose`
- `useModalLayer(panel, true, onClose)`
- section：`renderSlot("settings.section", { close: onClose }, { only: active })`

三个关闭路径都直接调用壳的 `onClose`，section 拿到的 `close` 只是同一个函数，无法在关闭前插入逻辑。

## 可选方案

| 方案 | 能否拦截 | 代价 |
| --- | --- | --- |
| 页内“尚未保存” | 否 | 零耦合，推荐 |
| 标题栏“保存并关闭” | 否 | 仍拦不住壳的关闭按钮 |
| DOM 监听关闭按钮/遮罩/Escape | 是 | 依赖 DOM、文案和事件顺序，DSH 升级易坏，不推荐 |
| 关闭时存 sessionStorage，重开恢复 | 否 | 可恢复，但不是提示 |

## 建议

不做 DOM 劫持。保留页内“尚未保存”，如果需要在关闭前提醒，选“标题栏加保存并关闭”或“重开恢复草稿”，二者都只能改善，不能真正拦截。

## 证据

- `node_modules/@deepseek-ai/dsh-client-ui-settings/lib/types/client/contract/slots.d.ts`
- `node_modules/@deepseek-ai/dsh-client-ui-settings-general/lib/client.js`
