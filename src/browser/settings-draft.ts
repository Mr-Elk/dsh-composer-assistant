import { resolveConfig } from '../core/config'
import type { AssistantConfig } from '../core/types'

/** One shared form state for the settings page and the quick-settings popover. */
export interface SettingsDraft {
  accepted: AssistantConfig
  draft: AssistantConfig
}

export function createSettingsDraft(accepted: AssistantConfig): SettingsDraft {
  return { accepted: { ...accepted }, draft: { ...accepted } }
}

export function setDraftValue<K extends keyof AssistantConfig>(state: SettingsDraft, key: K, value: AssistantConfig[K]): SettingsDraft {
  return { ...state, draft: { ...state.draft, [key]: value } }
}

export function isSettingsDraftDirty(state: SettingsDraft): boolean {
  return Object.keys(state.accepted).some(key => !Object.is(state.accepted[key as keyof AssistantConfig], state.draft[key as keyof AssistantConfig]))
}

/**
 * Validate the whole draft and return only changed fields. Hidden fields are
 * preserved because they are part of the same draft and only diffs are sent.
 */
export function settingsPatch(state: SettingsDraft): Partial<AssistantConfig> {
  const normalized = resolveConfig(state.draft)
  const patch: Record<string, unknown> = {}
  for (const key of Object.keys(normalized) as (keyof AssistantConfig)[]) {
    if (!Object.is(normalized[key], state.accepted[key])) patch[key] = normalized[key]
  }
  return patch as Partial<AssistantConfig>
}
