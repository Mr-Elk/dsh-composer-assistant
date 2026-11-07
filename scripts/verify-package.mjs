import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const manifest = JSON.parse(await readFile('package.json', 'utf8'))
const expected = resolve(`dist/${manifest.name}-${manifest.version}.tgz`)
const archive = resolve(process.argv[2] ?? expected)
assert.ok(existsSync(archive), `Missing ${archive}; run pnpm pack --pack-destination dist first`)

const tar = gunzipSync(await readFile(archive))
const entries = new Map()
for (let offset = 0; offset + 512 <= tar.length;) {
  const header = tar.subarray(offset, offset + 512)
  if (header.every(byte => byte === 0)) break
  const name = header.subarray(0, 100).toString().replace(/\0.*$/, '')
  const size = parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim(), 8) || 0
  entries.set(name, tar.subarray(offset + 512, offset + 512 + size))
  offset += 512 + Math.ceil(size / 512) * 512
}
for (const path of ['package/package.json', 'package/cordis.patch.yml', 'package/lib/index.js', 'package/lib/index.d.ts', 'package/lib/client.js', 'package/lib/core.js', 'package/README.md', 'package/README.en.md', 'package/LICENSE']) assert.ok(entries.has(path), `Missing ${path}`)
assert.ok(![...entries.keys()].some(path => /node_modules|\.research|evaluation\/cases/.test(path)), 'Research/runtime/evaluation fixtures must not ship')

// Compare the packed output with this build, so an older same-version archive
// cannot pass just because its entry points still load.
for (const [path, bytes] of entries) {
  const local = path.replace(/^package\//u, '')
  if (local.startsWith('lib/') || ['README.md', 'README.en.md', 'LICENSE', 'cordis.patch.yml'].includes(local) || local.startsWith('docs/')) {
    assert.ok(bytes.equals(await readFile(local)), `Packed file differs from this build: ${local}`)
  }
}

const pkg = JSON.parse(entries.get('package/package.json').toString('utf8'))
assert.equal(pkg.name, manifest.name)
assert.equal(pkg.version, manifest.version)
assert.equal(pkg.engines.dsh, '>=0.2.1-rc.2 <0.3.0-0')
assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')

let module
vm.runInNewContext(entries.get('package/lib/client.js').toString('utf8'), { window: { __ModuleLoader__: { load: value => { module = value } } } })
assert.equal(module.id, manifest.name)
const require = createRequire(import.meta.url)
const client = module.factory(id => require(id))
assert.equal(typeof client.apply, 'function')
assert.equal(typeof client.name, 'string')

// Import the host entry from the archive itself, not from the working tree.
await mkdir('.test-runtime', { recursive: true })
const root = await mkdtemp(join('.test-runtime', 'verify-package-'))
try {
  for (const [path, bytes] of entries) {
    const target = join(root, path.replace(/^package\//u, ''))
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, bytes)
  }
  const host = await import(pathToFileURL(join(root, 'lib/index.js')).href)
  assert.equal(typeof host.apply, 'function')
  assert.equal(typeof host.name, 'string')
  const core = await import(pathToFileURL(join(root, 'lib/core.js')).href)
  assert.equal(core.PLUGIN_VERSION, manifest.version)
  assert.equal(core.DEFAULT_CONFIG.optimizeEnabled, true)
  assert.equal(core.DEFAULT_CONFIG.nextEnabled, false)
  assert.equal(core.DEFAULT_CONFIG.completionEnabled, false)
  assert.equal(core.DEFAULT_CONFIG.hourlyCallLimit, 10)
  const defaults = host.Config({})
  assert.equal(defaults.nextEnabled, false)
  assert.equal(defaults.completionEnabled, false)
  assert.equal(defaults.hourlyCallLimit, 10)
} finally {
  await rm(root, { recursive: true, force: true })
}

process.stdout.write(`PASS ${archive}: required files, version, current build bytes, isolated DSH client factory, host/core import and opt-in defaults from archive.\n`)
