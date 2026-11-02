import { InputAssistantController, type BrowserTransport, type UsageMetrics } from './controller'
import type { AssistantConfig, ModelCatalog, ModelRoute } from '../core/types'
import { effectiveLanguage, resolveUiLocale, t, type MessageKey } from '../core/i18n'

export class InputAssistantRequestError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'InputAssistantRequestError' }
}

export interface ConnectionFace {
  rpc: { call(channel: string, endpoint: string, payload: unknown, signal?: AbortSignal): Promise<{ ok: true; value: unknown } | { ok: false; error: { code?: string; message?: string } }> }
  generation: { getSnapshot(): { id: number } | undefined; subscribe(listener: () => void): () => void }
}
export interface ModelDirectoryFace {
  directoryFor(sessionId: string): { store: { getSnapshot(): { current: { provider: string; model: string } | null }; subscribe(listener: () => void): () => void }; load(): Promise<unknown> }
}

export class BrowserRuntime {
  private entries = new Map<string, { controller: InputAssistantController; refs: number }>()
  private disposed = false
  private lifetime = new AbortController()
  private pendingSettings = 0
  private settingsQueue: Promise<void> = Promise.resolve()
  private language: AssistantConfig['language'] = 'follow'
  private metrics = new Map<string, UsageMetrics>()
  readonly transport: BrowserTransport
  private tr(key: MessageKey): string { return t(resolveUiLocale(effectiveLanguage(this.language), this.locale?.() ?? 'zh'), key) }
  constructor(readonly connection: ConnectionFace, readonly models?: ModelDirectoryFace, readonly locale?: () => string) {
    this.transport = {
      generation: () => { const generation = connection.generation.getSnapshot(); return generation ? String(generation.id) : null },
      call: async <T>(method: string, data: unknown, signal?: AbortSignal): Promise<T> => {
        const result = await connection.rpc.call('/api', 'input-assistant/call', { args: { payload: { method, data } } }, signal)
        if (!result.ok) throw new InputAssistantRequestError(result.error.code || 'unknown', result.error.message || this.tr('error.requestFailed'))
        return result.value as T
      },
    }
  }
  /** Current composer model, when a mounted session exposes one. */
  currentRoute(): ModelRoute | null {
    for (const entry of this.entries.values()) {
      const route = entry.controller.getSnapshot().status?.route
      if (route) return route
    }
    return null
  }
  /** Read-only DSH model catalog used by the auxiliary-model picker. */
  async listModels(): Promise<ModelCatalog> {
    return this.transport.call<ModelCatalog>('models/list', {})
  }
  controllerFor(sessionId: string): InputAssistantController {
    let entry = this.entries.get(sessionId)
    if (!entry) {
      entry = { controller: new InputAssistantController(sessionId, this.transport, this.metrics.get(sessionId), update => this.saveSettings(update), this.locale), refs: 0 }
      this.entries.set(sessionId, entry)
      if (this.pendingSettings) entry.controller.beginSettingsUpdate()
    }
    return entry.controller
  }
  retain(sessionId: string): () => void {
    const controller = this.controllerFor(sessionId), entry = this.entries.get(sessionId)!
    entry.refs++
    controller.start()
    return () => {
      entry.refs--
      queueMicrotask(() => {
        if (entry.refs === 0 && this.entries.get(sessionId) === entry) {
          this.metrics.set(sessionId, { ...controller.getSnapshot().metrics })
          controller.dispose(); this.entries.delete(sessionId)
        }
      })
    }
  }
  applySettings(settings: AssistantConfig): void {
    for (const entry of this.entries.values()) entry.controller.applySettings(settings)
  }
  async saveSettings(update: Partial<AssistantConfig>): Promise<AssistantConfig> {
    if (this.disposed) throw new Error(this.tr('error.disposed'))
    const generation = this.transport.generation()
    if (generation === null) throw new Error(this.tr('error.disconnectedSave'))
    if (this.pendingSettings++ === 0) for (const entry of this.entries.values()) entry.controller.beginSettingsUpdate()
    const task = this.settingsQueue.then(async () => {
      if (this.disposed) throw new Error(this.tr('error.disposed'))
      if (generation !== this.transport.generation()) throw new Error(this.tr('error.connectionChanged'))
      const settings = await this.transport.call<AssistantConfig>('settings/set', update, this.lifetime.signal)
      if (this.disposed || generation !== this.transport.generation()) throw new Error(this.tr('error.connectionChanged'))
      this.language = settings.language
      this.applySettings(settings)
      return settings
    })
    this.settingsQueue = task.then(() => {}, () => {})
    try { return await task }
    finally { if (--this.pendingSettings === 0) for (const entry of this.entries.values()) entry.controller.endSettingsUpdate() }
  }
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.lifetime.abort()
    for (const entry of this.entries.values()) entry.controller.dispose()
    this.entries.clear()
    this.metrics.clear()
  }
}
