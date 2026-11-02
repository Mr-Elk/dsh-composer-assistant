# P6 发布准备状态（2026-11-02）

## Git

- 分支：`release/0.3.0`
- 提交：`38216f0 feat: 0.3.0 settings polish and i18n`
- 工作区：干净
- 远程：已添加 `origin`（`https://github.com/Somnus678/dsh-input-assistant.git`），未推送
- tag：尚未创建，等待最后一次真实宿主验收

## npm

- 登录用户：`alexlee1996`
- 包名：`dsh-composer-assistant`
- 版本：`0.3.0`
- `npm view`：404（尚未发布）
- `npm publish --dry-run`：通过，44 个文件，152.0 kB
- 没有执行发布

## 包

- 最终 tarball：`dist/dsh-composer-assistant-0.3.0.tgz`
- 已安装到桌面 profile
- 版本和 `repository` 元数据已确认

## 等待

- 重启桌面 DSH，加载最新的宿主端代码。
- 重启后做最后一次真实宿主验收：
  - 设置页、语言切换
  - 成功/恢复 toast
  - 错误在保存条上方
  - 齿轮弹窗内联说明
  - 44 × 24 SVG 开关
  - 保存/恢复默认/草稿恢复
- 验收通过后再创建 tag，最后才讨论 npm 发布。
