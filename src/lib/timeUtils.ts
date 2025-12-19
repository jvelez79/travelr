// Time utilities for activity scheduling

import type { TimelineEntry } from "@/types/plan"

/**
 * Parse a time string like "9:00 AM" or "9:30 PM" to minutes since midnight
 */
export function parseTime(timeStr: string): number | null {
  if (!timeStr) return null

  // Handle range format "9:00-11:00 AM" - take the start time
  const rangeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*-\s*\d{1,2}:\d{2})?\s*(AM|PM)?$/i)
  if (!rangeMatch) {
    // Try simpler format "9:00" (24h) or "9:00 AM"
    const simpleMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (!simpleMatch) return null

    let hours = parseInt(simpleMatch[1], 10)
    const minutes = parseInt(simpleMatch[2], 10)
    const period = simpleMatch[3]?.toUpperCase()

    if (period === "PM" && hours !== 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0

    return hours * 60 + minutes
  }

  let hours = parseInt(rangeMatch[1], 10)
  const minutes = parseInt(rangeMatch[2], 10)
  const period = rangeMatch[3]?.toUpperCase()

  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0

  return hours * 60 + minutes
}

/**
 * Format minutes since midnight to "9:00 AM" format
 */
export function formatTime(totalMinutes: number): string {
  // Clamp to valid range
  totalMinutes = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1))

  const hours24 = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const period = hours24 >= 12 ? "PM" : "AM"
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
}

/**
 * Estimate duration in minutes based on activity icon/type
 */
export function estimateDuration(icon?: string): number {
  const durations: Record<string, number> = {
    "✈️": 0,      // Flight arrival - point in time
    "🛫": 0,      // Flight departure - point in time
    "🚗": 60,     // Transport - 1 hour default
    "🏨": 30,     // Hotel check-in/out - 30 min
    "🍽️": 75,     // Meal - 1 hour 15 min
    "🍳": 45,     // Breakfast - 45 min
    "☕": 30,     // Coffee break - 30 min
    "🎯": 120,    // Activity - 2 hours
    "🏖️": 180,    // Beach - 3 hours
    "🌋": 180,    // Nature/hiking - 3 hours
    "🛒": 90,     // Shopping - 1.5 hours
    "📸": 30,     // Photo stop - 30 min
    "🎭": 120,    // Culture - 2 hours
    "💤": 0,      // Rest - end of day, no duration
    "🌙": 0,      // Night/sleep - no duration
    "🏊": 120,    // Swimming/water activity - 2 hours
    "🎒": 15,     // Packing/luggage - 15 min
  }

  return durations[icon || ""] ?? 60 // Default 1 hour
}

/**
 * Check if an activity type should have fixed time (not adjusted during reorder)
 */
export function isTypicallyFixedTime(icon?: string): boolean {
  const fixedTimeIcons = ["✈️", "🛫"] // Flights are typically fixed
  return fixedTimeIcons.includes(icon || "")
}

/**
 * Recalculate timeline times after reordering
 * Maintains the first activity's time and adjusts subsequent activities
 * based on durations.
 *
 * @param activities - The timeline entries to recalculate
 * @param gapMinutes - Gap between activities (default 15 min)
 * @returns New array with recalculated times
 */
export function recalculateTimeline(
  activities: TimelineEntry[],
  gapMinutes: number = 15
): TimelineEntry[] {
  if (activities.length === 0) return []

  const result: TimelineEntry[] = []
  let currentTime: number | null = null

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i]

    if (i === 0) {
      // First activity keeps its original time
      currentTime = parseTime(activity.time)
      result.push({ ...activity })
    } else if (activity.isFixedTime) {
      // Fixed time activities keep their time
      result.push({ ...activity })
      currentTime = parseTime(activity.time)
    } else {
      // Calculate new time based on previous activity
      if (currentTime !== null) {
        const previousActivity = result[result.length - 1]
        const previousDuration = previousActivity.durationMinutes ?? estimateDuration(previousActivity.icon)

        // New time = previous start + previous duration + gap
        const newTime: number = currentTime + previousDuration + (previousDuration > 0 ? gapMinutes : 0)
        currentTime = newTime

        result.push({
          ...activity,
          time: formatTime(newTime),
        })
      } else {
        result.push({ ...activity })
      }
    }

    // Update currentTime for next iteration
    if (currentTime !== null && result[result.length - 1]) {
      const lastActivity = result[result.length - 1]
      currentTime = parseTime(lastActivity.time) ?? currentTime
    }
  }

  return result
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) return "—"
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hora" : `${hours} horas`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Parse duration string to minutes
 * Handles formats like "30", "30 min", "1h", "1h 30m", "1.5 horas"
 */
function parseDuration(durationStr: string): number | null {
  if (!durationStr) return null

  const str = durationStr.trim().toLowerCase()

  // Just a number - assume minutes
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10)
  }

  // "X min" or "X minutos"
  const minMatch = str.match(/^(\d+)\s*(?:min|minutos?)$/i)
  if (minMatch) {
    return parseInt(minMatch[1], 10)
  }

  // "X h" or "X hora(s)"
  const hourMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:h|hora|horas)$/i)
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60)
  }

  // "Xh Ym" format
  const combinedMatch = str.match(/^(\d+)\s*h\s*(\d+)\s*m$/i)
  if (combinedMatch) {
    return parseInt(combinedMatch[1], 10) * 60 + parseInt(combinedMatch[2], 10)
  }

  return null
}
