# DSH 输入助手（dsh-composer-assistant）

给 DeepSeek Harness 的输入框加一层“下一句”能力：**下一句预测、输入续写、提示词优化**，
全部在本地输入框里完成，采纳后仍由你决定是否发送。

本包是 [`dsh-input-assistant`](https://github.com/Somnus678/dsh-input-assistant)（MIT）的增强 fork，
包名不同、可与之并存；原项目版权归原作者。

## 安装

```shell
# 0.3.0 发布后可用
dsh plugin --profile desktop add dsh-composer-assistant
```

或从本地压缩包安装：

```shell
dsh plugin --profile desktop add ./dist/dsh-composer-assistant-0.3.0.tgz
```

要求 DSH `>=0.2.1-rc.2 <0.3.0-0`（在 `0.2.1-rc.5` 上验证）。

## 功能

| 功能 | 说明 |
| --- | --- |
| 下一句预测 | 助手回复结束后，在空输入框里给出你下一句最可能说的话；`Tab` 采纳、`Esc` 忽略 |
| 输入续写 | 按当前草稿与光标位置继续写；长建议放不下时自动改用浮动候选卡 |
| 提示词优化 | 把草稿或选中文字改写成可发送的表达；可查看 diff、一次性撤销、复制原文 |
| 换一条 | 同一轮内对建议不满意可以重新要一条，不消耗新的轮次 |

## 快捷键

| 动作 | 按键 |
| --- | --- |
| 采纳建议 | `Tab` |
| 忽略建议 | `Esc` |
| 停止当前轮次 | 连按两次 `Esc`（DSH 原有行为，不受影响） |

`/` 命令菜单或 `@` 引用菜单打开时，`Tab` 归菜单所有，插件不会抢键；中文输入法组字期间不发请求。

## 设置

设置 → 输入助手，按通用、功能、建议、优化、辅助模型和高级分组；能判断的才露出，实现参数保持默认：

| 分组 | 项 | 默认 | 说明 |
| --- | --- | --- | --- |
| 通用 | 语言 | 跟随 DSH | 跟随 DSH / 中文 / English |
| 功能 | 提示词优化 / 回复后预测 / 输入续写 | 开 | 三个功能独立开关 |
| 建议 | 建议长度 | 标准 | 短 / 标准 / 长，内部映射为字符上限 |
| 优化 | 优化强度 | 标准 | 轻度润色 / 标准优化 / 深度梳理 |
| 辅助模型 | 模型 | 跟随输入框 | 从 DSH 模型列表选；辅助调用单独计费 |
| 高级 | 上下文上限 | 16000 | 参与建议的对话上下文字数 |
| 高级 | 建议超时 | 15 秒 | 5–60 秒，慢模型可放宽 |
| 高级 | 每小时调用上限 | 0 | 全局上限，只计自动建议；0 不限制，手动优化与「换一条」不计入 |
| 高级 | 温度 | 0.7 | 0.3 稳定 / 0.7 平衡 / 1.0 发散 |
| 高级 | 额外指令 | 空 | 追加到系统提示词，≤500 字 |

以下参数**不暴露**，由代码固定：续写防抖 600ms、最小请求间隔 2s、
草稿上限 8000 字、改写增长上限 3×、推理档自动取最低。

输入框旁是 `✦ 优化` + `⚙`：齿轮只放三项设置（回复后预测、输入续写、建议长度），完整设置仍走 DSH 设置。保护选中、查看改动、撤销、复制原文、换一条这类一次性动作在输入区就地出现。
提示气泡：信息类 6 秒、错误类 10 秒自动消失，点击或 `Esc` 立即关闭。

第一次打开输入框会出现一次入门提示，指向 `✦ 优化` 和 `⚙`；点“知道了”、`Esc` 或点外面关闭，之后不再出现。

## 升级

DSH 目前**没有第三方插件的自动更新**，也没有版本选择器。升级方式：

1. 插件管理里卸载 `dsh-composer-assistant`，再重新安装（会装到 npm 上的最新版）；
2. 或命令行：

```shell
dsh plugin --profile desktop remove dsh-composer-assistant
dsh plugin --profile desktop add dsh-composer-assistant
```

DSH 目前没有第三方插件的自动更新。升级请在侧边栏「插件」里更新，或使用上面的命令行；更新后重启 DSH。

### 回滚

1. 先卸载当前版本：
   `dsh plugin --profile desktop remove dsh-composer-assistant`
2. 安装上一版压缩包或指定版本：
   `dsh plugin --profile desktop add /path/to/dsh-composer-assistant-<上一版>.tgz`
3. 重启 DSH。设置保存在本地，回滚不会清掉设置；从 v4 回到 v3 时，新键会被旧版忽略。

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
