#!/usr/bin/env node
/**
 * Publish gate: catches the failure mode we actually hit — publishing a tarball
 * without `lib/` because the build output lives outside git.
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const fail = (message) => { process.stderr.write(`publish blocked: ${message}\n`); process.exit(1) }
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const problems = []

if (!pkg.name || pkg.private === true) problems.push('package.json 缺少公开的 name，或仍标记为 private')
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version)) problems.push(`版本号不是有效 semver：${pkg.version}`)
if (pkg.version.includes('-local')) problems.push('本地预发布版本不能直接发布，先改为正式版本')
if (pkg.license !== 'MIT') problems.push('LICENSE 不是 MIT，与仓库声明不一致')
if (!pkg.dsh?.bundle?.patch) problems.push('缺少 dsh.bundle.patch，插件无法作为 bundle 安装')
if (!pkg.dsh?.client?.platform) problems.push('缺少 dsh.client.platform，浏览器半侧不会被加载')
if (!existsSync('cordis.patch.yml')) problems.push('缺少 cordis.patch.yml')

for (const file of ['lib/index.js', 'lib/index.d.ts', 'lib/client.js', 'lib/core.js', 'README.md', 'LICENSE']) {
  if (!existsSync(file)) problems.push(`缺少发布所需文件：${file}`)
}
if (existsSync('lib/client.js')) {
  const client = await readFile('lib/client.js', 'utf8')
  if (!client.includes(`id:"${pkg.name}"`)) problems.push(`lib/client.js 的模块 id 与包名 ${pkg.name} 不一致`)
}

const versionSource = await readFile('src/core/version.ts', 'utf8').catch(() => '')
const declared = /PLUGIN_VERSION = '([^']+)'/.exec(versionSource)?.[1]
if (declared !== pkg.version) problems.push(`src/core/version.ts 的版本 ${declared ?? '缺失'} 与 package.json ${pkg.version} 不一致`)

const files = pkg.files ?? []
for (const required of ['lib', 'cordis.patch.yml', 'README.md', 'LICENSE']) {
  if (!files.includes(required)) problems.push(`package.json 的 files 未包含 ${required}`)
}

if (problems.length) {
  process.stderr.write(problems.map(problem => `  - ${problem}`).join('\n') + '\n')
  fail('先补齐上面的项目；发布前请运行 `./scripts/local-dev.sh` 或 `pnpm build` 生成 lib/')
}
process.stdout.write(`publish check OK: ${pkg.name}@${pkg.version}（lib/ 已就绪，版本一致）\n`)
