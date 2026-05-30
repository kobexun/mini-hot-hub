interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getFreshCache<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry || entry.expiresAt <= Date.now()) {
    return undefined;
  }

  return entry.data;
}

export function getAnyCache<T>(key: string): T | undefined {
  return (cache.get(key) as CacheEntry<T> | undefined)?.data;
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): T {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  return data;
}
