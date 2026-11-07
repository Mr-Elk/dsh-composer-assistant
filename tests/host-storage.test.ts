import { describe, expect, it } from 'vitest'
import { AssistantStorage, type AssistantDomain } from '../src/host/storage'
import { DEFAULT_CONFIG } from '../src/core/types'

function fixture() {
  const records = new Map<string, unknown>()
  let global = { version: 1 as const, settings: { ...DEFAULT_CONFIG } }
  let fail = false
  const domain = {
    global: { get: () => global, set: async (value: typeof global) => { if (fail) throw new Error('disk full'); global = value } },
    table: () => ({
      get: (key: string) => records.get(key),
      put: async (key: string, value: unknown) => { if (fail) throw new Error('disk full'); records.set(key, structuredClone(value)) },
      delete: async (key: string) => { if (fail) throw new Error('disk full'); return records.delete(key) },
    }),
  } as unknown as AssistantDomain
  return { create: () => new AssistantStorage(async () => domain), fail: () => { fail = true } }
}

describe('stored settings transactions', () => {
  it('validates settings before committing and retains selected display mode on reopen', async () => {
    const f = fixture(), storage = f.create()
    await storage.updateSettings({ displayMode: 'panel', nextEnabled: false })
    await expect(storage.updateSettings({ debounceMs: 0 })).rejects.toMatchObject({ code: 'CONFIG_NUMBER', params: { field: 'debounceMs', min: 200, max: 5000 } })
    expect(await f.create().settings()).toMatchObject({ displayMode: 'panel', nextEnabled: false, debounceMs: 600 })
  })
})

describe('stored settings survive version drift', () => {
  /** A storage fixture seeded with an arbitrary persisted record. */
  function seeded(initial: unknown) {
    let global: { version: 1; settings: unknown } = { version: 1, settings: initial }
    const domain = {
      global: { get: () => global, set: async (value: typeof global) => { global = value } },
      table: () => ({ get: () => undefined, put: async () => {}, delete: async () => {} }),
    } as unknown as AssistantDomain
    return { storage: new AssistantStorage(async () => domain), read: () => global }
  }

  it('ignores an unknown key written by a different version instead of locking every endpoint', async () => {
    const f = seeded({ ...DEFAULT_CONFIG, futureFlag: true })
    const settings = await f.storage.settings()
    expect(settings.optimizeEnabled).toBe(true)
    expect('futureFlag' in settings).toBe(false)
  })

  it('rewrites a clean record on the next save so the bad key disappears', async () => {
    const f = seeded({ ...DEFAULT_CONFIG, futureFlag: true })
    const saved = await f.storage.updateSettings({ nextEnabled: false })
    expect(saved.nextEnabled).toBe(false)
    expect('futureFlag' in (f.read().settings as object)).toBe(false)
  })

  it('ignores a removed nextTrigger and defaults a missing language to follow', async () => {
    const { language: _language, ...legacy } = DEFAULT_CONFIG
    const f = seeded({ ...legacy, nextTrigger: 'manual' })
    const settings = await f.storage.settings()
    expect(settings.language).toBe('follow')
    expect('nextTrigger' in settings).toBe(false)
  })

  it('falls back per field for corrupted values while keeping the rest', async () => {
    const f = seeded({ ...DEFAULT_CONFIG, debounceMs: 'oops', optimizeEnabled: 'yes', suggestionLength: 'huge',
      nextEnabled: 'yes', completionEnabled: 1, hourlyCallLimit: -1, displayMode: 'panel' })
    const settings = await f.storage.settings()
    expect(settings.debounceMs).toBe(600)
    expect(settings.optimizeEnabled).toBe(true)
    expect(settings.suggestionLength).toBe('standard')
    expect(settings.displayMode).toBe('panel')
    expect(settings.nextEnabled).toBe(false)
    expect(settings.completionEnabled).toBe(false)
    expect(settings.hourlyCallLimit).toBe(10)
  })

  it('keeps a complete auxiliary model pair across save and reload', async () => {
    const f = seeded({ ...DEFAULT_CONFIG })
    const saved = await f.storage.updateSettings({ provider: 'fixture', model: 'model-a' })
    expect(saved.provider).toBe('fixture')
    expect(saved.model).toBe('model-a')
    const stored = f.read().settings as { provider?: string; model?: string }
    expect(stored.provider).toBe('fixture')
    expect(stored.model).toBe('model-a')
    expect(await f.storage.settings()).toMatchObject({ provider: 'fixture', model: 'model-a' })
  })
  it('drops a half-filled auxiliary model pair', async () => {
    const f = seeded({ ...DEFAULT_CONFIG, provider: 'only-provider', model: '' })
    expect(await f.storage.settings()).toMatchObject({ provider: '', model: '' })
  })

  it('still rejects unknown keys in an explicit patch', async () => {
    const f = seeded({ ...DEFAULT_CONFIG })
    await expect(f.storage.updateSettings({ legacyFlag: true } as never)).rejects.toMatchObject({ code: 'CONFIG_UNKNOWN' })
  })
})
