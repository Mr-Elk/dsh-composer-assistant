# 文案总审（中文 / English）

日期：2026-11-02
范围：`src/core/i18n.ts` 的全部 key，以及控制器、BrowserRuntime、配置校验的错误码文案。

## 规则

- 说明用完整句；按钮用动词。
- 不出现实现词（`provider`、`maxDraftChars`、`ghost`、`panel`）。
- 不出现“您可以”“请”堆叠；错误说清“发生了什么 + 草稿是否保留”。
- 专有名词保留：DSH、Tab、Esc、English、npm、API Key。
- 未知宿主错误保留原文，不吞掉。

## 统计

- key 数量：145。
- 语言选择器已恢复；`language.*` key 与中英文切换已启用。
- 中文/英文 key 集合一致，由 `tests/i18n.test.ts` 检查。
- 控制器提示：`notice.*` 与 `error.*` 已走 `resolveUiLocale` + `t()`。
- `BrowserRuntime` 兜底异常：`error.disposed` / `error.disconnectedSave` / `error.connectionChanged` / `error.requestFailed`。
- 配置校验：`CONFIG_*` 错误码 + `params`，`errorCopy` 映射到 `config.*` 文案。
- 宿主错误按 `AssistantError.code` 映射；没有映射的错误保留原始 message。

## 逐项清单

