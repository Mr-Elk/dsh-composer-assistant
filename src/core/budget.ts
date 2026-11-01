/** Sliding-window limit for auxiliary model calls, keyed by session. */
export class CallBudget {
  private readonly log = new Map<string, number[]>()
  constructor(private readonly limit: number, private readonly windowMs = 3_600_000) {}

  /** Records one call when allowed; returns false once the window is full. */
  allow(key: string, now = Date.now()): boolean {
    const cutoff = now - this.windowMs
    const recent = (this.log.get(key) ?? []).filter(at => at > cutoff)
    if (recent.length >= this.limit) {
      this.log.set(key, recent)
      return false
    }
    recent.push(now)
    this.log.set(key, recent)
    return true
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
