import { describe, expect, it } from 'vitest'
import { AssistantError } from '../src/core/types'
import { t } from '../src/core/i18n'
import { errorCopy } from '../src/browser/error-copy'
import { InputAssistantRequestError } from '../src/browser/runtime'

const en = (key: Parameters<typeof t>[1], vars?: Record<string, string | number>) => t('en', key, vars)

describe('error copy', () => {
  it('localizes config errors with field labels and bounds', () => {
    expect(errorCopy(new AssistantError('CONFIG_NUMBER', 'x', { field: 'maxHistoryChars', min: 1000, max: 64000 }), en))
      .toBe('Context limit must be an integer from 1000 to 64000.')
    expect(errorCopy(new AssistantError('CONFIG_TEMPERATURE', 'x'), en))
      .toBe('Temperature must be a number from 0 to 2.')
    expect(errorCopy(new AssistantError('CONFIG_STRING', 'x', { field: 'extraInstruction', limit: 500 }), en))
      .toBe('Extra instruction is invalid or too long (maximum 500 characters).')
  })
  it('localizes runtime RPC codes and leaves unknown errors alone', () => {
    expect(errorCopy(new InputAssistantRequestError('MODEL', '请选择模型'), en))
      .toBe('Select a model in the composer, or choose an auxiliary model in settings.')
    expect(errorCopy(new Error('unknown'), en)).toBeNull()
    expect(errorCopy(new AssistantError('CONFIG_UNKNOWN', 'x'), en)).toBe('An unrecognized setting is present. Reload settings.')
  })
})
