#!/bin/sh
# 本地开发构建：本仓库位于 exFAT 卷，pnpm 无法在此建立 store 与符号链接，
# 因此把源码同步到 APFS 临时目录再构建，产物回写到仓库 dist/。
set -e
src=$(cd "$(dirname "$0")/.." && pwd)
build=${DSH_IA_BUILD:-/tmp/dsh-input-assistant-build}
mkdir -p "$build"
rsync -a --delete --exclude .git --exclude node_modules --exclude dist --exclude '._*' "$src"/ "$build"/
[ -d "$build/node_modules" ] || (cd "$build" && pnpm install --frozen-lockfile)
cd "$build"
pnpm typecheck
if [ "${SKIP_EDGE:-0}" = "1" ]; then
  pnpm exec vitest run --exclude tests/browser-theme.test.ts
else
  pnpm test
fi
pnpm build
mkdir -p dist "$src/dist"
pnpm pack --pack-destination dist >/dev/null
cp dist/*.tgz "$src/dist/"
echo "built: $(ls -1t "$src"/dist/*.tgz | head -1)"
