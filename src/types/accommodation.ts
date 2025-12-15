// Types for accommodation reservations (confirmed bookings)
// Separate from AccommodationSuggestion which is for AI-generated suggestions

/**
 * Type of accommodation
 */
export type AccommodationReservationType =
  | 'hotel'
  | 'airbnb'
  | 'hostel'
  | 'resort'
  | 'vacation_rental'
  | 'apartment'
  | 'other'

/**
 * Reservation status
 */
export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled'

/**
 * Source of the reservation - how it was added to the system
 */
export type ReservationSource =
  | 'email_forward'    // User forwarded confirmation email
  | 'receipt_upload'   // User uploaded PDF/image
  | 'gmail_sync'       // Auto-synced from Gmail (future)
  | 'manual_entry'     // User entered manually
  | 'hotel_search'     // Selected from hotel search

/**
 * Confirmed accommodation reservation
 * Different from AccommodationSuggestion which is for AI suggestions
 */
export interface AccommodationReservation {
  id: string
  tripId: string

  // Basic info
  name: string
  type: AccommodationReservationType
  address: string
  city: string
  country: string

  // Location for map
  location?: {
    lat: number
    lng: number
  }

  // Dates and times
  checkIn: string         // ISO date
  checkOut: string        // ISO date
  checkInTime?: string    // "3:00 PM"
  checkOutTime?: string   // "11:00 AM"
  nights: number

  // Pricing
  pricePerNight?: number
  totalPrice?: number
  currency: string

  // Confirmation details
  confirmationNumber?: string
  bookingPlatform?: string  // "Booking.com", "Expedia", "Airbnb"
  bookingUrl?: string

  // Contact
  phone?: string
  email?: string

  // Guests
  guestNames?: string[]  // Names on the reservation

  // Amenities
  amenities?: string[]

  // Images
  images?: string[]

  // Status and metadata
  status: ReservationStatus
  source: ReservationSource

  // Source data (for debugging/audit)
  sourceData?: {
    rawEmailId?: string
    originalFile?: string
    extractedAt?: string
    confidence?: number   // 0-1, AI extraction confidence
  }

  // User notes
  notes?: string

  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Data extracted by AI from email/receipt
 */
export interface ExtractedAccommodationData {
  name?: string
  type?: AccommodationReservationType
  address?: string
  city?: string
  country?: string
  checkIn?: string
  checkOut?: string
  checkInTime?: string
  checkOutTime?: string
  pricePerNight?: number
  totalPrice?: number
  currency?: string
  confirmationNumber?: string
  bookingPlatform?: string
  phone?: string
  email?: string
  guestNames?: string[]  // Names on the reservation
  amenities?: string[]
  confidence: number  // 0-1, how confident AI is in the extraction
  error?: string      // If extraction failed
}

/**
 * Form data for manual accommodation entry
 */
export interface AccommodationFormData {
  name: string
  type: AccommodationReservationType
  address?: string
  city: string
  country: string
  checkIn: string
  checkOut: string
  checkInTime?: string
  checkOutTime?: string
  pricePerNight?: number
  totalPrice?: number
  currency: string
  confirmationNumber?: string
  bookingPlatform?: string
  notes?: string
}

/**
 * Helper: Calculate nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Helper: Create a new reservation from extracted data
 */
export function createReservationFromExtracted(
  tripId: string,
  extracted: ExtractedAccommodationData,
  source: ReservationSource
): AccommodationReservation {
  const now = new Date().toISOString()
  const nights = extracted.checkIn && extracted.checkOut
    ? calculateNights(extracted.checkIn, extracted.checkOut)
    : 0

  return {
    id: crypto.randomUUID(),
    tripId,
    name: extracted.name || 'Unknown Hotel',
    type: extracted.type || 'hotel',
    address: extracted.address || '',
    city: extracted.city || '',
    country: extracted.country || '',
    checkIn: extracted.checkIn || '',
    checkOut: extracted.checkOut || '',
    checkInTime: extracted.checkInTime,
    checkOutTime: extracted.checkOutTime,
    nights,
    pricePerNight: extracted.pricePerNight,
    totalPrice: extracted.totalPrice,
    currency: extracted.currency || 'USD',
    confirmationNumber: extracted.confirmationNumber,
    bookingPlatform: extracted.bookingPlatform,
    phone: extracted.phone,
    email: extracted.email,
    guestNames: extracted.guestNames,
    amenities: extracted.amenities,
    status: 'pending', // User must confirm
    source,
    sourceData: {
      extractedAt: now,
      confidence: extracted.confidence,
    },
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Helper: Get display name for reservation source
 */
export function getSourceDisplayName(source: ReservationSource): string {
  const names: Record<ReservationSource, string> = {
    email_forward: 'Email Forward',
    receipt_upload: 'Uploaded Receipt',
    gmail_sync: 'Gmail Sync',
    manual_entry: 'Manual Entry',
    hotel_search: 'Hotel Search',
  }
  return names[source]
}

/**
 * Helper: Get icon name for reservation source
 */
export function getSourceIcon(source: ReservationSource): string {
  const icons: Record<ReservationSource, string> = {
    email_forward: 'mail-forward',
    receipt_upload: 'upload',
    gmail_sync: 'refresh-cw',
    manual_entry: 'edit',
    hotel_search: 'search',
  }
  return icons[source]
}
