/**
 * Simple in-memory cache utility for MCP server
 * Uses LRU-like eviction with TTL support
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

class Cache {
	private cache: Map<string, CacheEntry<unknown>>;
	private maxSize: number;

	constructor(maxSize = 100) {
		this.cache = new Map();
		this.maxSize = maxSize;
	}

	/**
	 * Get cached data if available and not expired
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;

		if (!entry) {
			return null;
		}

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Set cache data with TTL in milliseconds
	 */
	set<T>(key: string, data: T, ttl = 300000): void {
		// Evict oldest entry if cache is full
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}

		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl,
		});
	}

	/**
	 * Clear specific key or entire cache
	 */
	clear(key?: string): void {
		if (key) {
			this.cache.delete(key);
		} else {
			this.cache.clear();
		}
	}

	/**
	 * Get cache statistics
	 */
	stats(): { size: number; maxSize: number } {
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
		};
	}
}

// Global cache instance
export const globalCache = new Cache();

/**
 * Cached fetch helper with automatic cache management
 */
export async function cachedFetch<T>(
	url: string,
	parser: (response: Response) => Promise<T>,
	ttl = 300000, // 5 minutes default
): Promise<T> {
	const cacheKey = `fetch:${url}`;

	// Try cache first
	const cached = globalCache.get<T>(cacheKey);
	if (cached !== null) {
		return cached;
	}

	// Fetch and cache
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
	}

	const data = await parser(response);
	globalCache.set(cacheKey, data, ttl);

	return data;
}
