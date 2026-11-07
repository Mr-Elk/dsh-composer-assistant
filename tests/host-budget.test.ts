import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import LlmRuntime from '@deepseek-ai/dsh-llm'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility, defineDomain, descriptorOf } from '@deepseek-ai/dsh-storage-domain'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { TypertGatewayService } from '@deepseek-ai/dsh-api-gateway'
import RemoteAccessService from '@deepseek-ai/dsh-api-remote-access'
import { Peer } from '@deepseek-ai/dsh-client-connection'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { build } from 'esbuild'
import * as plugin from '../src/index'
import { DEFAULT_CONFIG, type AssistantStatus, type GenerationRequest, type GenerationResult } from '../src/core/types'
import { createDomainSpec, createBudgetDomainSpec, type BudgetDomain } from '../src/host/storage'

const HOUR = 3_600_000
const cleanups: (() => Promise<void>)[] = []
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup() })

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

// Gates delay real operations; all services and records use official storage.
// Read/write failures below are actual filesystem errors, not a fake backend.
async function fixture(limit = 1, existingDirectory?: string,
  config: plugin.Config = { nextEnabled: true, completionEnabled: true, hourlyCallLimit: limit }) {
  const directory = existingDirectory ?? await mkdtemp(join(tmpdir(), 'dsh-budget-'))
  const budgetPath = join(directory, 'input_assistant_budget.json')
  const ctx = new Context()
  new TypertRegistry(ctx)
  new SessionStore(ctx)
  new SessionProjectionRegistry(ctx)
  new LlmRuntime(ctx) // No adapters or credentials: admitted attempts fail locally.
  new Storage(ctx)
  const backend = new JsonStorageBackend(directory)
  ctx.storage.backend.register('json', backend)
  const facility = new DomainFacility(ctx, { backend: 'json' })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  new RemoteAccessService(ctx)
  const gateway = new TypertGatewayService(ctx, {})
  const peer = new Peer(ctx, { principal: { kind: 'owner' } })
  const hooks: { beforeOpen?: () => Promise<void>; beforeWrite?: () => Promise<void> } = {}
  const open = backend.kv.open.bind(backend.kv)
  const budgetOpens = vi.fn()
  vi.spyOn(backend.kv, 'open').mockImplementation(async descriptor => {
    if (descriptor.name === 'input_assistant_budget') {
      budgetOpens()
      await hooks.beforeOpen?.()
    }
    const unit = await open(descriptor)
    if (descriptor.name === 'input_assistant_budget') {
      const put = unit.putRecord.bind(unit)
      vi.spyOn(unit, 'putRecord').mockImplementation(async (...args) => {
        await hooks.beforeWrite?.()
        await put(...args)
      })
    }
    return unit
  })
  const fiber = ctx.plugin(plugin, config)
  await fiber.await()
  const provider = vi.spyOn(ctx.llm, 'prepareCall') // Call through to the real runtime.
  const call = async <T>(method: string, data: unknown): Promise<T> => await gateway.invoke({
    namespace: 'input-assistant', method: 'call', args: { payload: { method, data } }, peer,
  }) as T
  let nextId = 0
  const request = async (): Promise<GenerationRequest> => {
    const id = `budget-${nextId++}`
    ctx.sessions.create(SessionId(id))
    const status = await call<AssistantStatus>('status', { sessionId: id })
    const draft = '请解释这段代码'
    return { requestId: id, sessionId: id, operation: 'complete', sourceTurnId: null,
      draft, draftRev: 1, span: { start: draft.length, end: draft.length, draftRev: 1 },
      connectionGeneration: status.generation, routeKey: JSON.stringify(['unconfigured', 'none']),
      provider: 'unconfigured', model: 'none' }
  }
  const generate = (input: GenerationRequest) => call<GenerationResult>('generate', input)
  const seed = async (calls: number[]) => {
    const unit = await open(descriptorOf(createBudgetDomainSpec()))
    try { await unit.putRecord('budget', 'global', { version: 1, calls }) }
    finally { await unit.close() }
  }
  const stored = async (): Promise<number[]> => JSON.parse(await readFile(budgetPath, 'utf8')).tables.budget.global.calls
  const budgetDomain = () => facility.get('input_assistant_budget') as BudgetDomain | undefined
  let stopped = false
  const stop = async () => {
    if (stopped) return
    stopped = true
    await fiber.dispose()
    await facility.closeAll()
    await backend.close()
    await ctx.fiber.dispose()
  }
  cleanups.push(async () => {
    await stop()
    if (!existingDirectory) await rm(directory, { recursive: true, force: true })
  })
  return { ctx, directory, budgetPath, facility, budgetDomain, hooks, budgetOpens,
    provider, request, generate, call, seed, stored, stop }
}

