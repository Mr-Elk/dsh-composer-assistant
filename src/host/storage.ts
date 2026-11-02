import { z } from 'zod'
import { defineDomain, domainTable, type Domain } from '@deepseek-ai/dsh-storage-domain'
import type { AssistantConfig } from '../core/types'
import { resolveConfig, resolveStoredConfig } from '../core/config'

/**
 * Legacy draft-stash table. The feature was removed before 0.2.0; the table is
 * kept declared so existing local records still load. Nothing reads or writes it.
 */
const legacyDraftSchema = z.object({ id: z.string().min(1), text: z.string().min(1).max(32_000), createdAt: z.number().int().nonnegative() })
const legacyDraftsSchema = z.object({ version: z.literal(1), drafts: z.array(legacyDraftSchema).max(3) })
type LegacyDraftRecord = { id: string; text: string; createdAt: number }

export function createDomainSpec(initial: AssistantConfig) {
  return defineDomain({
    name: 'input_assistant', version: 1, layout: 'per-record',
    global: { schema: z.object({ version: z.literal(1), settings: z.record(z.string(), z.unknown()) }), initial: { version: 1 as const, settings: { ...initial } } },
    tables: { drafts: domainTable<string, { version: 1; drafts: LegacyDraftRecord[] }>(legacyDraftsSchema) },
  })
}

export type AssistantDomain = Domain<ReturnType<typeof createDomainSpec>>

/** Serializes read-modify-write operations, including the very first save. */
export class AssistantStorage {
  private chain: Promise<void> = Promise.resolve()
  constructor(private readonly domain: () => Promise<AssistantDomain>) {}

  private transaction<T>(work: (domain: AssistantDomain) => Promise<T>): Promise<T> {
    const task = this.chain.then(async () => work(await this.domain()))
    this.chain = task.then(() => undefined, () => undefined)
    return task
  }

  async settings(): Promise<AssistantConfig> {
    const domain = await this.domain()
    // Stored records are read leniently: an older/newer build or a partially
    // written record must degrade individual fields, never lock every endpoint.
    return resolveStoredConfig(domain.global.get().settings)
  }

  updateSettings(patch: Partial<AssistantConfig>): Promise<AssistantConfig> {
    return this.transaction(async domain => {
      // The patch itself is strict (a caller typo must fail), while the base it
      // merges onto is read leniently so one unknown stored key cannot make the
      // plugin permanently unsavable.
      const settings = resolveConfig({ ...resolveStoredConfig(domain.global.get().settings), ...patch })
      await domain.global.set({ version: 1, settings })
      return settings
    })
  }
}
