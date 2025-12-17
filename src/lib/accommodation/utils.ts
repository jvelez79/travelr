import type { Accommodation, AccommodationStatus } from "@/types/accommodation"

// Status priority: confirmed > pending > suggested > cancelled
const STATUS_PRIORITY: Record<AccommodationStatus, number> = {
  confirmed: 0,
  pending: 1,
  suggested: 2,
  cancelled: 3,
}

/**
 * Gets the accommodation for a specific day.
 *
 * Priority logic:
 * 1. confirmed (user booked) > pending (user selected) > suggested (AI) > cancelled
 * 2. If same status, prefer the one with earliest checkIn
 *
 * Logic:
 * - Day 1 never shows an accommodation (user just arrived)
 * - An accommodation applies if: dayDate > checkIn AND dayDate <= checkOut
 *
 * @param dayDate - ISO date string of the day (e.g., "2024-12-14")
 * @param dayNumber - The day number in the itinerary (1-indexed)
 * @param accommodations - Array of accommodations from the plan
 * @returns The applicable accommodation with highest priority, or null
 */
export function getAccommodationForDay(
  dayDate: string,
  dayNumber: number,
  accommodations: Accommodation[]
): Accommodation | null {
  // Day 1 never has an accommodation origin (user just arrived)
  if (dayNumber === 1) {
    return null
  }

  // No accommodations to check
  if (!accommodations || accommodations.length === 0) {
    return null
  }

  const currentDate = new Date(dayDate)

  // Filter accommodations where the user would have stayed the night before
  // dayDate > checkIn (checked in before this day)
  // dayDate <= checkOut (hasn't checked out yet, or checking out today)
  // Exclude cancelled accommodations
  const applicableAccommodations = accommodations
    .filter((acc) => acc.status !== "cancelled")
    .filter((acc) => {
      const checkInDate = new Date(acc.checkIn)
      const checkOutDate = new Date(acc.checkOut)
      return currentDate > checkInDate && currentDate <= checkOutDate
    })

  if (applicableAccommodations.length === 0) {
    return null
  }

  // Sort by priority (status first, then checkIn date)
  applicableAccommodations.sort((a, b) => {
    // First compare by status priority
    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (priorityDiff !== 0) {
      return priorityDiff
    }
    // If same status, prefer earlier checkIn
    return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  })

  return applicableAccommodations[0]
}

/**
 * Gets all accommodations that apply to a specific day
 * Useful for showing alternatives or conflicts
 */
export function getAllAccommodationsForDay(
  dayDate: string,
  dayNumber: number,
  accommodations: Accommodation[]
): Accommodation[] {
  if (dayNumber === 1) {
    return []
  }

  if (!accommodations || accommodations.length === 0) {
    return []
  }

  const currentDate = new Date(dayDate)

  return accommodations
    .filter((acc) => acc.status !== "cancelled")
    .filter((acc) => {
      const checkInDate = new Date(acc.checkIn)
      const checkOutDate = new Date(acc.checkOut)
      return currentDate > checkInDate && currentDate <= checkOutDate
    })
    .sort((a, b) => {
      const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
      if (priorityDiff !== 0) {
        return priorityDiff
      }
      return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    })
}

/**
 * Checks if an accommodation has valid coordinates for transport calculation
 */
export function hasAccommodationCoordinates(
  accommodation: Accommodation | null
): boolean {
  return !!(
    accommodation?.placeData?.coordinates?.lat &&
    accommodation?.placeData?.coordinates?.lng
  )
}

/**
 * Get coordinates from an accommodation (for transport calculation)
 */
export function getAccommodationCoordinates(
  accommodation: Accommodation | null
): { lat: number; lng: number } | null {
  if (!accommodation?.placeData?.coordinates) {
    return null
  }
  return accommodation.placeData.coordinates
}

/**
 * Check if there's a gap in accommodation coverage between trip dates
 */
export function hasAccommodationGap(
  startDate: string,
  endDate: string,
  accommodations: Accommodation[]
): boolean {
  const activeAccommodations = accommodations.filter((a) => a.status !== "cancelled")

  if (activeAccommodations.length === 0) {
    return true
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = new Date(start)

  while (current < end) {
    const dateStr = current.toISOString().split("T")[0]

    const isCovered = activeAccommodations.some((a) =>
      dateStr >= a.checkIn && dateStr < a.checkOut
    )

    if (!isCovered) {
      return true
    }

    current.setDate(current.getDate() + 1)
  }

  return false
}
