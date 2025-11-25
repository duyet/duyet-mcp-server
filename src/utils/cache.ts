/**
 * Cloudflare Cache API wrapper for MCP server
 *
 * Provides simple caching utilities with TTL support for external API calls.
 * Uses Cloudflare's Cache API which is available in Workers runtime.
 */

import { logger } from "./logger";

export interface CacheConfig {
  /** Cache key prefix to namespace different cache types */
  prefix?: string;
  /** Time-to-live in seconds */
  ttl: number;
  /** Cache name (default: 'duyet-mcp') */
  cacheName?: string;
}

/**
 * Default cache configurations for different data types
 */
export const CACHE_CONFIGS = {
  CV: { prefix: "cv", ttl: 3600, cacheName: "duyet-mcp" }, // 1 hour
  BLOG: { prefix: "blog", ttl: 1800, cacheName: "duyet-mcp" }, // 30 minutes
  GITHUB: { prefix: "github", ttl: 900, cacheName: "duyet-mcp" }, // 15 minutes
  ABOUT: { prefix: "about", ttl: 3600, cacheName: "duyet-mcp" }, // 1 hour
};

/**
 * Generate a cache key from a base key and config
 */
function generateCacheKey(key: string, config: CacheConfig): string {
  const prefix = config.prefix || "default";
  return `https://cache.duyet.net/${prefix}/${key}`;
}

/**
 * Get data from cache
 * @returns Cached data or null if not found/expired
 */
export async function getFromCache<T>(
  key: string,
  config: CacheConfig,
): Promise<T | null> {
  try {
    const cacheName = config.cacheName || "duyet-mcp";
    const cache = await caches.open(cacheName);
    const cacheKey = generateCacheKey(key, config);

    const response = await cache.match(cacheKey);
    if (!response) {
      logger.cacheMiss(key, config.prefix);
      return null;
    }

    // Check if cache is still valid (Cloudflare cache headers)
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl?.includes("max-age=0")) {
      // Cache expired, delete it
      await cache.delete(cacheKey);
      return null;
    }

    const data = await response.json();
    logger.cacheHit(key, config.prefix);
    return data as T;
  } catch (error) {
    // If cache read fails, return null (cache miss)
    logger.error("cache", "Cache read error", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setInCache<T>(
  key: string,
  data: T,
  config: CacheConfig,
): Promise<void> {
  try {
    const cacheName = config.cacheName || "duyet-mcp";
    const cache = await caches.open(cacheName);
    const cacheKey = generateCacheKey(key, config);

    // Create a Response object with cache headers
    const response = new Response(JSON.stringify(data), {
      headers: {
        "content-type": "application/json",
        "cache-control": `public, max-age=${config.ttl}`,
        "x-cached-at": new Date().toISOString(),
      },
    });

    await cache.put(cacheKey, response);
    logger.cacheSet(key, config.ttl);
  } catch (error) {
    // If cache write fails, log but don't throw (degrade gracefully)
    logger.error("cache", "Cache write error", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete data from cache
 */
export async function deleteFromCache(
  key: string,
  config: CacheConfig,
): Promise<void> {
  try {
    const cacheName = config.cacheName || "duyet-mcp";
    const cache = await caches.open(cacheName);
    const cacheKey = generateCacheKey(key, config);

    await cache.delete(cacheKey);
    logger.debug("cache", `Deleted: ${key}`, { prefix: config.prefix });
  } catch (error) {
    logger.error("cache", "Cache delete error", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Generic cache-or-fetch pattern
 * Tries cache first, falls back to fetcher function if cache miss
 */
export async function cacheOrFetch<T>(
  key: string,
  config: CacheConfig,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Try cache first
  const cached = await getFromCache<T>(key, config);
  if (cached !== null) {
    return cached;
  }

  // Cache miss, fetch fresh data
  const fresh = await fetcher();

  // Store in cache for next time (fire and forget)
  setInCache(key, fresh, config).catch((error) => {
    logger.error("cache", "Background cache write failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return fresh;
}

/**
 * Invalidate all cache entries for a given prefix
 * Note: Cloudflare Workers Cache API doesn't support keys() method
 * To invalidate cache, you must know the exact cache key
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  // This function is not currently supported in Cloudflare Workers
  // as the Cache API doesn't provide a keys() method
  // To invalidate cache, use deleteFromCache() with the exact key
  logger.warn(
    "cache",
    `Cache invalidation for prefix "${prefix}" is not supported in Cloudflare Workers`,
  );
}
