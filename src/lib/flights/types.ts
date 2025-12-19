/**
 * Types for flight search functionality using Skyscanner redirect
 */

// ============================================================================
// Search Parameters
// ============================================================================

export interface FlightSearchParams {
  origin: string // IATA code: "SJU"
  destination: string // IATA code: "SJO"
  outboundDate: string // ISO date: "2025-03-07"
  inboundDate?: string // ISO date: "2025-03-13" (optional for one-way)
  adults: number
  children?: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
}

// ============================================================================
// Skyscanner Deeplink Parameters
// ============================================================================

export interface SkyscannerDeeplinkParams extends FlightSearchParams {
  // Additional params for URL generation
  preferdirects?: boolean
  ref?: string
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// ============================================================================
// Constants
// ============================================================================

export const CABIN_CLASSES = {
  economy: 'economy',
  premium_economy: 'premium economy',
  business: 'business',
  first: 'first',
} as const

export const SKYSCANNER_BASE_URL = 'https://www.skyscanner.com/transport/flights'
