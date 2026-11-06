import { AssistantError, DEFAULT_CONFIG, type AssistantConfig } from './types'

const numeric: Record<string, [number, number]> = {
  debounceMs: [200, 5000], minIntervalMs: [500, 30000], maxHistoryChars: [1000, 64000],
  maxDraftChars: [100, 32000],
  optimizeTimeoutMs: [1000, 120000], suggestionTimeoutMs: [5000, 60000], hourlyCallLimit: [0, 2000],
}
const booleans = ['optimizeEnabled', 'nextEnabled', 'completionEnabled'] as const
const strings = ['provider', 'model', 'extraInstruction', 'preserveTerms'] as const
/** Keys removed in 0.3.0 that may still arrive from an older running host. */
const LEGACY_KEYS = new Set(['stashEnabled', 'nextTrigger'])

/** User-facing length presets; the raw character caps stay internal. */
export const SUGGESTION_CAPS: Record<'short' | 'standard' | 'long', { next: number; complete: number }> = {
  short: { next: 60, complete: 40 },
  standard: { next: 120, complete: 80 },
  long: { next: 300, complete: 200 },
}
/** Optimization may not exceed this multiple of the target text (plus a small floor). */
export const OPTIMIZE_MAX_GROWTH = 3

export function suggestionCaps(config: Pick<AssistantConfig, 'suggestionLength'>): { next: number; complete: number } {
  return SUGGESTION_CAPS[config.suggestionLength]
}

/** Validate one already-merged config object; throws with the first problem found. */
function validate(config: AssistantConfig): AssistantConfig {
  for (const key of booleans) {
    if (typeof config[key] !== 'boolean') throw new AssistantError('CONFIG_BOOLEAN', `${key} 必须是布尔值`, { field: key })
  }
  if (!['ghost', 'panel'].includes(config.displayMode)) throw new AssistantError('CONFIG_DISPLAY_MODE', '显示方式必须是 ghost 或 panel')
  if (!['short', 'standard', 'long'].includes(config.suggestionLength)) throw new AssistantError('CONFIG_SUGGESTION_LENGTH', '建议长度必须是 short、standard 或 long')
  if (!['follow', 'zh', 'en'].includes(config.language)) throw new AssistantError('CONFIG_LANGUAGE', '语言必须是 follow、zh 或 en')
  if (!['light', 'standard', 'deep'].includes(config.optimizationStrength)) throw new AssistantError('CONFIG_STRENGTH', '优化强度必须是 light、standard 或 deep')
  for (const [key, [min, max]] of Object.entries(numeric)) {
    const value = config[key as keyof AssistantConfig]
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
      throw new AssistantError('CONFIG_NUMBER', `${key} 必须是 ${min} 到 ${max} 之间的整数`, { field: key, min, max })
    }
  }
  for (const key of strings) {
    const limit = key === 'extraInstruction' ? 500 : key === 'preserveTerms' ? 1000 : 200
    if (typeof config[key] !== 'string' || config[key].length > limit) throw new AssistantError('CONFIG_STRING', `${key} 无效`, { field: key, limit })
    config[key] = config[key].trim()
  }
  if (typeof config.temperature !== 'number' || !Number.isFinite(config.temperature) || config.temperature < 0 || config.temperature > 2) {
    throw new AssistantError('CONFIG_TEMPERATURE', 'temperature 必须是 0 到 2 之间的数字')
  }
  if (Boolean(config.provider) !== Boolean(config.model)) throw new AssistantError('CONFIG_MODEL_PAIR', '固定辅助模型需同时填写提供商和模型；留空则跟随输入框')
  return config
}

/**
 * Strict resolution for author-supplied input: the plugin's own Cordis config and
 * every `settings/set` patch. Unknown keys are a caller mistake and must fail loudly
 * rather than be silently dropped from a partial update.
 */
export function resolveConfig(input: Partial<AssistantConfig> = {}): AssistantConfig {
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(DEFAULT_CONFIG, key) && !LEGACY_KEYS.has(key)) throw new AssistantError('CONFIG_UNKNOWN', `未知配置：${key}`)
  }
  const known = Object.fromEntries(Object.entries(input).filter(([key]) => Object.hasOwn(DEFAULT_CONFIG, key)))
  return validate({ ...DEFAULT_CONFIG, ...known })
}

/**
 * Lenient resolution for settings already on disk.
 *
 * Stored settings outlive the code that wrote them: a downgrade, a newer build
 * that added a key, or a partially-written record must never make the plugin
 * unusable. Unknown keys are ignored and unusable values fall back to their
 * default, so a bad record degrades one setting instead of locking every
 * endpoint. The next successful `settings/set` rewrites a clean record.
 */
export function resolveStoredConfig(input: unknown): AssistantConfig {
  const record = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {}
  const config: Record<string, unknown> = { ...DEFAULT_CONFIG }
  for (const key of Object.keys(DEFAULT_CONFIG) as (keyof AssistantConfig)[]) {
    if (key === 'provider' || key === 'model') continue
    if (!(key in record)) continue
    const value = record[key]
    const candidate = { ...DEFAULT_CONFIG, [key]: value } as AssistantConfig
    try { validate({ ...candidate }) } catch { continue }
    config[key] = typeof value === 'string' ? value.trim() : value
  }
  // `provider`/`model` are one group: validating them separately against the
  // empty default would silently drop a complete pair. Keep both or neither.
  const provider = typeof record.provider === 'string' ? record.provider.trim() : ''
  const model = typeof record.model === 'string' ? record.model.trim() : ''
  if (provider && model && provider.length <= 200 && model.length <= 200) {
    config.provider = provider
    config.model = model
  } else {
    config.provider = ''
    config.model = ''
  }
  return config as unknown as AssistantConfig
}
