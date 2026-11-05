import type { Context } from '@deepseek-ai/cordis'
import schema from '@deepseek-ai/schemastery'
import { RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@deepseek-ai/dsh-typert-registry'
import type {} from '@deepseek-ai/dsh-storage-domain'
import type {} from '@deepseek-ai/dsh-session-projection'
import { AssistantError, DEFAULT_CONFIG, resolveConfig, type AssistantConfig } from './core/index'
import { AssistantHostRuntime } from './host/runtime'
import { AssistantStorage, AutomaticCallBudget, createDomainSpec, createBudgetDomainSpec, type AssistantDomain, type BudgetDomain } from './host/storage'
import { emptyTranscript, foldTranscript, transcriptSchema } from './host/transcript'
import { hostContribution, rpcPayloadSchema, type RpcPayload } from './host/rpc'

export type Config = Partial<AssistantConfig>
export const name = 'composer-assistant'
export const inject = ['llm', 'sessions', 'sessionProjections', 'storageDomain', 'typert', 'typertGateway']
export const Config = schema.object({
  optimizeEnabled: schema.boolean().default(true),
  optimizationStrength: schema.union(['light', 'standard', 'deep']).default('standard'),
  nextEnabled: schema.boolean().default(DEFAULT_CONFIG.nextEnabled), completionEnabled: schema.boolean().default(DEFAULT_CONFIG.completionEnabled),
  language: schema.union(['follow', 'zh', 'en']).default('follow'),
  displayMode: schema.union(['ghost', 'panel']).default('ghost'),
  debounceMs: schema.natural().min(200).max(5000).default(600),
  minIntervalMs: schema.natural().min(500).max(30000).default(2000),
  maxHistoryChars: schema.natural().min(1000).max(64000).default(16000),
  maxDraftChars: schema.natural().min(100).max(32000).default(8000),
  suggestionLength: schema.union(['short', 'standard', 'long']).default('standard'),
  optimizeTimeoutMs: schema.natural().min(1000).max(120000).default(60000),
  suggestionTimeoutMs: schema.natural().min(1000).max(60000).default(15000),
  provider: schema.string().default(''), model: schema.string().default(''),
  hourlyCallLimit: schema.natural().min(0).max(2000).default(DEFAULT_CONFIG.hourlyCallLimit),
  temperature: schema.number().min(0).max(2).default(0.7),
  extraInstruction: schema.string().default(''),
  preserveTerms: schema.string().default(''),
})

declare module '@deepseek-ai/cordis' { interface Context { inputAssistant: InputAssistantService } }
declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'input-assistant/error': { code: string }
    'input-assistant/forbidden': Record<string, never>
  }
}

/** One strictly described Remote endpoint; the standard Gateway owns transport. */
export class InputAssistantService extends TypertRemoteService {
  constructor(ctx: Context, private readonly runtime: AssistantHostRuntime) {
    super(ctx, 'inputAssistant', { namespace: 'input-assistant' })
  }
  async call(payload: RpcPayload, signal: AbortSignal): Promise<unknown> {
    if (this.ctx.invocation?.peer.principal.kind !== 'owner') throw new RemoteError('input-assistant/forbidden', '输入助手仅供当前宿主用户使用', {})
    try {
      return await this.runtime.invoke(rpcPayloadSchema.parse(payload), signal)
    } catch (error) {
      if (signal.aborted) throw error
      if (error instanceof AssistantError) throw new RemoteError('input-assistant/error', error.message, { code: error.code })
      if (error instanceof Error && error.name === 'ZodError') throw new RemoteError('input-assistant/error', '请求格式无效', { code: 'INPUT' })
      // Provider/storage diagnostics may contain private material; never echo them.
      throw new RemoteError('input-assistant/error', '操作未完成，请检查模型连接或插件存储；当前草稿保持不变', { code: 'INPUT_ASSISTANT' })
    }
  }
}

export function apply(ctx: Context, config: Config = {}): void {
  const initial = resolveConfig({ ...DEFAULT_CONFIG, ...config })
  let opened: Promise<AssistantDomain> | undefined
  let openedBudget: Promise<BudgetDomain> | undefined
  // Every concurrent caller shares one complete open. A failed open is retried
  // on the next operation, rather than caching a rejected Promise forever.
  const domain = (): Promise<AssistantDomain> => opened ??= ctx.storageDomain.open(createDomainSpec(initial)).catch(error => {
    opened = undefined
    throw error
  })
  const budgetDomain = (): Promise<BudgetDomain> => openedBudget ??= ctx.storageDomain.open(createBudgetDomainSpec()).catch(error => {
    openedBudget = undefined
    throw error
  })
  const runtime = new AssistantHostRuntime(ctx, new AssistantStorage(domain), new AutomaticCallBudget(budgetDomain))
  ctx.sessionProjections.register({
    key: 'inputAssistantTranscript', stateSchema: transcriptSchema, init: emptyTranscript,
    apply: foldTranscript, stateVersion: 1,
  })
  new InputAssistantService(ctx, runtime)
  ctx.typert.register(hostContribution)
  ctx.on('session/event', (session, event) => {
    if (event.type === 'turn/start' || event.type === 'turn/end' || event.type === 'request/header') runtime.changed(session)
  })
  ctx.on('session/disposed', session => runtime.changed(session))
  ctx.effect(() => async () => {
    runtime.dispose()
    if (opened) { try { await (await opened).close() } catch { /* The storage owner may already have disposed. */ } }
    if (openedBudget) { try { await (await openedBudget).close() } catch { /* The storage owner may already have disposed. */ } }
  })
}
