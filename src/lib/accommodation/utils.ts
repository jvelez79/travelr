import type { AccommodationSuggestion } from "@/types/plan"

/**
 * Determines which accommodation the user stayed at the night before a given day.
 *
 * Logic:
 * - Day 1 of the trip never shows an accommodation (user hasn't stayed anywhere yet)
 * - An accommodation applies if: dayDate > checkIn AND dayDate <= checkOut
 * - If multiple accommodations match, return the one with the earliest checkIn date
 *
 * @param dayDate - ISO date string of the day (e.g., "2024-12-14")
 * @param dayNumber - The day number in the itinerary (1-indexed)
 * @param suggestions - Array of accommodation suggestions from the plan
 * @returns The applicable accommodation or null if none applies
 */
export function getAccommodationForDay(
  dayDate: string,
  dayNumber: number,
  suggestions: AccommodationSuggestion[]
): AccommodationSuggestion | null {
  // Day 1 never has an accommodation origin (user just arrived)
  if (dayNumber === 1) {
    return null
  }

  // No suggestions to check
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  const currentDate = new Date(dayDate)

  // Filter accommodations where the user would have stayed the night before
  // dayDate > checkIn (checked in before this day)
  // dayDate <= checkOut (hasn't checked out yet, or checking out today)
  const applicableAccommodations = suggestions.filter((acc) => {
    const checkInDate = new Date(acc.checkIn)
    const checkOutDate = new Date(acc.checkOut)

    return currentDate > checkInDate && currentDate <= checkOutDate
  })

  if (applicableAccommodations.length === 0) {
    return null
  }

  // If multiple match (edge case), take the one with earliest checkIn
  if (applicableAccommodations.length > 1) {
    applicableAccommodations.sort((a, b) => {
      return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    })
  }

  return applicableAccommodations[0]
}

/**
 * Checks if an accommodation has valid coordinates for transport calculation
 */
export function hasAccommodationCoordinates(
  accommodation: AccommodationSuggestion | null
): boolean {
  return !!(
    accommodation?.location?.lat &&
    accommodation?.location?.lng
  )
}
