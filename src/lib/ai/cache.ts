// Plan cache using localStorage
// Caches generated plans by trip parameters for faster subsequent loads

import type { GeneratedPlan, TravelPreferences } from '@/types/plan'

interface CacheEntry {
  createdAt: string
  expiresAt: string
  plan: GeneratedPlan
}

const CACHE_PREFIX = 'plan-cache-'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate a cache key from trip parameters
 * Uses a simple hash of the key parameters
 */
function generateCacheKey(
  destination: string,
  startDate: string,
  endDate: string,
  style: string,
  interests: string[]
): string {
  const normalized = [
    destination.toLowerCase().trim(),
    startDate,
    endDate,
    style,
    interests.sort().join(','),
  ].join('|')

  // Simple hash function
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return `${CACHE_PREFIX}${Math.abs(hash).toString(36)}`
}

/**
 * Get cached plan if it exists and hasn't expired
 */
export function getCachedPlan(
  destination: string,
  startDate: string,
  endDate: string,
  style: string,
  interests: string[]
): GeneratedPlan | null {
  if (typeof window === 'undefined') return null

  const key = generateCacheKey(destination, startDate, endDate, style, interests)

  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const entry: CacheEntry = JSON.parse(cached)

    // Check if expired
    if (new Date(entry.expiresAt) < new Date()) {
      localStorage.removeItem(key)
      return null
    }

    console.log('[cache] Hit for', destination, '- created', entry.createdAt)
    return entry.plan
  } catch (error) {
    console.error('[cache] Error reading cache:', error)
    return null
  }
}

/**
 * Cache a generated plan
 */
export function cachePlan(
  plan: GeneratedPlan,
  destination: string,
  startDate: string,
  endDate: string,
  style: string,
  interests: string[]
): void {
  if (typeof window === 'undefined') return

  const key = generateCacheKey(destination, startDate, endDate, style, interests)

  const entry: CacheEntry = {
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    plan,
  }

  try {
    localStorage.setItem(key, JSON.stringify(entry))
    console.log('[cache] Stored plan for', destination)
  } catch (error) {
    console.error('[cache] Error storing cache:', error)
    // If storage is full, try to clear old entries
    clearExpiredCache()
  }
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache(): void {
  if (typeof window === 'undefined') return

  const now = new Date()
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(CACHE_PREFIX)) continue

    try {
      const cached = localStorage.getItem(key)
      if (!cached) continue

      const entry: CacheEntry = JSON.parse(cached)
      if (new Date(entry.expiresAt) < now) {
        keysToRemove.push(key)
      }
    } catch {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))

  if (keysToRemove.length > 0) {
    console.log('[cache] Cleared', keysToRemove.length, 'expired entries')
  }
}

/**
 * Clear all cached plans
 */
function clearAllCache(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))
  console.log('[cache] Cleared all', keysToRemove.length, 'cached plans')
}

/**
 * Get cache statistics
 */
function getCacheStats(): { count: number; totalSize: number } {
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
