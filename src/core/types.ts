/** Carrier-neutral contracts shared by the host, browser and offline evaluation. */
export type Operation = 'optimize' | 'next' | 'complete'
export interface TokenSpan { start: number; end: number; draftRev: number }
export interface ModelRoute { provider: string; model: string }
export type OptimizationStrength = 'light' | 'standard' | 'deep'
export type SuggestionLength = 'short' | 'standard' | 'long'
export type AssistantLanguage = 'follow' | 'zh' | 'en'
export interface AssistantConfig {
  optimizeEnabled: boolean
  optimizationStrength: OptimizationStrength
  nextEnabled: boolean
  completionEnabled: boolean
  displayMode: 'ghost' | 'panel'
  language: AssistantLanguage
  debounceMs: number
  minIntervalMs: number
  maxHistoryChars: number
  maxDraftChars: number
  suggestionLength: SuggestionLength
  optimizeTimeoutMs: number
  suggestionTimeoutMs: number
  provider: string
  model: string
  hourlyCallLimit: number
  temperature: number
  extraInstruction: string
  /** Newline/comma separated terms that optimization must keep verbatim. */
  preserveTerms: string
}
export const DEFAULT_CONFIG: Readonly<AssistantConfig> = Object.freeze({
  optimizeEnabled: true, optimizationStrength: 'standard',
  nextEnabled: false, completionEnabled: false, displayMode: 'ghost', language: 'follow',
  debounceMs: 600, minIntervalMs: 2000, maxHistoryChars: 16000,
  maxDraftChars: 8000, suggestionLength: 'standard',
  optimizeTimeoutMs: 60000, suggestionTimeoutMs: 15000, provider: '', model: '',
  hourlyCallLimit: 10, temperature: 0.7, extraInstruction: '', preserveTerms: '',
})
export interface InputSnapshot {
  requestId: string
  sessionId: string
  sourceTurnId: string | null
  draft: string
  draftRev: number
  span: TokenSpan
  connectionGeneration: string
  routeKey: string
}
export interface GenerationRequest extends InputSnapshot {
  operation: Operation
  targetText?: string
  lockedFragments?: readonly string[]
  provider?: string
  model?: string
  /** Ask for a fresh suggestion for the same turn instead of reusing the accepted one. */
  regenerate?: boolean
}
export interface GenerationResult {
  text: string | null
  requestId: string
  sessionId: string
  sourceTurnId: string | null
  draftRev: number
  span: TokenSpan
  connectionGeneration: string
  routeKey: string
}
export interface HistoryMessage { role: 'user' | 'assistant'; text: string; turnId?: string }
export interface AssistantStatus {
  sourceTurnId: string | null
  running: boolean
  settings: AssistantConfig
  generation: string
  route?: ModelRoute
}
export interface ModelOption {
  provider: string
  providerName: string
  model: string
  name: string
}
export interface ModelCatalog {
  models: ModelOption[]
  failures: { provider: string; message: string }[]
}
export const RPC_CHANNEL = '/api'
export const RPC_PREFIX = 'input-assistant/'
export class AssistantError extends Error {
  constructor(public readonly code: string, message: string, public readonly params?: Record<string, string | number>) { super(message); this.name = 'AssistantError' }
}
