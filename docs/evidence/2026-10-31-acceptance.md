# 真实浏览器验收：Tab、撤销、菜单共存、失败保留（0.2.0-local.9）

方法：隔离 profile + 无头 Chromium，`page.route` 拦截 `/api/input-assistant/call` 的
`generate`，返回固定建议或错误，绕开无登录环境；其余 RPC 放行到真实宿主。

## 结果

| 场景 | 观测 |
| --- | --- |
| Tab 采纳 | `这段代码的时间复杂度是` → `这段代码的时间复杂度是，最坏 O(n log n)。` |
| 一次撤销 | 采纳后按一次 `Meta+z`，文本回到 `这段代码的时间复杂度是` |
| `/` 菜单共存 | 输入 `/` 后菜单打开；按 Tab 后文本为空、建议**未被插入**，按键由菜单消费 |
| 生成失败 | 拦截返回 `ok:false`；草稿保持 `请解释缓存`，无灰字、无异常 |

原始输出：

```json
{
  "beforeTab": "这段代码的时间复杂度是",
  "afterTab": "这段代码的时间复杂度是，最坏 O(n log n)。",
  "afterUndo": "这段代码的时间复杂度是",
  "menuOpen": true,
  "beforeMenuTab": "/",
  "afterMenuTab": "",
  "errorScenario": { "text": "请解释缓存", "ghost": false }
}
```

## 未覆盖

- **IME 组字**：用合成 `CompositionEvent` 驱动时，Lexical 不会把文字写进草稿，后续请求数为 0，
  属测试手段失真，不能据此宣称通过；该路径目前只有 jsdom 单测（`setComposing`）覆盖，仍需真机
  中文输入法确认。
- 真实模型返回下的建议质量（本验收全部使用固定夹具）。
