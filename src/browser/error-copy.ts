import type { MessageKey } from '../core/i18n'

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

const FIELD_KEYS: Record<string, MessageKey> = {
  maxHistoryChars: 'settings.context',
  suggestionTimeoutMs: 'settings.timeout',
  hourlyCallLimit: 'settings.hourly',
  temperature: 'settings.temperature',
  extraInstruction: 'settings.extra',
  optimizationStrength: 'settings.strength',
  suggestionLength: 'settings.suggestionLength',
  language: 'settings.language',
  provider: 'settings.modelLabel',
  model: 'settings.modelLabel',
}

const RUNTIME_KEYS: Record<string, MessageKey> = {
  DISABLED: 'error.disabled', SESSION: 'error.session', STALE: 'error.stale', INPUT: 'error.input',
  MODEL: 'error.model', OUTPUT: 'error.output', EMPTY_OUTPUT: 'error.output', TIMEOUT: 'error.timeout',
  CANCELLED: 'error.cancelled', BUSY: 'error.busy', CONFIG: 'error.config', TOO_LONG: 'error.tooLong',
  EMPTY: 'error.empty', PROTECTION: 'error.protection', LOCK_SCOPE: 'error.lockScope', DISPOSED: 'error.session',
}

/** Translate a known error code; unknown errors stay for the caller to handle. */
export function errorCopy(error: unknown, translate: Translate): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null
  const code = String((error as { code: unknown }).code)
  const params = ((error as { params?: Record<string, string | number> }).params ?? {})
  const fieldKey = typeof params.field === 'string' ? FIELD_KEYS[params.field] : undefined
  const field = translate(fieldKey ?? 'config.field')
  switch (code) {
    case 'CONFIG_BOOLEAN': return translate('config.boolean', { field })
    case 'CONFIG_DISPLAY_MODE': return translate('config.displayMode')
    case 'CONFIG_SUGGESTION_LENGTH': return translate('config.suggestionLength')
    case 'CONFIG_LANGUAGE': return translate('config.language')
    case 'CONFIG_STRENGTH': return translate('config.strength')
    case 'CONFIG_NUMBER': return translate('config.number', { field, min: params.min ?? 0, max: params.max ?? 0 })
    case 'CONFIG_STRING': return translate('config.string', { field, limit: params.limit ?? 0 })
    case 'CONFIG_TEMPERATURE': return translate('config.temperature')
    case 'CONFIG_MODEL_PAIR': return translate('config.modelPair')
    case 'CONFIG_UNKNOWN': return translate('config.unknown')
    default: {
      const key = RUNTIME_KEYS[code]
      return key ? translate(key) : null
    }
  }
}
