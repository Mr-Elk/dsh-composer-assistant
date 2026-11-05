#!/bin/sh
# 本地开发构建：本仓库位于 exFAT 卷，pnpm 无法在此建立 store 与符号链接，
# 因此把源码同步到 APFS 临时目录再构建，产物回写到仓库 dist/。
set -e
src=$(cd "$(dirname "$0")/.." && pwd)
build=${DSH_IA_BUILD:-/tmp/dsh-input-assistant-build}
mkdir -p "$build"
rsync -a --delete --exclude .git --exclude node_modules --exclude dist --exclude '._*' "$src"/ "$build"/
cd "$build"
# The lockfile can add dependencies even when node_modules already exists.
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
mkdir -p dist "$src/dist"
pnpm pack --pack-destination dist >/dev/null
if [ "${SKIP_EDGE:-0}" = "1" ]; then
  pnpm exec vitest run --exclude tests/browser-theme.test.ts
else
  pnpm test
fi
pnpm test:package
ver=$(node -p "JSON.parse(require('fs').readFileSync('package.json')).version")
name=$(node -p "JSON.parse(require('fs').readFileSync('package.json')).name")
cp "dist/$name-$ver.tgz" "$src/dist/"
echo "built: $src/dist/$name-$ver.tgz"
