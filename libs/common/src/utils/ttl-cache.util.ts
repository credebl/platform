export class TtlCache<T> {
  private value: T | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  async get(fetchFn: () => Promise<T>): Promise<T> {
    if (null !== this.value) {
      this.refreshTimer();
      return this.value;
    }

    this.value = await fetchFn();
    this.refreshTimer();
    return this.value;
  }

  clear(): void {
    this.value = null;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private refreshTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.clear();
    }, this.ttlMs);
    this.timer.unref();
  }
}
