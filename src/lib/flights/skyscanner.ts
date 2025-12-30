/**
 * Skyscanner deeplink generator for flight search redirect
 */

import type { FlightSearchParams, SkyscannerDeeplinkParams, ValidationResult } from './types'
import { SKYSCANNER_BASE_URL } from './types'

/**
 * Validate IATA airport code (3 letters)
 */
function isValidIATACode(code: string): boolean {
  return /^[A-Z]{3}$/i.test(code)
}

/**
 * Validate ISO date format (YYYY-MM-DD)
 */
function isValidISODate(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false

  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

/**
 * Convert ISO date (YYYY-MM-DD) to Skyscanner format
 * Returns { yearMonth: "2512", day: "19" } for query parameters
 * Example: "2025-12-19" → { yearMonth: "2512", day: "19" }
 *
 * Note: We parse the string directly instead of using Date object
 * to avoid timezone issues that can shift the day by -1
 */
function formatDateForSkyscanner(isoDate: string): { yearMonth: string; day: string } {
  // Parse ISO date string directly: "YYYY-MM-DD"
  const [yearFull, month, day] = isoDate.split('-')
  const year = yearFull.slice(-2)
  return {
    yearMonth: `${year}${month}`,
    day: day
  }
}

/**
 * Validate flight search parameters
 */
export function validateFlightSearchParams(params: FlightSearchParams): ValidationResult {
  const errors: string[] = []

  // Validate origin
  if (!params.origin) {
    errors.push('Origin airport code is required')
  } else if (!isValidIATACode(params.origin)) {
    errors.push('Origin must be a valid 3-letter IATA code (e.g., SJU)')
  }

  // Validate destination
  if (!params.destination) {
    errors.push('Destination airport code is required')
  } else if (!isValidIATACode(params.destination)) {
    errors.push('Destination must be a valid 3-letter IATA code (e.g., SJO)')
  }

  // Validate dates
  if (!params.outboundDate) {
    errors.push('Outbound date is required')
  } else if (!isValidISODate(params.outboundDate)) {
    errors.push('Outbound date must be in YYYY-MM-DD format')
  }

  if (params.inboundDate && !isValidISODate(params.inboundDate)) {
    errors.push('Inbound date must be in YYYY-MM-DD format')
  }

  // Validate passengers
  if (!params.adults || params.adults < 1) {
    errors.push('At least 1 adult is required')
  }

  if (params.children && params.children < 0) {
    errors.push('Number of children cannot be negative')
  }

  // Validate date logic
  if (params.outboundDate && params.inboundDate) {
    const outbound = new Date(params.outboundDate)
    const inbound = new Date(params.inboundDate)
    if (inbound < outbound) {
      errors.push('Return date cannot be before departure date')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Build Skyscanner deeplink URL for flight search
 *
 * URL Format:
 * https://www.skyscanner.com/transporte/vuelos/{origin}/{destination}/
 * ?adults={adults}&oym={YYMM}&selectedoday={DD}&iym={YYMM}&selectediday={DD}...
 *
 * Example:
 * https://www.skyscanner.com/transporte/vuelos/sju/gua/
 * ?adults=2&adultsv2=2&cabinclass=economy&children=0&oym=2512&selectedoday=19&iym=2601&selectediday=01
 */
function buildSkyscannerDeeplink(params: FlightSearchParams): string {
  // Validate params
  const validation = validateFlightSearchParams(params)
  if (!validation.isValid) {
    throw new Error(`Invalid flight search parameters: ${validation.errors.join(', ')}`)
  }

  // Format IATA codes (lowercase)
  const origin = params.origin.toLowerCase()
  const destination = params.destination.toLowerCase()

  // Build base URL (without dates in path)
  const basePath = `${SKYSCANNER_BASE_URL}/${origin}/${destination}/`

  // Build query parameters
  const queryParams = new URLSearchParams()

  queryParams.append('adults', params.adults.toString())
  queryParams.append('adultsv2', params.adults.toString())

  const children = params.children || 0
  queryParams.append('children', children.toString())

  queryParams.append('infants', '0')
  queryParams.append('cabinclass', params.cabinClass || 'economy')
  queryParams.append('preferdirects', 'false')
  queryParams.append('outboundaltsenabled', 'false')
  queryParams.append('inboundaltsenabled', 'false')
  queryParams.append('ref', 'home')

  // Add outbound date as query params
  const outbound = formatDateForSkyscanner(params.outboundDate)
  queryParams.append('oym', outbound.yearMonth)
  queryParams.append('selectedoday', outbound.day)

  // Add inbound date as query params (if round trip)
  if (params.inboundDate) {
    const inbound = formatDateForSkyscanner(params.inboundDate)
    queryParams.append('iym', inbound.yearMonth)
    queryParams.append('selectediday', inbound.day)
  }

  return `${basePath}?${queryParams.toString()}`
}

/**
 * Open Skyscanner search in new tab
 */
export function openSkyscannerSearch(params: FlightSearchParams): void {
  const url = buildSkyscannerDeeplink(params)
  window.open(url, '_blank', 'noopener,noreferrer')
}
