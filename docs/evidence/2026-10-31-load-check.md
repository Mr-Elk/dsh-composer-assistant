# 载入验证：隔离 profile 实跑（2026-10-31）

目的：不重启用户正在使用的桌面实例，验证 0.2.0-local.3 能随 profile 组合、启动并对外提供客户端包。

## 方法

1. 复制 `~/.dsh/profiles/desktop` 到 `/tmp/dsh-verify-home/profiles/verify`，profile 名改为 `dsh-profile-verify`
2. `DSH_HOME=/tmp/dsh-verify-home dsh --profile verify --dump-config`：检查层叠结果
3. `DSH_HOME=/tmp/dsh-verify-home dsh --profile verify --port 0 --no-open --host 127.0.0.1`：实跑
4. 用启动时打印的 token 换 cookie，抓取 boot 页与客户端包

## 结果

组合后的配置（节选）：

```yaml
# == dsh-input-assistant, patched by .../cordis.patch.yml
- id: input-assistant
  name: dsh-input-assistant
  disabled: true
# == dsh-composer-assist, patched by .../cordis.patch.yml
- id: composer-assist
  name: dsh-composer-assist
  config:
    maxNextChars: 300
    maxCompletionChars: 200
    suggestionTimeoutMs: 20000
```

服务启动：`dsh web: http://127.0.0.1:52848/?token=…`（端口 0 由系统分配）

boot 清单同时满足两点：

- 含 `dsh-composer-assist/client.js`
- **不含** `dsh-input-assistant`（上游被 disabled）

客户端包（HTTP 200）：

- 大小 102354 字节
- SHA-256 `267e9d92fd3d759882796c6b266dcfbb1a03ef8b5b33178c256592f884cf275c`
- 与安装目录 `lib/client.js` 的 SHA-256 `1c7d166c28dfa2f9d7a5889d4770f62964879f6cfc848f1ce5ceed304cad9714` 一致
- 头部为 `window.__ModuleLoader__.load({id:"dsh-composer-assist",…`

## 未覆盖

该实例只证明“能被加载并对外提供”。真实交互（灰字位置、候选卡切换、深浅色、IME、Tab 与
`/` `@` 菜单共存、一次撤销）仍需在桌面实例里人工验收。
