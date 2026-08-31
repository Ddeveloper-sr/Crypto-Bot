class TTLCache {
  constructor(ttlMs = 30_000) {
    this.ttlMs = ttlMs;
    this.items = new Map();
  }

  get(key) {
    const item = this.items.get(key);
    if (!item) return undefined;
    if (Date.now() - item.createdAt > this.ttlMs) {
      this.items.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key, value) {
    this.items.set(key, { value, createdAt: Date.now() });
    return value;
  }

  clear() {
    this.items.clear();
  }
}

module.exports = { TTLCache };
