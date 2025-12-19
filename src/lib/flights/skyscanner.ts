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
 * Convert ISO date (YYYY-MM-DD) to Skyscanner format (YYMMDD)
 * Example: "2025-03-07" → "250307"
 */
function formatDateForSkyscanner(isoDate: string): string {
  const date = new Date(isoDate)
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
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
 * https://www.skyscanner.com/transport/flights/{origin}/{destination}/{outboundDate}/{inboundDate}/
 * ?adults={adults}&children={children}&adultsv2={adults}&childrenv2={childrenAges}&infants=0
 * &cabinclass=economy&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&ref=home
 *
 * Example:
 * https://www.skyscanner.com/transport/flights/sju/sjo/250307/250313/
 * ?adults=2&adultsv2=2&cabinclass=economy&children=0&ref=home
 */
export function buildSkyscannerDeeplink(params: FlightSearchParams): string {
  // Validate params
  const validation = validateFlightSearchParams(params)
  if (!validation.isValid) {
    throw new Error(`Invalid flight search parameters: ${validation.errors.join(', ')}`)
  }

  // Format IATA codes (lowercase)
  const origin = params.origin.toLowerCase()
  const destination = params.destination.toLowerCase()

  // Format dates
  const outboundDate = formatDateForSkyscanner(params.outboundDate)
  const inboundDate = params.inboundDate
    ? formatDateForSkyscanner(params.inboundDate)
    : '' // Empty for one-way

  // Build base URL
  const basePath = `${SKYSCANNER_BASE_URL}/${origin}/${destination}/${outboundDate}`
  const pathWithReturn = inboundDate ? `${basePath}/${inboundDate}/` : `${basePath}/`

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

  return `${pathWithReturn}?${queryParams.toString()}`
}

/**
 * Open Skyscanner search in new tab
 */
export function openSkyscannerSearch(params: FlightSearchParams): void {
  const url = buildSkyscannerDeeplink(params)
  window.open(url, '_blank', 'noopener,noreferrer')
}
