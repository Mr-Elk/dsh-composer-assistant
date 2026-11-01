# DSH 输入助手（dsh-composer-assistant）

给 DeepSeek Harness 的输入框加一层“下一句”能力：**下一句预测、输入续写、提示词优化、草稿暂存**，
全部在本地输入框里完成，采纳后仍由你决定是否发送。

本包是 [`dsh-input-assistant`](https://github.com/Somnus678/dsh-input-assistant)（MIT）的增强 fork，
包名不同、可与之并存；原项目版权归原作者。

## 安装

```shell
dsh plugin --profile desktop add dsh-composer-assistant
```

或从本地压缩包安装：

```shell
dsh plugin --profile desktop add ./dist/dsh-composer-assistant-0.2.0.tgz
```

要求 DSH `>=0.2.1-rc.2 <0.3.0-0`（在 `0.2.1-rc.3` 上验证）。

## 功能

| 功能 | 说明 |
| --- | --- |
| 下一句预测 | 助手回复结束后，在空输入框里给出你下一句最可能说的话；`Tab` 采纳、`Esc` 忽略 |
| 输入续写 | 按当前草稿与光标位置继续写；长建议放不下时自动改用浮动候选卡 |
| 提示词优化 | 把草稿或选中文字改写成可发送的表达；可查看 diff、一次性撤销、复制原文 |
| 草稿暂存 | 每个会话最多三份草稿，支持追加、替换、删除与清空 |
| 换一条 | 同一轮内对建议不满意可以重新要一条，不消耗新的轮次 |
| 检查更新 | 菜单里手动查询 npm 上的最新版本（只查版本号，不下载、不安装） |

## 快捷键

| 动作 | 按键 |
| --- | --- |
| 采纳建议 | `Tab` |
| 忽略建议 | `Esc` |
| 停止当前轮次 | 连按两次 `Esc`（DSH 原有行为，不受影响） |

`/` 命令菜单或 `@` 引用菜单打开时，`Tab` 归菜单所有，插件不会抢键；中文输入法组字期间不发请求。

## 设置

设置 → 输入助手，分「功能 / 优化 / 建议 / 辅助模型 / 高级」五组：

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `optimizeEnabled` / `nextEnabled` / `completionEnabled` / `stashEnabled` | 开 | 四个功能独立开关 |
| `optimizationStrength` | `standard` | 轻度润色 / 标准优化 / 深度梳理 |
| `optimizeMaxGrowth` | 3 | 改写结果相对原稿的最大倍数，超限拒绝并保留原稿 |
| `displayMode` | `ghost` | 灰字；超出可见高度自动转候选卡 |
| `nextTrigger` / `nextDelayMs` | `auto` / 0 | 自动或手动触发；自动模式下的延迟 |
| `maxNextChars` / `maxCompletionChars` | 120 / 80 | 建议长度上限 |
| `temperature` / `reasoningEffort` | 0.7 / 空 | 采样温度；推理档留空取模型最低档 |
| `extraInstruction` | 空 | 追加到系统提示词的额外要求（≤500 字） |
| `provider` / `model` | 空 | 辅助模型；留空跟随输入框 |
| `debounceMs` / `minIntervalMs` | 600 / 2000 | 续写防抖与请求间隔 |
| `maxHistoryChars` / `maxDraftChars` | 16000 / 8000 | 上下文与草稿上限 |
| `optimizeTimeoutMs` / `suggestionTimeoutMs` | 60000 / 15000 | 超时 |

提示气泡：信息类 6 秒、错误类 10 秒自动消失，点击或 `Esc` 立即关闭。

## 升级

DSH 目前**没有第三方插件的自动更新**，也没有版本选择器。升级方式：

1. 插件管理里卸载 `dsh-composer-assistant`，再重新安装（会装到 npm 上的最新版）；
2. 或命令行：

```shell
dsh plugin --profile desktop remove dsh-composer-assistant
dsh plugin --profile desktop add dsh-composer-assistant
```

插件内「检查更新」只会告诉你 npm 上的最新版本号，不会替你安装。

## 已知限制

- 灰字只能渲染在输入框的可见区域内，更长的建议一律走候选卡
- IME 组字期间不发请求；真实中文输入法行为依赖浏览器与输入法，仓库只有单测覆盖
- 本地开发：仓库若位于 exFAT 卷，`pnpm` 无法建 store，请用 `./scripts/local-dev.sh`
  （同步到 APFS 临时目录构建，产物回写 `dist/`）

## 开发

```shell
pnpm typecheck
pnpm test          # Edge 主题测试需要本机安装 Microsoft Edge
pnpm build
pnpm pack --pack-destination dist
```

## 许可

MIT。本项目基于 `dsh-input-assistant`（作者 Somnus678 与贡献者）修改，保留原 MIT 许可与版权声明；
新增部分同样以 MIT 发布。
