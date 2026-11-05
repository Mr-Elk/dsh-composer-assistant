/** Sliding-window limit for auxiliary model calls, keyed by budget scope. */
export class CallBudget {
  private readonly log = new Map<string, number[]>()
  constructor(private readonly windowMs = 3_600_000) {}

  /** Records one call when allowed; `limit <= 0` means unlimited. */
  allow(key: string, limit: number, now = Date.now()): boolean {
    const cutoff = now - this.windowMs
    const recent = (this.log.get(key) ?? []).filter(at => at > cutoff)
    const allowed = limit <= 0 || recent.length < limit
    if (allowed) recent.push(now)
    this.log.set(key, recent)
    return allowed
  }

  /** Calls admitted for a key in the current window. */
  count(key: string, now = Date.now()): number {
    const cutoff = now - this.windowMs
    return (this.log.get(key) ?? []).filter(at => at > cutoff).length
  }

  clear(key?: string): void {
    if (key === undefined) this.log.clear()
    else this.log.delete(key)
  }

  /** Restores persisted timestamps, dropping anything outside the current window. */
  hydrate(state: Record<string, readonly number[]>, now = Date.now()): void {
    const cutoff = now - this.windowMs
    this.log.clear()
    for (const [key, times] of Object.entries(state)) {
      const recent = times.filter(at => Number.isFinite(at) && at > cutoff)
      if (recent.length) this.log.set(key, [...recent])
    }
  }

  /** Persistable snapshot, pruned to the current window. */
  snapshot(now = Date.now()): Record<string, number[]> {
    const cutoff = now - this.windowMs
    const out: Record<string, number[]> = {}
    for (const [key, times] of this.log) {
      const recent = times.filter(at => at > cutoff)
      if (recent.length) out[key] = [...recent]
    }
    return out
  }
}
