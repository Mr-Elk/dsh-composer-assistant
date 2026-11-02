/** Browser fixture for the production settings section: real React surface, local RPC mock. */
import { createRoot } from 'react-dom/client'
import type { ComponentProps } from 'react'
import { AssistantSettings } from '../../src/browser/settings'
import { BrowserRuntime } from '../../src/browser/runtime'
import { DEFAULT_CONFIG, type AssistantConfig, type ModelCatalog } from '../../src/core/types'
import { STYLE_TEXT } from '../../src/browser/styles'

const params = new URLSearchParams(location.search)
let settings: AssistantConfig = {
  ...DEFAULT_CONFIG,
  nextEnabled: true,
  completionEnabled: true,
  language: 'follow',
}
const catalog: ModelCatalog = {
  models: [
    { provider: 'deepseek', providerName: 'DeepSeek', model: 'v4.1-flash', name: 'DeepSeek V4.1 Flash' },
    { provider: 'deepseek', providerName: 'DeepSeek', model: 'v4.1-pro', name: 'DeepSeek V4.1 Pro' },
  ],
  failures: [],
}
let generation = { id: 1 }
const connection = {
  generation: { getSnapshot: () => generation, subscribe: () => () => {} },
  rpc: {
    async call(_channel: string, _endpoint: string, envelope: any) {
      const { method, data } = envelope.args.payload
      let value: any
      switch (method) {
        case 'settings/get': value = settings; break
        case 'settings/set': settings = { ...settings, ...data }; value = settings; break
        case 'models/list': value = catalog; break
        default: throw new Error(`Unknown fixture method ${method}`)
      }
      return { ok: true as const, value }
    },
  },
}
const runtime = new BrowserRuntime(connection, undefined, params.get('lang') === 'en' ? () => 'en' : undefined)
const root = createRoot(document.getElementById('root')!)
root.render(<AssistantSettings {...{ runtime, close() {} } as ComponentProps<typeof AssistantSettings>} />)
document.getElementById('styles')!.textContent = STYLE_TEXT
Object.assign(window, { fixture: { runtime, settings: () => settings, setDark: (dark: boolean) => { document.body.toggleAttribute('data-ds-dark-theme', dark) } } })
