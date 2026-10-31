/** Carrier-neutral contracts shared by the host, browser and offline evaluation. */
export type Operation = 'optimize' | 'next' | 'complete'
export interface TokenSpan { start: number; end: number; draftRev: number }
export interface ModelRoute { provider: string; model: string }
export type OptimizationStrength = 'light' | 'standard' | 'deep'
export interface AssistantConfig {
  optimizeEnabled: boolean
  stashEnabled: boolean
  optimizationStrength: OptimizationStrength
  nextEnabled: boolean
  completionEnabled: boolean
  displayMode: 'ghost' | 'panel'
  nextTrigger: 'auto' | 'manual'
  debounceMs: number
  minIntervalMs: number
  maxHistoryChars: number
  maxDraftChars: number
  maxNextChars: number
  maxCompletionChars: number
  optimizeTimeoutMs: number
  suggestionTimeoutMs: number
  provider: string
  model: string
  nextDelayMs: number
  optimizeMaxGrowth: number
  temperature: number
  reasoningEffort: string
  extraInstruction: string
}
export const DEFAULT_CONFIG: Readonly<AssistantConfig> = Object.freeze({
  optimizeEnabled: true, stashEnabled: true, optimizationStrength: 'standard',
  nextEnabled: true, completionEnabled: true, displayMode: 'ghost', nextTrigger: 'auto', nextDelayMs: 0, optimizeMaxGrowth: 3,
  debounceMs: 600, minIntervalMs: 2000, maxHistoryChars: 16000,
  maxDraftChars: 8000, maxNextChars: 120, maxCompletionChars: 80,
  optimizeTimeoutMs: 60000, suggestionTimeoutMs: 15000, provider: '', model: '',
  temperature: 0.7, reasoningEffort: '', extraInstruction: '',
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
export interface StoredDraft { id: string; text: string; createdAt: number }
export const RPC_CHANNEL = '/api'
export const RPC_PREFIX = 'input-assistant/'
export class AssistantError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'AssistantError' }
}
