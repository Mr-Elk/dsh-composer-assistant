import { describe, expect, it } from 'vitest'
import { acceptanceRate, formatLatency, usageCopy, usageFoot, usageRows } from '../src/browser/usage'
import type { UsageMetrics } from '../src/browser/controller'
import type { MessageKey } from '../src/core/i18n'

const tr = (key: MessageKey, vars?: Record<string, string | number>) => vars ? `${key}:${JSON.stringify(vars)}` : key
const metrics = (patch: Partial<UsageMetrics> = {}): UsageMetrics => ({
  exposures: 0, accepted: 0, editedAcceptances: 0, editedCharacters: 0, calls: 0, totalLatencyMs: 0, ...patch,
})

describe('usage formatting', () => {
  it('formats average latency and hides it when nothing ran', () => {
    expect(formatLatency(0, 0)).toBe('—')
    expect(formatLatency(800, 1)).toBe('800 ms')
    expect(formatLatency(3000, 2)).toBe('1.5 s')
    expect(formatLatency(1400, 1)).toBe('1.4 s')
  })

  it('computes the accept rate against exposed suggestions only', () => {
    expect(acceptanceRate(0, 0)).toBe('—')
    expect(acceptanceRate(5, 8)).toBe('63%')
    expect(acceptanceRate(3, 3)).toBe('100%')
  })

  it('builds six rows and a footer from real counters', () => {
    const value = metrics({ calls: 4, totalLatencyMs: 4000, exposures: 6, accepted: 3, editedAcceptances: 1, editedCharacters: 7 })
    const rows = usageRows(value, tr)
    expect(rows.map(row => row.label)).toEqual(['usage.calls', 'usage.latency', 'usage.exposures', 'usage.accepted', 'usage.rate', 'usage.edited'])
    expect(rows[1].value).toBe('1.0 s')
    expect(rows[4].value).toBe('50%')
    expect(rows[5].value).toContain('"count":1')
    expect(usageFoot(value, tr)).toContain('"calls":4')
  })

  it('copies a plain-text summary without draft content', () => {
    const text = usageCopy(metrics({ calls: 2, totalLatencyMs: 1200, exposures: 2, accepted: 1 }), tr)
    expect(text.split('\n')[0]).toBe('usage.copyTitle')
    expect(text).toContain('usage.calls: 2')
    expect(text).toContain('usage.note')
    expect(text).not.toContain('usage.empty')
  })

  it('marks an empty session in the copied summary', () => {
    expect(usageCopy(metrics(), tr)).toContain('usage.empty')
  })
})
