/**
 * Types for flight search functionality using Skyscanner redirect
 */

import type { FlightType } from '@/types/plan'

// ============================================================================
// Flight Data Extraction
// ============================================================================

export type FlightSource = 'email_forward' | 'receipt_upload' | 'manual_entry' | 'flight_search'

export interface ExtractedFlightData {
  airline?: string
  flightNumber?: string
  origin?: string                // IATA code
  originCity?: string
  destination?: string           // IATA code
  destinationCity?: string
  date?: string                  // ISO format
  arrivalDate?: string           // ISO format (if different day)
  departureTime?: string
  arrivalTime?: string
  confirmationNumber?: string
  passengerNames?: string[]
  seatNumber?: string
  pricePerPerson?: number
  totalPrice?: number
  currency?: string
  type?: FlightType
  confidence: number             // 0-1
  error?: string
}

export interface FlightSourceData {
  rawEmailId?: string
  originalFile?: string
  extractedAt?: string
  confidence?: number
}

// ============================================================================
// Multi-Flight Extraction (for documents with multiple flight segments)
// ============================================================================

/**
 * Shared metadata across all flights in a document
 */
export interface ExtractedDocumentMetadata {
  confirmationNumber?: string
  passengerNames?: string[]
  totalPrice?: number
  currency?: string
  bookingReference?: string
}

/**
 * Individual flight segment from multi-flight extraction
 */
export interface ExtractedFlightSegment {
  airline?: string
  flightNumber?: string
  origin?: string                // IATA code
  originCity?: string
  destination?: string           // IATA code
  destinationCity?: string
  date?: string                  // ISO format
  arrivalDate?: string           // ISO format (if different day)
  departureTime?: string
  arrivalTime?: string
  seatNumber?: string
  type?: FlightType              // outbound, return, connection
  segmentOrder: number           // 1, 2, 3... for chronological order
  pricePerPerson?: number
  confidence: number             // 0-1
}

/**
 * Complete extraction result with multiple flights
 */
export interface MultiFlightExtractionResult {
  flights: ExtractedFlightSegment[]
  sharedData: ExtractedDocumentMetadata
  overallConfidence: number
  error?: string
}

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

const CABIN_CLASSES = {
  economy: 'economy',
  premium_economy: 'premium economy',
  business: 'business',
  first: 'first',
} as const

export const SKYSCANNER_BASE_URL = 'https://www.skyscanner.com/transporte/vuelos'
