/**
 * Simple in-memory cache with TTL support.
 *
 * NOTE: verify() results are NOT cached for security reasons.
 * Only entitlements and other non-sensitive data should be cached.
 *
 * @example
 * ```typescript
 * const cache = new Cache();
 *
 * // Set with default TTL (5 minutes)
 * cache.set('key', { data: 'value' });
 *
 * // Set with custom TTL (30 seconds)
 * cache.set('key', { data: 'value' }, 30000);
 *
 * // Get value (returns undefined if expired or not found)
 * const value = cache.get<{ data: string }>('key');
 * ```
 */
export class Cache {
    defaultTtl;
    store = new Map();
    cleanupInterval = null;
    /**
     * Create a new cache instance.
     * @param defaultTtl - Default time-to-live in milliseconds (default: 5 minutes)
     */
    constructor(defaultTtl = 300000) {
        this.defaultTtl = defaultTtl;
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    /**
     * Get a value from the cache.
     * @param key - Cache key
     * @returns The cached value or undefined if not found/expired
     */
    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return undefined;
        }
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    /**
     * Set a value in the cache.
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time to live in milliseconds (default: configured defaultTtl)
     */
    set(key, value, ttl = this.defaultTtl) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttl
        });
    }
    /**
     * Check if a key exists in the cache (and is not expired).
     * @param key - Cache key
     * @returns true if the key exists and is not expired
     */
    has(key) {
        return this.get(key) !== undefined;
    }
    /**
     * Delete a value from the cache.
     * @param key - Cache key
     * @returns true if the key was found and deleted
     */
    delete(key) {
        return this.store.delete(key);
    }
    /**
     * Clear all cached values.
     */
    clear() {
        this.store.clear();
    }
    /**
     * Get the current number of items in the cache.
     * Note: This includes expired items that haven't been cleaned up yet.
     */
    get size() {
        return this.store.size;
    }
    /**
     * Stop the cleanup interval (for graceful shutdown).
     * Also clears all cached values.
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.store.clear();
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}
