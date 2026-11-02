import { describe, expect, it } from 'vitest'
import { BrowserRuntime } from '../src/browser/runtime'

describe('browser runtime i18n', () => {
  it('localizes its disconnected-save fallback', async () => {
    const runtime = new BrowserRuntime({
      generation: { getSnapshot: () => undefined, subscribe: () => () => {} },
      rpc: { call: async () => ({ ok: false as const, error: { code: 'unknown', message: '' } }) },
    }, undefined, () => 'en')
    await expect(runtime.saveSettings({ nextEnabled: false })).rejects.toThrow('Connection lost. Reconnect before saving.')
    runtime.dispose()
  })
})
