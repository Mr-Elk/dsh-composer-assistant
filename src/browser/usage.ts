import type { MessageKey } from '../core/i18n'
import type { UsageMetrics } from './controller'

export interface UsageRow { label: string; value: string }

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

/** Average browser request time for this session; not provider latency or cost. */
export function formatLatency(totalMs: number, calls: number): string {
  if (!calls || !Number.isFinite(totalMs) || totalMs <= 0) return '—'
  const average = totalMs / calls
  return average < 1000 ? `${Math.round(average)} ms` : `${(average / 1000).toFixed(1)} s`
}

/** Accept rate against exposed suggestions, not against calls. */
export function acceptanceRate(accepted: number, exposures: number): string {
  if (!exposures) return '—'
  return `${Math.round((accepted / exposures) * 100)}%`
}

export function usageRows(metrics: UsageMetrics, tr: Translate): UsageRow[] {
  return [
    { label: tr('usage.calls'), value: String(metrics.calls) },
    { label: tr('usage.latency'), value: formatLatency(metrics.totalLatencyMs, metrics.calls) },
    { label: tr('usage.exposures'), value: String(metrics.exposures) },
    { label: tr('usage.accepted'), value: String(metrics.accepted) },
    { label: tr('usage.rate'), value: acceptanceRate(metrics.accepted, metrics.exposures) },
    { label: tr('usage.edited'), value: tr('usage.editedValue', { count: metrics.editedAcceptances, chars: Math.max(0, metrics.editedCharacters) }) },
  ]
}

/** One-line footer on the quick settings popover. */
export function usageFoot(metrics: UsageMetrics, tr: Translate): string {
  return tr('usage.foot', { calls: metrics.calls, latency: formatLatency(metrics.totalLatencyMs, metrics.calls) })
}

/** Plain text copied to the clipboard; no private draft or suggestion text is included. */
export function usageCopy(metrics: UsageMetrics, tr: Translate): string {
  const lines = [tr('usage.copyTitle'), tr('usage.note')]
  for (const row of usageRows(metrics, tr)) lines.push(`${row.label}: ${row.value}`)
  if (!metrics.calls) lines.push(tr('usage.empty'))
  return lines.join('\n')
}
