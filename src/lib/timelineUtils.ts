// Timeline utilities for Day Planner Visual

import type { TimelineEntry } from "@/types/plan"
import { parseTime, formatTime, estimateDuration } from "./timeUtils"

// Constants
export const PIXELS_PER_HOUR = 60 // 1px = 1 minute
const START_HOUR = 6 // 6:00 AM
const END_HOUR = 22 // 10:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR // 16 hours
export const TOTAL_HEIGHT = TOTAL_HOURS * PIXELS_PER_HOUR // 960px
const SNAP_INTERVAL = 15 // 15-minute snapping

/**
 * Convert time string to pixel position from top of timeline
 */
function timeToPixels(time: string): number {
  const minutes = parseTime(time)
  if (minutes === null) return 0

  // Minutes from start of timeline (6:00 AM)
  const startMinutes = START_HOUR * 60
  const offsetMinutes = minutes - startMinutes

  // Convert to pixels (1px = 1min at 60px/hour)
  return offsetMinutes
}

/**
 * Convert pixel position to time string
 */
export function pixelsToTime(pixels: number): string {
  // Clamp to valid range
  pixels = Math.max(0, Math.min(pixels, TOTAL_HEIGHT))

  // Convert pixels to minutes from start
  const offsetMinutes = pixels
  const totalMinutes = (START_HOUR * 60) + offsetMinutes

  return formatTime(totalMinutes)
}

/**
 * Snap minutes to nearest interval (default 15 min)
 */
function snapToInterval(minutes: number, interval: number = SNAP_INTERVAL): number {
  return Math.round(minutes / interval) * interval
}

/**
 * Snap pixel position to nearest interval
 */
export function snapPixelsToInterval(pixels: number, interval: number = SNAP_INTERVAL): number {
  return snapToInterval(pixels, interval)
}

/**
 * Get activity bounds in minutes from midnight
 */
function getActivityBounds(activity: TimelineEntry): { start: number; end: number } {
  const startMinutes = parseTime(activity.time) ?? START_HOUR * 60
  const duration = activity.durationMinutes ?? estimateDuration(activity.icon)
  const endMinutes = startMinutes + duration

  return { start: startMinutes, end: endMinutes }
}

/**
 * Get activity bounds in pixels from timeline top
 */
export function getActivityPixelBounds(activity: TimelineEntry): { top: number; height: number } {
  const { start, end } = getActivityBounds(activity)

  // Convert to pixels relative to timeline start
  const startOffset = START_HOUR * 60
  const top = start - startOffset
  const height = Math.max(end - start, 30) // Minimum 30px height (30 min)

  return { top: Math.max(0, top), height }
}

/**
 * Check if two activities overlap
 */
function activitiesOverlap(a: TimelineEntry, b: TimelineEntry): boolean {
  const boundsA = getActivityBounds(a)
  const boundsB = getActivityBounds(b)

  // Two activities overlap if: start1 < end2 AND end1 > start2
  return boundsA.start < boundsB.end && boundsA.end > boundsB.start
}

/**
 * Conflict map: activityId -> array of conflicting activity IDs
 */
type ConflictMap = Map<string, string[]>

/**
 * Detect all conflicts between activities
 */
export function detectConflicts(activities: TimelineEntry[]): ConflictMap {
  const conflicts: ConflictMap = new Map()

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i]
    const aConflicts: string[] = []

    for (let j = 0; j < activities.length; j++) {
      if (i === j) continue

      const b = activities[j]
      if (activitiesOverlap(a, b)) {
        aConflicts.push(b.id)
      }
    }

    if (aConflicts.length > 0) {
      conflicts.set(a.id, aConflicts)
    }
  }

  return conflicts
}

/**
 * Check if an activity has conflicts
 */
export function hasConflict(activityId: string, conflicts: ConflictMap): boolean {
  return conflicts.has(activityId)
}

/**
 * Generate hour labels for the timeline
 */
export function getHourLabels(): Array<{ hour: number; label: string; top: number }> {
  const labels: Array<{ hour: number; label: string; top: number }> = []

  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const period = hour >= 12 ? "PM" : "AM"
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const label = `${hour12}:00 ${period}`
    const top = (hour - START_HOUR) * PIXELS_PER_HOUR

    labels.push({ hour, label, top })
  }

  return labels
}

/**
 * Update activity time based on drop position
 */
function updateActivityTime(activity: TimelineEntry, newTopPixels: number): TimelineEntry {
  // Snap to 15-minute intervals
  const snappedPixels = snapPixelsToInterval(newTopPixels)
  const newTime = pixelsToTime(snappedPixels)

  return {
    ...activity,
    time: newTime,
  }
}
