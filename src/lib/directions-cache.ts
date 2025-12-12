// Directions cache using localStorage
// Caches Google Maps Directions API responses to reduce API calls
// Follows the same pattern as /lib/ai/cache.ts

import type { TravelInfo, TransportMethod } from '@/types/plan'

interface DirectionsCacheEntry {
  createdAt: string
  expiresAt: string
  travelInfo: TravelInfo
}

const CACHE_PREFIX = 'directions-cache-'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Generate a cache key from coordinates and transport mode
 * Uses a simple hash of the normalized parameters
 */
export function generateDirectionsCacheKey(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: TransportMethod
): string {
  // Normalize coordinates to 4 decimal places (~11m precision)
  const normalized = [
    fromLat.toFixed(4),
    fromLng.toFixed(4),
    toLat.toFixed(4),
    toLng.toFixed(4),
    mode,
  ].join('|')

  // Simple hash function (same as cache.ts)
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return `${CACHE_PREFIX}${Math.abs(hash).toString(36)}`
}

/**
 * Get cached directions if they exist and haven't expired
 */
export function getCachedDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: TransportMethod
): TravelInfo | null {
  if (typeof window === 'undefined') return null

  const key = generateDirectionsCacheKey(fromLat, fromLng, toLat, toLng, mode)

  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const entry: DirectionsCacheEntry = JSON.parse(cached)

    // Check if expired
    if (new Date(entry.expiresAt) < new Date()) {
      localStorage.removeItem(key)
      return null
    }

    console.log('[directions-cache] Hit for', `${fromLat},${fromLng} -> ${toLat},${toLng}`)
    return entry.travelInfo
  } catch (error) {
    console.error('[directions-cache] Error reading cache:', error)
    return null
  }
}

/**
 * Cache directions response
 */
export function cacheDirections(
  travelInfo: TravelInfo,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: TransportMethod
): void {
  if (typeof window === 'undefined') return

  const key = generateDirectionsCacheKey(fromLat, fromLng, toLat, toLng, mode)

  const entry: DirectionsCacheEntry = {
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    travelInfo,
  }

  try {
    localStorage.setItem(key, JSON.stringify(entry))
    console.log('[directions-cache] Stored directions for', `${fromLat},${fromLng} -> ${toLat},${toLng}`)
  } catch (error) {
    console.error('[directions-cache] Error storing cache:', error)
    // If storage is full, try to clear old entries
    clearExpiredDirectionsCache()
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredDirectionsCache(): void {
  if (typeof window === 'undefined') return

  const now = new Date()
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(CACHE_PREFIX)) continue

    try {
      const cached = localStorage.getItem(key)
      if (!cached) continue

      const entry: DirectionsCacheEntry = JSON.parse(cached)
      if (new Date(entry.expiresAt) < now) {
        keysToRemove.push(key)
      }
    } catch {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))

  if (keysToRemove.length > 0) {
    console.log('[directions-cache] Cleared', keysToRemove.length, 'expired entries')
  }
}

/**
 * Clear all cached directions
 */
export function clearAllDirectionsCache(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))
  console.log('[directions-cache] Cleared all', keysToRemove.length, 'cached directions')
}

/**
 * Get cache statistics
 */
export function getDirectionsCacheStats(): { count: number; totalSize: number } {
  if (typeof window === 'undefined') return { count: 0, totalSize: 0 }

  let count = 0
  let totalSize = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(CACHE_PREFIX)) continue

    const value = localStorage.getItem(key)
    if (value) {
      count++
      totalSize += value.length * 2 // Approximate bytes (UTF-16)
    }
  }

  return { count, totalSize }
}
