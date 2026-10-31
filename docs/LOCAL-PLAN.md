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

## P0 结果（2026-10-31）

链路已跑通，全部在 APFS 临时目录执行：

| 步骤 | 结果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 通过，16s |
| `pnpm typecheck` | 通过，无输出 |
| `pnpm test` | 115 passed / 6 skipped；仅 `tests/browser-theme.test.ts` 失败，原因是本机未安装 Microsoft Edge（`channel: 'msedge'`） |
| `pnpm build` | 通过，产出 host ESM + core ESM + `lib/client.js` |
| `pnpm pack` | 产出 `dist/dsh-input-assistant-0.1.3.tgz`（96 KB） |
| `node scripts/verify-package.mjs` | PASS：包内容、隔离模块工厂、host import、版本与 bundle 元数据均通过 |

### 构建环境限制

本仓库位于 exFAT 卷（`/Volumes/湛盘`）：pnpm 在此无法建立 store，
`pnpm install` 直接报 `unable to open database file`。因此本地构建统一走
`scripts/local-dev.sh` —— 把源码同步到 `/tmp/dsh-input-assistant-build` 再安装、
校验、测试与打包，tgz 回写到仓库 `dist/`。可用 `DSH_IA_BUILD` 改临时目录，
`SKIP_EDGE=1` 跳过依赖 Edge 的主题测试。

## 命名与版本（2026-10-31 决定）

- 包名改为 `dsh-composer-assist`，版本从 `0.2.0-local.0` 起，与上游 `dsh-input-assistant` 并存
- 同步改了模块 id、`cordis.patch.yml` 条目 id/name、`scripts/build.mjs`、`scripts/verify-package.mjs`、
  `tests/host-package.test.ts` 与 CI 产物名
- 内部 RPC 命名空间仍为 `input-assistant/*`，插件加载时会用 profile patch 禁用上游条目，避免两个
  实例同时注册槽位与发起模型请求
- 把先前打在安装包上的临时补丁（提示词放宽、`maxOutputTokens` 512/384）回收到
  `src/core/generation.ts`，之后由源码维护

验证：`SKIP_EDGE=1 scripts/local-dev.sh` → 115 passed / 1 skipped、构建成功；
`node scripts/verify-package.mjs` → PASS（`dsh-composer-assist-0.2.0-local.0.tgz`）。

### 灰字长度是物理限制

`measureGhost` 只量出光标到可见区域底部的空间，composer 不随内容长高，所以内联灰字最多显示
一两屏以内的几行；再长就必须截断或改用候选面板。这一点要在 P1 里正面设计，而不是单纯放大
`max-height`。

## P1 第一刀（2026-10-31）

- **设置页**：去掉与分区标题重复的 `<h2>`，改成「功能 / 优化 / 辅助模型 / 高级」四组行式布局；
  开关改为 DSH 风格的轨道开关，数字字段右对齐并带范围提示，保存条固定在底部
- **入口按钮**：去掉两个带边框的方按钮，改为无边框、悬停出底、26px 高的紧凑控件；保留
  「优化」与「输入助手菜单」两个可访问名，测试不受影响
- **灰字**：去掉 `min(3lh, …)` 的双重截断，改为按 `measureGhost` 量到的可见高度渲染，并在
  末尾加一个 `Tab` 键帽提示
- **菜单**：标题行改为左标题右说明，分区标题统一为 12px 次级色

验证：116 tests passed、`pnpm build` 成功、`verify-package` PASS；
包已装进 desktop profile（`dsh-composer-assist 0.2.0-local.0`），profile patch 里
`input-assistant` 置 `disabled: true`，`composer-assist` 配 `maxNextChars: 300`、
`maxCompletionChars: 200`、`suggestionTimeoutMs: 20000`。视觉待重启后由用户确认。

## P2 第一刀（2026-10-31，0.2.0-local.1）

设置里补了三项直接影响输出质量的旋钮，原先只能在代码里改：

| 键 | 默认 | 作用 |
| --- | --- | --- |
| `temperature` | 0.7 | 传给 `llm.prepareCall` 的采样温度，0 更稳定、1 更多变化 |
| `reasoningEffort` | 空 | 空 = 取该模型声明的最低档；填了且模型支持则用该档 |
| `extraInstruction` | 空 | 追加到系统提示词末尾的「额外要求」，上限 500 字 |

`reasoningEffort` 只在该模型声明过该档位时才生效，否则回落到最低档，避免把不认识的档位发给
适配器。`extraInstruction` 在三种操作（优化/预测/续写）里都会追加，设置页有独立文本域。

验证：typecheck 通过、**117 tests passed**、`verify-package` PASS；已覆盖安装为
`dsh-composer-assist@0.2.0-local.1`。

## P1 第二刀：灰字溢出转候选面板（0.2.0-local.2）

composer 不随内容长高，`measureGhost` 只能给出光标到可见区域底部的空间。现在灰字渲染后读自身的
`scrollHeight`，超过该空间就改用浮动候选卡（整段可读、带「采纳 / 忽略」），不再半截截断；
判定抽成 `ghostOverflows(scrollHeight, maxHeight)`，边界与 `NaN`（不可测量）在单测里固定。

验证：**118 tests passed**、`verify-package` PASS、已覆盖安装 `dsh-composer-assist@0.2.0-local.2`。

## P2 第二刀：换一条（0.2.0-local.3）

上游的下一句预测每个 turn 只请求一次（宿主 `state.lastNextTurn` 与浏览器 `nextTurns` 双重去重），
用户不满意时没有第二次机会。现在：

- 请求体新增 `regenerate?: boolean`，宿主见到它跳过 `lastNextTurn` 去重
- 浏览器 `regenerateSuggestion()` 清掉 `nextCache` / 完成缓存 / 失败键与当前 turn 的去重记录，
  按是否有草稿重新请求 `next` 或 `complete`
- 悬浮候选卡与助手菜单各有一个入口（「换一条」/「换一条建议」）

验证：**119 tests passed**（新增同 turn 二次请求用例）、`verify-package` PASS、已安装
`dsh-composer-assist@0.2.0-local.3`。