// The actual LLM runtime has no provider. Reaching it consumes a reservation
// without a paid call, and verifies conservative counting on model failure.
async function attempt(f: Awaited<ReturnType<typeof fixture>>, input?: GenerationRequest) {
  await expect(f.generate(input ?? await f.request())).rejects.toMatchObject({ details: { code: 'INPUT_ASSISTANT' } })
}

describe('automatic budget through the real plugin, Host, Domain and JSON backend', () => {
  it('starts with automatic suggestions off and a finite budget, leaving manual optimization available', async () => {
    const f = await fixture(1, undefined, {})
    expect(await f.call('settings/get', {})).toMatchObject({
      optimizeEnabled: true, nextEnabled: false, completionEnabled: false, hourlyCallLimit: 10,
    })
    expect(await f.generate(await f.request())).toMatchObject({ text: null })
    expect(f.provider).not.toHaveBeenCalled()
    await expect(readFile(f.budgetPath)).rejects.toMatchObject({ code: 'ENOENT' })
    await attempt(f, { ...await f.request(), operation: 'optimize' })
    expect(f.provider).toHaveBeenCalledTimes(1)
    await expect(readFile(f.budgetPath)).rejects.toMatchObject({ code: 'ENOENT' })
    await f.call('settings/set', { completionEnabled: true })
    await attempt(f)
    expect(f.provider).toHaveBeenCalledTimes(2)
    expect(await f.stored()).toHaveLength(1)
  })

  it('preserves existing opt-in and unlimited settings when reopening with the new defaults', async () => {
    const before = await fixture()
    await before.call('settings/set', { nextEnabled: true, completionEnabled: true, hourlyCallLimit: 0 })
    await attempt(before)
    await before.stop()
    const after = await fixture(1, before.directory, {})
    expect(await after.call('settings/get', {})).toMatchObject({
      nextEnabled: true, completionEnabled: true, hourlyCallLimit: 0,
    })
    await attempt(after)
    expect(await after.stored()).toHaveLength(2)
  })

  it('shares the first asynchronous open and preserves exhausted history under concurrency', async () => {
    const f = await fixture()
    await f.seed([Date.now()])
    const inputs = await Promise.all(Array.from({ length: 12 }, () => f.request()))
    const entered = deferred(), release = deferred()
    f.hooks.beforeOpen = async () => { entered.resolve(); await release.promise }
    const settled = Promise.all(inputs.map(input => f.generate(input)))
    try {
      await entered.promise
      await delay(10)
      expect(f.provider).not.toHaveBeenCalled()
      expect(f.budgetOpens).toHaveBeenCalledTimes(1)
    } finally { release.resolve() }
    expect((await settled).every(result => result.text === null)).toBe(true)
    expect(await f.stored()).toHaveLength(1)
    expect(f.budgetOpens).toHaveBeenCalledTimes(1)
  })

  it('admits exactly 20 of 48 concurrent sessions and never loses increments', async () => {
    const f = await fixture(20)
    const inputs = await Promise.all(Array.from({ length: 48 }, () => f.request()))
    const results = await Promise.allSettled(inputs.map(input => f.generate(input)))
    expect(f.provider).toHaveBeenCalledTimes(20)
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(20)
    expect(results.filter(result => result.status === 'fulfilled' && result.value.text === null)).toHaveLength(28)
    expect(await f.stored()).toHaveLength(20)
  })

  it.each([0, 1])('waits for durable persistence with %i existing calls', async count => {
    const f = await fixture(2)
    if (count) await attempt(f)
    f.provider.mockClear()
    const entered = deferred(), release = deferred()
    f.hooks.beforeWrite = async () => { entered.resolve(); await release.promise }
    const pending = attempt(f)
    try {
      await entered.promise
      expect(f.provider).not.toHaveBeenCalled()
      expect(f.budgetDomain()?.table('budget').get('global')?.calls.length ?? 0).toBe(count)
    } finally { release.resolve() }
    await pending
    expect(f.provider).toHaveBeenCalledTimes(1)
    expect(await f.stored()).toHaveLength(count + 1)
  })

  it('retains exhausted history across complete plugin/backend recreation', async () => {
    const before = await fixture(2)
    await before.call('settings/set', { hourlyCallLimit: 2 })
    await attempt(before)
    await attempt(before)
    await before.stop()
    const after = await fixture(2, before.directory)
    expect(await after.generate(await after.request())).toMatchObject({ text: null })
    expect(after.provider).not.toHaveBeenCalled()
    expect(await after.stored()).toHaveLength(2)
  })

  it('expires records exactly at the rolling-hour cutoff', async () => {
    const now = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
    const f = await fixture()
    await f.seed([now - HOUR, now - HOUR + 1])
    expect(await f.generate(await f.request())).toMatchObject({ text: null })
    expect(f.provider).not.toHaveBeenCalled()
    clock.mockReturnValue(now + 1)
    await attempt(f)
    expect(await f.stored()).toEqual([now + 1])
  })

  it('persists unlimited history above 2048 and applies a later finite limit after reopen', async () => {
    const before = await fixture(0)
    await before.seed(Array.from({ length: 2049 }, () => Date.now()))
    await attempt(before)
    expect(await before.stored()).toHaveLength(2050)
    await before.call('settings/set', { hourlyCallLimit: 20 })
    await before.stop()
    const after = await fixture(20, before.directory)
    expect(await after.generate(await after.request())).toMatchObject({ text: null })
    expect(after.provider).not.toHaveBeenCalled()
    expect(await after.stored()).toHaveLength(2050)
  })

  it('fails closed on a real read error, keeps manual actions available and retries the open', async () => {
    const f = await fixture()
    await mkdir(f.budgetPath)
    await attempt(f)
    expect(f.provider).not.toHaveBeenCalled()
    await attempt(f, { ...await f.request(), operation: 'optimize' })
    await attempt(f, { ...await f.request(), regenerate: true })
    expect(f.provider).toHaveBeenCalledTimes(2)
    expect(f.budgetOpens).toHaveBeenCalledTimes(1)
    await rm(f.budgetPath, { recursive: true })
    await attempt(f)
    expect(f.budgetOpens).toHaveBeenCalledTimes(2)
    expect(f.provider).toHaveBeenCalledTimes(3)
    expect(await f.stored()).toHaveLength(1)
  })

  it.each([0, 1])('recovers from a real failed write with %i existing calls without losing history', async count => {
    const f = await fixture(2)
    if (count) await attempt(f)
    f.provider.mockClear()
    f.hooks.beforeWrite = async () => {
      if (count) await rename(f.budgetPath, `${f.budgetPath}.saved`)
      await mkdir(f.budgetPath)
    }
    await attempt(f)
    expect(f.provider).not.toHaveBeenCalled()
    expect(f.budgetDomain()?.table('budget').get('global')?.calls.length ?? 0).toBe(count)
    f.hooks.beforeWrite = undefined
    await rm(f.budgetPath, { recursive: true })
    if (count) await rename(`${f.budgetPath}.saved`, f.budgetPath)
    await attempt(f)
    expect(f.provider).toHaveBeenCalledTimes(1)
    expect(await f.stored()).toHaveLength(count + 1)
  })

  it.each(['malformed', 'version', 'schema'])('does not reset %s budget data on open failure', async failure => {
    const f = await fixture()
    await f.seed([Date.now()])
    const good = await readFile(f.budgetPath, 'utf8')
    const document = JSON.parse(good)
    if (failure === 'version') document.unit.version += 1
    if (failure === 'schema') document.tables.budget.global.calls = ['invalid']
    const bad = failure === 'malformed' ? '{broken' : JSON.stringify(document)
    await writeFile(f.budgetPath, bad)
    await attempt(f)
    expect(f.provider).not.toHaveBeenCalled()
    expect(await readFile(f.budgetPath, 'utf8')).toBe(bad)
    expect(await f.call('settings/get', {})).toMatchObject({ hourlyCallLimit: 1 })
    await writeFile(f.budgetPath, good)
    expect(await f.generate(await f.request())).toMatchObject({ text: null })
    expect(f.provider).not.toHaveBeenCalled()
  })

  it('cancels during persistence without starting a late model call', async () => {
    const f = await fixture()
    const entered = deferred(), release = deferred()
    f.hooks.beforeWrite = async () => { entered.resolve(); await release.promise }
    const input = await f.request()
    const pending = expect(f.generate(input)).rejects.toMatchObject({ details: { code: 'CANCELLED' } })
    try {
      await entered.promise
      expect(await f.call('cancel', { sessionId: input.sessionId, requestId: input.requestId })).toEqual({ cancelled: true })
      await pending
      expect(f.provider).not.toHaveBeenCalled()
    } finally { release.resolve() }
    await f.stop()
    expect(await f.stored()).toHaveLength(1)
    const after = await fixture(1, f.directory)
    expect(await after.generate(await after.request())).toMatchObject({ text: null })
    expect(after.provider).not.toHaveBeenCalled()
  })

  it('drains an in-flight reservation on shutdown and blocks after reopen', async () => {
    const f = await fixture()
    const entered = deferred(), release = deferred()
    f.hooks.beforeWrite = async () => { entered.resolve(); await release.promise }
    const pending = expect(f.generate(await f.request())).rejects.toMatchObject({ details: { code: 'CANCELLED' } })
    let stopping: Promise<void> | undefined
    try {
      await entered.promise
      stopping = f.stop()
      await pending
      expect(f.provider).not.toHaveBeenCalled()
    } finally { release.resolve(); await stopping }
    expect(await f.stored()).toHaveLength(1)
    const after = await fixture(1, f.directory)
    expect(await after.generate(await after.request())).toMatchObject({ text: null })
    expect(after.provider).not.toHaveBeenCalled()
  })

  it('does not reserve for a request cancelled while queued behind another write', async () => {
    const f = await fixture(2)
    const entered = deferred(), release = deferred()
    f.hooks.beforeWrite = async () => { entered.resolve(); await release.promise }
    const first = attempt(f)
    let second: Promise<void> | undefined
    try {
      await entered.promise
      const input = await f.request()
      second = expect(f.generate(input)).rejects.toMatchObject({ details: { code: 'CANCELLED' } })
      await delay(10)
      expect(await f.call('cancel', { sessionId: input.sessionId })).toEqual({ cancelled: true })
      await second
    } finally { release.resolve(); await first; await second }
    await f.stop()
    expect(await f.stored()).toHaveLength(1)
    expect(f.provider).toHaveBeenCalledTimes(1)
  })

  it('times out a storage wait without a late call after persistence completes', async () => {
    const f = await fixture()
    await f.call('settings/set', { suggestionTimeoutMs: 5000 })
    const entered = deferred(), release = deferred()
    f.hooks.beforeWrite = async () => { entered.resolve(); await release.promise }
    const pending = expect(f.generate(await f.request())).rejects.toMatchObject({ details: { code: 'TIMEOUT' } })
    try { await entered.promise; await pending }
    finally { release.resolve() }
    await f.stop()
    expect(f.provider).not.toHaveBeenCalled()
    expect(await f.stored()).toHaveLength(1)
  })

  it('keeps version-1 settings and drafts unchanged and readable by the old spec', async () => {
    const f = await fixture()
    const spec = createDomainSpec(DEFAULT_CONFIG)
    expect(spec.version).toBe(1)
    expect(Object.keys(spec.tables)).toEqual(['drafts'])
    const old = await f.facility.open(spec)
    await old.global.set({ version: 1, settings: { ...DEFAULT_CONFIG, nextEnabled: true, completionEnabled: true, hourlyCallLimit: 1, language: 'en' } })
    await old.table('drafts').put('legacy', { version: 1, drafts: [{ id: 'saved', text: '保留的草稿', createdAt: Date.now() }] })
    await old.close()
    const settingsPath = join(f.directory, 'input_assistant', 'global.json')
    const draftPath = join(f.directory, 'input_assistant', 'drafts', 'legacy.json')
    const settings = await readFile(settingsPath, 'utf8'), draft = await readFile(draftPath, 'utf8')
    // Also check the original PR's no-version-bump table addition against the
    // actual backend. It is additive-compatible; silent read failures, rather
    // than migration, are why the final budget uses its own strict domain.
    const additive = defineDomain({ ...spec, tables: { ...spec.tables, ...createBudgetDomainSpec().tables } })
    const upgraded = await f.facility.open(additive)
    expect(upgraded.table('drafts').get('legacy')?.drafts[0].text).toBe('保留的草稿')
    expect(upgraded.table('budget').get('global')).toBeUndefined()
    await upgraded.table('budget').put('global', { version: 1, calls: [] })
    await upgraded.close()
    expect(await f.call('settings/get', {})).toMatchObject({ hourlyCallLimit: 1, language: 'en' })
    await attempt(f)
    await f.stop()
    const ctx = new Context()
    new Storage(ctx)
    const backend = new JsonStorageBackend(f.directory)
    ctx.storage.backend.register('json', backend)
    const facility = new DomainFacility(ctx, { backend: 'json' })
    try {
      const reopened = await facility.open(spec)
      expect(reopened.table('drafts').get('legacy')?.drafts[0].text).toBe('保留的草稿')
      expect(await readFile(settingsPath, 'utf8')).toBe(settings)
      expect(await readFile(draftPath, 'utf8')).toBe(draft)
    } finally { await facility.closeAll(); await backend.close(); await ctx.fiber.dispose() }
  })

  it('persists before immediate process exit without a close hook', async () => {
    const f = await fixture()
    const parent = resolve('.test-runtime')
    await mkdir(parent, { recursive: true })
    const directory = await mkdtemp(join(parent, 'budget-process-'))
    const worker = join(directory, 'worker.mjs')
    try {
      await build({ stdin: { resolveDir: process.cwd(), contents: `
        import { Context } from '@deepseek-ai/cordis'
        import Storage from '@deepseek-ai/dsh-storage'
        import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
        import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
        import { AutomaticCallBudget, createBudgetDomainSpec } from './src/host/storage.ts'
        const ctx = new Context(); new Storage(ctx)
        ctx.storage.backend.register('json', new JsonStorageBackend(process.argv[2]))
        const facility = new DomainFacility(ctx, { backend: 'json' })
        let opened
        const budget = new AutomaticCallBudget(() => opened ??= facility.open(createBudgetDomainSpec()))
        const allowed = await budget.allow(1, new AbortController().signal)
        console.log(JSON.stringify({ allowed }))
        process.exit(0)
      ` }, bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: worker })
      const run = promisify(execFile)
      const first = await run(process.execPath, [worker, f.directory])
      const second = await run(process.execPath, [worker, f.directory])
      expect(JSON.parse(first.stdout)).toEqual({ allowed: true })
      expect(JSON.parse(second.stdout)).toEqual({ allowed: false })
      expect(await f.stored()).toHaveLength(1)
    } finally { await rm(directory, { recursive: true, force: true }) }
  })
})
