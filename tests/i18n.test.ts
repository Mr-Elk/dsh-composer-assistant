import { describe, expect, it } from 'vitest'
import { MESSAGES, MESSAGE_KEYS, resolveUiLocale, t } from '../src/core/i18n'

describe('i18n', () => {
  it('has the same keys in zh and en', () => {
    expect(Object.keys(MESSAGES.en).sort()).toEqual([...MESSAGE_KEYS].sort())
  })
  it('resolves follow and explicit locales', () => {
    expect(resolveUiLocale('follow', 'en-US')).toBe('en')
    expect(resolveUiLocale('follow', 'zh-CN')).toBe('zh')
    expect(resolveUiLocale('follow', null)).toBe('zh')
    expect(resolveUiLocale('zh', 'en-US')).toBe('zh')
    expect(resolveUiLocale('en', 'zh-CN')).toBe('en')
  })
  it('interpolates variables without dropping unknown placeholders', () => {
    expect(t('zh', 'model.current', { model: 'V4.1 Flash' })).toContain('V4.1 Flash')
    expect(t('en', 'settings.advancedCount', { count: 5 })).toBe('5 items')
  })
})
