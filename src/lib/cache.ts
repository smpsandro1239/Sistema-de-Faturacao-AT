/**
 * Simple in-memory cache for frequently accessed data
 */

const cache = new Map<string, { data: any; expires: number }>();

export function getFromCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }

  return item.data as T;
}

export function setToCache(key: string, data: any, ttlSeconds: number = 3600) {
  cache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  });
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
