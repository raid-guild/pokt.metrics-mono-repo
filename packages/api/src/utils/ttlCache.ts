type Loader<V> = () => Promise<V>;

export class TTLCache<K, V> {
  private store = new Map<K, { value: V; expiresAt: number }>();
  private inflight = new Map<K, Promise<V>>();

  constructor(private defaultTtlMs: number) {}

  getSync(key: K): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return;
    }
    return hit.value;
  }

  async get(key: K, loader: Loader<V>, ttlMs = this.defaultTtlMs): Promise<V> {
    const existing = this.getSync(key);
    if (existing !== undefined) return existing;

    // de-dupe concurrent loads (avoid thundering herd)
    let p = this.inflight.get(key);
    if (!p) {
      p = (async () => {
        try {
          const value = await loader();
          this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
          return value;
        } finally {
          this.inflight.delete(key);
        }
      })();
      this.inflight.set(key, p);
    }
    return p;
  }

  set(key: K, value: V, ttlMs = this.defaultTtlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: K) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}
