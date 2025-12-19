/**
 * Cache utilities for hotel search
 * Reduces SerpAPI costs by caching results
 */

import { unstable_cache } from "next/cache"
import type { HotelSearchParams, HotelSearchResult } from "./types"

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 // 1 hour in seconds

/**
 * Generate a stable cache key from search parameters
 */
function generateCacheKey(params: HotelSearchParams): string {
  const normalized = {
    destination: params.destination.toLowerCase().trim(),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children || 0,
    currency: params.currency || "USD",
    gl: params.gl || "us",
    hl: params.hl || "en",
  }

  return `hotel-search:${JSON.stringify(normalized)}`
}

/**
 * Create a cached version of the search function
 * Uses Next.js unstable_cache for server-side caching
 */
function createCachedSearch<T extends (...args: any[]) => Promise<HotelSearchResult>>(
  searchFn: T
) {
  return async (params: HotelSearchParams): Promise<HotelSearchResult> => {
    const cacheKey = generateCacheKey(params)

    // Create a cached version with tags for revalidation
    const cachedFn = unstable_cache(
      async () => searchFn(params),
      [cacheKey],
      {
        revalidate: CACHE_DURATION,
        tags: [`hotel-search`, `destination:${params.destination}`],
      }
    )

    return cachedFn()
  }
}

/**
 * Client-side cache using localStorage
 * Useful for saving recent searches and reducing API calls
 */
class ClientCache {
  private static readonly PREFIX = "travelr-hotel-cache:"
  private static readonly MAX_AGE = 60 * 60 * 1000 // 1 hour in ms

  static get<T>(key: string): T | null {
    if (typeof window === "undefined") return null

    try {
      const item = localStorage.getItem(this.PREFIX + key)
      if (!item) return null

      const parsed = JSON.parse(item)
      const now = Date.now()

      // Check if expired
      if (parsed.expires && now > parsed.expires) {
        this.remove(key)
        return null
      }

      return parsed.data
    } catch (error) {
      console.error("Error reading from cache:", error)
      return null
    }
  }

  static set<T>(key: string, data: T, ttl: number = this.MAX_AGE): void {
    if (typeof window === "undefined") return

    try {
      const item = {
        data,
        expires: Date.now() + ttl,
        created: Date.now(),
      }

      localStorage.setItem(this.PREFIX + key, JSON.stringify(item))
    } catch (error) {
      console.error("Error writing to cache:", error)
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        this.clearOldest()
        // Try again
        try {
          const item = {
            data,
            expires: Date.now() + ttl,
            created: Date.now(),
          }
          localStorage.setItem(this.PREFIX + key, JSON.stringify(item))
        } catch {
          // If still fails, give up silently
        }
      }
    }
  }

  static remove(key: string): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.PREFIX + key)
  }

  static clear(): void {
    if (typeof window === "undefined") return

    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Remove oldest cache entries to free up space
   */
  private static clearOldest(): void {
    if (typeof window === "undefined") return

    const keys = Object.keys(localStorage)
    const cacheKeys = keys.filter((key) => key.startsWith(this.PREFIX))

    if (cacheKeys.length === 0) return

    // Get all cache items with their creation time
    const items = cacheKeys
      .map((key) => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "{}")
          return {
            key,
            created: item.created || 0,
          }
        } catch {
          return { key, created: 0 }
        }
      })
      .sort((a, b) => a.created - b.created)

    // Remove oldest 25%
    const toRemove = Math.ceil(items.length * 0.25)
    items.slice(0, toRemove).forEach((item) => {
      localStorage.removeItem(item.key)
    })
  }

  /**
   * Get cache stats
   */
  static getStats(): {
    totalEntries: number
    totalSize: number
    oldestEntry: Date | null
    newestEntry: Date | null
  } {
    if (typeof window === "undefined") {
      return { totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null }
    }

    const keys = Object.keys(localStorage)
    const cacheKeys = keys.filter((key) => key.startsWith(this.PREFIX))

    let totalSize = 0
    let oldest = Infinity
    let newest = 0

    cacheKeys.forEach((key) => {
      const item = localStorage.getItem(key)
      if (item) {
        totalSize += item.length
        try {
          const parsed = JSON.parse(item)
          if (parsed.created) {
            oldest = Math.min(oldest, parsed.created)
            newest = Math.max(newest, parsed.created)
          }
        } catch {
          // Ignore
        }
      }
    })

    return {
      totalEntries: cacheKeys.length,
      totalSize,
      oldestEntry: oldest !== Infinity ? new Date(oldest) : null,
      newestEntry: newest > 0 ? new Date(newest) : null,
    }
  }
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number
  misses: number
  hitRate: number
}

/**
 * Simple in-memory cache stats tracker
 */
class CacheStatsTracker {
  private static hits = 0
  private static misses = 0

  static recordHit(): void {
    this.hits++
  }

  static recordMiss(): void {
    this.misses++
  }

  static getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    }
  }

  static reset(): void {
    this.hits = 0
    this.misses = 0
  }
}
