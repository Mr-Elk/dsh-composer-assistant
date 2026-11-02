import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../src/core/types'
import { createSettingsDraft, isSettingsDraftDirty, setDraftValue, settingsPatch } from '../src/browser/settings-draft'

describe('settings draft', () => {
  it('sends only changed fields and preserves hidden ones', () => {
    const accepted = { ...DEFAULT_CONFIG, provider: 'fixture', model: 'model-a', extraInstruction: '更口语' }
    let state = createSettingsDraft(accepted)
    expect(isSettingsDraftDirty(state)).toBe(false)
    state = setDraftValue(state, 'suggestionLength', 'long')
    state = setDraftValue(state, 'language', 'en')
    expect(isSettingsDraftDirty(state)).toBe(true)
    expect(settingsPatch(state)).toEqual({ suggestionLength: 'long', language: 'en' })
  })

  it('validates the whole draft and rejects out-of-range values', () => {
    const state = setDraftValue(createSettingsDraft(DEFAULT_CONFIG), 'temperature', 3)
    expect(() => settingsPatch(state)).toThrow(/temperature/)
  })

  it('trims strings before diffing so no-op whitespace does not save', () => {
    const accepted = { ...DEFAULT_CONFIG, extraInstruction: '更口语' }
    const state = setDraftValue(createSettingsDraft(accepted), 'extraInstruction', ' 更口语 ')
    expect(settingsPatch(state)).toEqual({})
  })
})
