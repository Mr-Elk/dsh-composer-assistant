# 本地改造计划（local/0.2）

本文件记录我们对 `dsh-input-assistant` 的本地改造范围与验收约定。上游仓库保持只读，
所有改动提交在 `local/0.2` 分支，不向上游推送。

## 上游快照

| 项 | 值 |
| --- | --- |
| 仓库 | `Somnus678/dsh-input-assistant` |
| 基线提交 | `f35f8bf`（2026-10-24 13:33Z） |
| 版本 | 0.1.3（npm 同日发布） |
| 活跃度 | 5 个 commit、1 位贡献者、0 issue、0 PR；10-24 之后无提交 |
| 许可 | MIT，允许 fork 与再分发（保留版权声明） |
| 目标 DSH | `>=0.2.1-rc.2 <0.3.0-0`，本地实测 0.2.1-rc.3 |

结论：上游没有并行开发，不存在 rebase 冲突风险；我们按自己的节奏推进，需要时
`git fetch upstream` 合并。

## 已完成

- 克隆到 `input-assistant/`，清理 macOS 在 exFAT 卷上生成的 `._*` 文件并加入 `.gitignore`
- `origin` 改名为 `upstream`，新建工作分支 `local/0.2`
- 记录了当前安装态的临时补丁（提示词与 token 预算），改造后由源码取代

## 判断

上游能用的部分在 `src/core`：保护逻辑（代码块 / 路径 / URL / 锁定片段）、diff、
调度与取消、失败不丢稿。问题集中在 `src/browser`：

1. 全部自绘 CSS，未使用 `@deepseek-ai/dsh-client-ui-primitives`，与 DSH 原生控件不是一套语言
2. 灰字 `position:fixed` 贴 caret 且 `max-height:3lh` 截断，长建议会被切
3. 按钮组塞在 `conversation.input.right`，与模型选择、发送挤同一行
4. 设置页只有 4 开关 + 2 下拉 + 8 数字
5. 提示词把建议压得很短，且示例清一色十字以内

## 阶段

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| P0 基线 | 跑通 `pnpm install / typecheck / test / build / pack`，打出本地 tgz 装进 desktop profile | 功能与上游等价，121 条测试通过 |
| P1 交互与视觉 | 灰字贴合行高且不截断、按钮组收敛为单一入口、菜单与优化面板改用 primitives、设置页重排、深浅色 | 浅/深色截图；无遮挡、不闪烁；IME 与 `/` `@` 菜单不抢 Tab |
| P2 设置扩容 | 候选条数、触发时机、温度/推理档、自定义指令、快捷键、流式开关 | 每项都有持久化、范围校验与非法值回退 |
| P3 质量 | 提示词、长度策略、弃权率、优化保真 | 固定样例前后对比；不弱化 `protection` |
| P4 可选 | 从稳定改动中拆 1–2 个小 PR 回上游 | 先开 issue 征询，PR 附前后截图与测试 |

## 待决

- 包名：沿用 `dsh-input-assistant` 覆盖安装，还是改名（如 `dsh-composer-assist`）与上游并存
- 交互范式：保持“灰字 + Tab”，还是改为“建议卡片 + Tab”
- P2 设置项清单的最终取舍

## 命令

```shell
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm pack --pack-destination dist
dsh plugin --profile desktop add ./dist/dsh-input-assistant-<version>.tgz
```