| Key | 中文 | English | 结论 |
| --- | --- | --- | --- |
| `common.help` | 说明 | Help | 通过 |
| `settings.heading` | 输入助手 | Input assistant | 通过 |
| `settings.subtitle` | 管理下一句预测、输入续写与提示词优化。 | Manage next-message prediction, inline completion, and prompt optimization. | 通过 |
| `settings.title` | 输入助手设置 | Input assistant settings | 通过 |
| `settings.general` | 通用 | General | 通过 |
| `settings.language` | 语言 | Language | 通过 |
| `language.follow` | 跟随 DSH | Follow DSH | 通过 |
| `language.zh` | 中文 | Chinese | 通过 |
| `language.en` | English | English | 通过 |
| `settings.features` | 功能 | Features | 通过 |
| `settings.optimize` | 提示词优化 | Prompt optimization | 通过 |
| `settings.next` | 回复后预测 | Predict next message | 通过 |
| `settings.completion` | 输入续写 | Inline completion | 通过 |
| `settings.suggestions` | 建议 | Suggestions | 通过 |
| `settings.suggestionLength` | 建议长度 | Suggestion length | 通过 |
| `settings.optimization` | 优化 | Optimization | 通过 |
| `settings.strength` | 优化强度 | Optimization strength | 通过 |
| `settings.model` | 辅助模型 | Auxiliary model | 通过 |
| `settings.modelLabel` | 模型 | Model | 通过 |
| `settings.advanced` | 高级设置 | Advanced | 通过 |
| `settings.advancedCount` | {count} 项 | {count} items | 通过 |
| `settings.save` | 保存 | Save | 通过 |
| `settings.reset` | 恢复默认 | Restore defaults | 通过 |
| `settings.resetDone` | 已恢复默认值，保存后生效 | Defaults restored; save to apply | 通过 |
| `settings.unsaved` | 尚未保存 | Not saved | 通过 |
| `settings.saved` | 设置已保存 | Settings saved | 通过 |
| `settings.restoredDraft` | 已恢复上次未保存的修改。 | Restored unsaved changes from last time. | 通过 |
| `settings.saving` | 正在保存… | Saving… | 通过 |
| `settings.aboutLink` | 关于 | About | 通过 |
| `settings.loading` | 正在加载设置… | Loading settings… | 通过 |
| `settings.loadFailed` | 设置加载失败，请重试。 | Settings failed to load. Try again. | 通过 |
| `settings.disconnected` | 连接已断开，请重新连接后加载设置。 | Connection lost. Reconnect to load settings. | 通过 |
| `settings.conflict` | 设置已在其他窗口修改，请重新加载后再试。 | Settings changed in another window. Reload before continuing. | 通过 |
| `settings.reload` | 重新加载 | Reload | 通过 |
| `settings.modelCatalogFailed` | 模型列表暂不可用，已保留当前设置。 | Model list unavailable; current settings were kept. | 通过 |
| `settings.modelRemoved` | 原辅助模型不可用，已切换为跟随输入框；保存后生效。 | The saved auxiliary model is unavailable; switched to Follow composer. Save to apply. | 通过 |
| `settings.context` | 上下文上限 | Context limit | 通过 |
| `settings.timeout` | 建议超时 | Suggestion timeout | 通过 |
| `settings.hourly` | 每小时调用上限 | Hourly call limit | 通过 |
| `settings.temperature` | 温度 | Temperature | 通过 |
| `settings.extra` | 额外指令 | Extra instruction | 通过 |
| `settings.extraPlaceholder` | 例如：使用更口语的中文；避免使用列表；优先给出下一步验证方法 | e.g. Use conversational Chinese; avoid lists; end with the next verification step | 通过 |
| `settings.hint.suggestionLength` | 控制建议的最大长度。短档更简洁，长档更完整；内容超出输入框可见区域时，将自动改用候选卡展示。 | Controls the maximum suggestion length. Short is more concise; long is more complete. If the text exceeds the visible composer area, a candidate card is used. | 通过 |
| `settings.hint.strength` | 控制改写幅度。轻度仅调整表达，深度可重组结构；各档都不会新增任务或授权。 | Controls how much is rewritten. Light edits wording only; deep may restructure. No level adds tasks or grants permissions. | 通过 |
| `settings.hint.context` | 参与建议生成的对话上下文上限。数值越高，信息越完整，调用成本也越高。 | Maximum conversation context used for suggestions. Larger values are more complete and more expensive. | 通过 |
| `settings.hint.timeout` | 单次建议请求的等待上限，范围为 5–60 秒。模型响应较慢时可适当放宽；超时不会修改输入内容。 | Maximum wait for one suggestion request, from 5 to 60 seconds. Raise it for slow models; a timeout never changes the input. | 通过 |
| `settings.hint.hourly` | 自动建议的全局调用上限。0 表示不限制；手动优化与重新生成不计入。 | Global cap on automatic suggestions. 0 means no cap; manual optimization and regeneration do not count. | 通过 |
| `settings.hint.temperature` | 控制生成结果的稳定性。数值越低越保守，越高越发散；建议保持默认值。 | Controls generation stability. Lower values are more conservative, higher values more exploratory. Keep the default unless needed. | 通过 |
| `settings.hint.extra` | 附加到系统提示词的额外要求，最多 500 字。 | Additional requirements appended to the system prompt, up to 500 characters. | 通过 |
| `settings.select.short` | 短 | Short | 通过 |
| `settings.select.standard` | 标准 | Standard | 通过 |
| `settings.select.long` | 长 | Long | 通过 |
| `settings.select.light` | 轻度润色 | Light polish | 通过 |
| `settings.select.standardOptimization` | 标准优化 | Standard | 通过 |
| `settings.select.deep` | 深度梳理 | Deep restructure | 通过 |
| `popover.title` | 输入助手 | Input assistant | 通过 |
| `popover.replyPrediction` | 回复后预测 | Predict next message | 通过 |
| `popover.inlineCompletion` | 输入续写 | Inline completion | 通过 |
| `popover.suggestionLength` | 建议长度 | Suggestion length | 通过 |
| `popover.save` | 保存 | Save | 通过 |
| `popover.cancel` | 取消 | Cancel | 通过 |
| `popover.fullSettings` | 常用设置。<br>完整选项在 DSH 设置的「输入助手」页面。 | Common settings.<br>All options are on the Input assistant page in DSH Settings. | 通过 |
| `firstRun.title` | 输入助手 | Input assistant | 通过 |
| `firstRun.text` | 预测下一句、继续输入与优化表达 | Predict the next sentence, continue writing, and improve expression | 通过 |
| `firstRun.settings` | 可在设置中调整预测、续写与优化行为 | Adjust prediction, completion, and optimization in settings | 通过 |
| `firstRun.dismiss` | 知道了 | Got it | 通过 |
| `context.protect` | 保护 | Protect | 通过 |
| `context.optimized` | 已优化 | Optimized | 通过 |
| `context.viewChanges` | 查看改动 | View changes | 通过 |
| `context.undo` | 撤销 | Undo | 通过 |
| `context.copyOriginal` | 复制原文 | Copy original | 通过 |
| `context.regenerate` | 换一条 | Regenerate | 通过 |
| `context.accept` | 采纳 | Accept | 通过 |
| `context.ignore` | 忽略 | Ignore | 通过 |
| `context.esc` | Esc | Esc | 通过 |
| `context.changesTitle` | 查看改动 | View changes | 通过 |
| `context.copied` | 原文已复制 | Original copied | 通过 |
| `context.copyFailed` | 复制失败，请手动选择原文 | Copy failed; select the original manually | 通过 |
| `model.follow` | 跟随输入框 | Follow composer | 通过 |
| `model.current` | 当前使用：{model} | Using: {model} | 通过 |
| `model.source` | 模型列表由 DSH 提供 | Model list provided by DSH | 通过 |
| `model.billing` | 选择具体模型后，辅助调用将单独计费。 | A specific model is billed separately for auxiliary calls. | 通过 |
| `model.unavailable` | 模型列表暂不可用 | Model list unavailable | 通过 |
| `model.loading` | 正在加载模型列表… | Loading model list… | 通过 |
| `toolbar.optimize` | 优化 | Optimize | 通过 |
| `toolbar.optimizing` | 优化中… | Optimizing… | 通过 |
| `toolbar.optimizeTitle` | 有选中文字时优化选区，否则优化整篇草稿 | Optimize the selection, or the whole draft when nothing is selected | 通过 |
| `toolbar.settings` | 输入助手设置 | Input assistant settings | 通过 |
| `settings.invalidGeneric` | 设置无效，请检查后重试。 | Invalid settings. Check them and try again. | 通过 |
| `settings.saveFailedGeneric` | 保存未确认，请重新打开设置核对。 | Save not confirmed. Reopen settings to check. | 通过 |
| `config.field` | 该设置项 | this setting | 通过 |
| `config.boolean` | {field} 必须是布尔值。 | {field} must be true or false. | 通过 |
| `config.displayMode` | 显示方式无效。 | The display mode is invalid. | 通过 |
| `config.suggestionLength` | 建议长度无效。 | The suggestion length is invalid. | 通过 |
| `config.language` | 语言设置无效。 | The language setting is invalid. | 通过 |
| `config.strength` | 优化强度无效。 | The optimization strength is invalid. | 通过 |
| `config.number` | {field} 必须是 {min} 到 {max} 之间的整数。 | {field} must be an integer from {min} to {max}. | 通过 |
| `config.string` | {field} 无效或过长（最多 {limit} 字）。 | {field} is invalid or too long (maximum {limit} characters). | 通过 |
| `config.temperature` | 温度必须是 0 到 2 之间的数字。 | Temperature must be a number from 0 to 2. | 通过 |
| `config.modelPair` | 辅助模型需同时选择提供商和模型，或留空跟随输入框。 | Choose both a provider and a model for the auxiliary model, or leave it on Follow composer. | 通过 |
| `config.unknown` | 存在无法识别的配置项，请重新加载设置。 | An unrecognized setting is present. Reload settings. | 通过 |
| `error.requestFailed` | 输入助手请求失败，请稍后重试。 | The input assistant request failed. Try again shortly. | 通过 |
| `error.disposed` | 输入助手已停用。 | The input assistant is disabled. | 通过 |
| `error.disconnectedSave` | 连接已断开，请重新连接后保存。 | Connection lost. Reconnect before saving. | 通过 |
| `error.connectionChanged` | 连接已变化，请重新加载设置。 | The connection changed. Reload settings. | 通过 |
| `notice.settingsSaved` | 设置已保存。 | Settings saved. | 通过 |
| `notice.locked` | 已保护选中原文；编辑草稿后需重新锁定。 | The selection is protected. Protect the text again after editing the draft. | 通过 |
| `notice.locksCleared` | 已清除手动保护片段。 | Manual protection cleared. | 通过 |
| `notice.optimizeDisabled` | 提示词优化已关闭，请在设置中开启。 | Prompt optimization is off. Enable it in settings. | 通过 |
| `notice.lockCross` | 选区跨越受保护片段，请完整包含或避开。 | The selection crosses a protected fragment. Include it fully or avoid it. | 通过 |
| `notice.tooLong` | 待优化内容超过 {limit} 字符，请选择较短片段。 | The text exceeds {limit} characters. Select a shorter fragment. | 通过 |
| `notice.notReady` | 连接或模型尚未就绪，请稍后重试。 | The connection or model is not ready. Try again shortly. | 通过 |
| `notice.noResult` | 没有可应用的优化结果，原文已保留。 | No applicable optimization result; the original text was kept. | 通过 |
| `notice.draftChanged` | 草稿已变化，本次结果已放弃。 | The draft changed; this result was discarded. | 通过 |
| `notice.optimized` | 已优化，可查看改动或撤销。 | Optimized. View changes or undo. | 通过 |
| `notice.cannotRestore` | 草稿已有新编辑，请在改动面板复制原文。 | The draft has newer edits. Copy the original from the changes panel. | 通过 |
| `notice.restored` | 已还原优化前的内容。 | The pre-optimization text was restored. | 通过 |
| `notice.notEditable` | 当前输入框暂时不可编辑。 | The composer is temporarily read-only. | 通过 |
| `notice.selectionPlain` | 请选择完全位于纯文字中的片段，避免跨越引用标签。 | Select a fragment inside plain text, without crossing reference tags. | 通过 |
| `notice.selectToProtect` | 请先在输入框选中要保护的文字。 | Select text in the composer before protecting it. | 通过 |
| `notice.referencesSelection` | 含引用标签时，请选择不跨标签的纯文字片段优化。 | With reference tags, select plain text that does not cross a tag. | 通过 |
| `notice.failed` | 操作失败，原文已保留，请稍后重试。 | The operation failed; the original text was kept. Try again shortly. | 通过 |
| `error.disabled` | 提示词优化已关闭，请在设置中开启。 | Prompt optimization is off. Enable it in settings. | 通过 |
| `error.session` | 当前会话尚未就绪，请稍后重试。 | The session is not ready. Try again shortly. | 通过 |
| `error.stale` | 会话状态已变化，草稿已保留。 | The session changed; the draft was kept. | 通过 |
| `error.input` | 输入状态已变化，请重新操作。 | The input state changed. Try again. | 通过 |
| `error.model` | 请先在输入框选择模型，或在设置中选择辅助模型。 | Select a model in the composer, or choose an auxiliary model in settings. | 通过 |
| `error.output` | 模型输出无效，草稿已保留。 | The model returned invalid output; the draft was kept. | 通过 |
| `error.timeout` | 模型请求超时，请稍后重试。 | The model request timed out. Try again shortly. | 通过 |
| `error.cancelled` | 请求已取消。 | The request was cancelled. | 通过 |
| `error.busy` | 正在优化，请稍后。 | Optimization is already running. | 通过 |
| `error.config` | 设置无效，请检查后重试。 | The settings are invalid. Check them and try again. | 通过 |
| `error.tooLong` | 待处理内容超过字数上限，请缩短后重试。 | The text exceeds the length limit. Shorten it and try again. | 通过 |
| `error.empty` | 没有可处理的内容。 | There is nothing to process. | 通过 |
| `error.protection` | 生成结果未完整保留锁定内容，草稿已保留。 | The result did not preserve protected content; the draft was kept. | 通过 |
| `error.lockScope` | 锁定片段已变化，请重新选择。 | The protected fragment changed. Select it again. | 通过 |
| `about.title` | 关于输入助手 | About input assistant | 通过 |
| `about.version` | 版本 | Version | 通过 |
| `about.upgrade` | 升级方式 | Upgrade | 通过 |
| `about.upgradeHint` | 在 DSH 侧边栏打开「插件」，找到本插件后选择更新；也可以运行以下命令。 | Open Plugins in the DSH sidebar and choose Update for this plugin, or run the command below. | 通过 |
| `about.copy` | 复制命令 | Copy command | 通过 |
| `about.copied` | 命令已复制 | Command copied | 通过 |
| `about.copyFailed` | 复制失败，请手动选择命令 | Copy failed; select the command manually | 通过 |
| `about.restartNote` | 升级后需重启 DSH 生效。 | Restart DSH after upgrading. | 通过 |
| `about.close` | 关闭 | Close | 通过 |

## 本轮修正

- 冲突文案只提示重新加载；冲突时保存本来就被禁用。
- “轻度/深度不授权”英文改为 `No level adds tasks or grants permissions.`
- “保护后编辑需重新锁定”英文改为 `Protect the text again after editing the draft.`
- “普通文字”改为“纯文字”。
- “换一条”英文从 `Another` 改为 `Regenerate`。
- 删除 `settings.invalid` / `settings.saveFailed` 两个会拼接原始异常的旧 key。
- 新增 `config.*`、`error.disposed`、`error.disconnectedSave`、`error.connectionChanged`、`error.requestFailed`。
- 配置校验改为 `CONFIG_BOOLEAN` / `CONFIG_NUMBER` / `CONFIG_STRING` / `CONFIG_TEMPERATURE` / `CONFIG_*`，并携带 field/min/max/limit。
- 设置页和齿轮弹窗统一用 `errorCopy`；未知错误不再拼接中文原文。

## 残余

- 宿主未知错误按约定保留原文，可能出现中文；这是有意行为。
- Edge 原生、IME、`@` 空工作区仍未验证。
