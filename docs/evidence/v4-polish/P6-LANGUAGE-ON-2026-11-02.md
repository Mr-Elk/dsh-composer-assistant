# P6：恢复语言切换与完整中英文化

- 日期：2026-11-02
- 结论：**PASS**

## DSH 语言

DSH `0.2.1-rc.5` 内置：

- 中文 `zh`
- English `en`

`dsh-client-locale` 的 `LOCALE_IDS` 只有 `zh` / `en`；当前没有额外内置语言包。

## 恢复内容

- `LANGUAGE_SELECTION_ENABLED = true`
- 设置页恢复“通用 → 语言”：
  - 跟随 DSH
  - 中文
  - English
- 保存后整页切换语言。
- 所有界面、提示、错误都走 `resolveUiLocale` + `t()`：
  - 设置页
  - 齿轮弹窗
  - 首次提示
  - 结果条 / 保护 / 候选卡
  - 控制器提示
  - BrowserRuntime 兜底
  - 配置校验错误
  - 宿主错误码映射
- 145 个 key 的中英文清单：[COPY_REVIEW.md](../../COPY_REVIEW.md)

## 真实 DSH 验证

在真实 DSH 设置页：

1. 语言切到 English，保存。
2. 页面变英文：
   - “Input assistant”
   - “Manage next-message prediction, inline completion, and prompt optimization.”
   - “Features / Suggestions / Optimization / Auxiliary model / Advanced”
3. 高级里把 Temperature 清空，保存：
   - 报错 `Temperature must be a number from 0 to 2.`
   - 没有中文、没有 `temperature` 实现词。
4. 温度恢复 0.7，语言切回“跟随 DSH”，保存。
5. 页面回到中文。

截图：`P6-language-en-final.png`

## 验证

```text
pnpm typecheck              通过
pnpm test                   17 个文件 / 163 条通过
pnpm build                  0.3.0 构建通过
Chrome 冒烟                 12 项通过
screenshot-settings         8 项通过
主题回归                    5 条通过
```

## 说明

- 语言切换、错误文案都在浏览器客户端验证；宿主错误码要下次重启后加载完整新版。
- 没有发布。
