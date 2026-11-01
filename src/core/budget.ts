/** Sliding-window limit for auxiliary model calls, keyed by session. */
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
}
