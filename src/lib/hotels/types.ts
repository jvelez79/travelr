/**
 * Types for hotel search functionality using SerpAPI
 */

// ============================================================================
// Search Parameters
// ============================================================================

export interface HotelSearchParams {
  destination: string
  checkIn: string // ISO date: "2025-12-15"
  checkOut: string // ISO date: "2025-12-17"
  adults: number
  children?: number
  currency?: string // "USD", "EUR", etc.
  gl?: string // Country code for Google: "us", "cr", etc.
  hl?: string // Language: "en", "es", etc.
}

// ============================================================================
// Hotel Result (our internal format)
// ============================================================================

export interface HotelResult {
  id: string
  name: string
  type: string // "Hotel", "Resort", "Hostel", "Apartment"
  hotelClass?: number // 1-5 stars

  // Pricing
  price: {
    perNight: number
    total: number
    currency: string
    originalPrice?: number // If there's a discount
    deal?: string // "23% less than usual"
  }

  // Location
  location: {
    lat: number
    lng: number
    address: string
    area?: string // "La Fortuna", "Downtown"
  }

  // Ratings & Reviews
  rating?: number // 4.5
  reviewCount?: number // 850

  // Details
  amenities: string[] // ["Free WiFi", "Pool", "Parking"]
  images: string[]
  description?: string

  // Check-in/out
  checkInTime?: string // "3:00 PM"
  checkOutTime?: string // "11:00 AM"

  // Booking links from different OTAs
  bookingLinks: BookingLink[]

  // Google link
  googleLink?: string

  // Raw data for debugging
  _raw?: any
}

export interface BookingLink {
  provider: string // "Booking.com", "Expedia", "Hotels.com"
  price: number
  currency: string
  url: string
  deal?: string
  logo?: string
}

// ============================================================================
// SerpAPI Response Types (for transformation)
// ============================================================================

export interface SerpAPIHotelResponse {
  search_metadata: {
    id: string
    status: string
    created_at: string
    processed_at: string
    total_time_taken: number
  }
  search_parameters: {
    engine: string
    q: string
    check_in_date: string
    check_out_date: string
    adults: string
    currency: string
    gl: string
    hl: string
  }
  search_information?: {
    total_results?: number
  }
  properties: SerpAPIProperty[]
}

export interface SerpAPIProperty {
  type: string // "Hotel"
  name: string
  description?: string
  link: string
  gps_coordinates?: {
    latitude: number
    longitude: number
  }
  check_in_time?: string
  check_out_time?: string
  rate_per_night?: {
    lowest: string // "$120"
    extracted_lowest: number
    before_taxes_fees?: string
    extracted_before_taxes_fees?: number
  }
  total_rate?: {
    lowest: string // "$240"
    extracted_lowest: number
    before_taxes_fees?: string
    extracted_before_taxes_fees?: number
  }
  deal?: string // "23% less than usual"
  hotel_class?: string // "4-star hotel"
  extracted_hotel_class?: number
  images?: Array<{
    thumbnail: string
    original_image: string
  }>
  overall_rating?: number
  reviews?: number
  location_rating?: number
  amenities?: string[]
  excluded_amenities?: string[]
  essential_info?: string[]
  property_token?: string
  serpapi_property_details_link?: string
  nearby_places?: Array<{
    name: string
    transportations: Array<{
      type: string
      duration: string
    }>
  }>
  hotel_class_explanation?: string
  prices?: Array<{
    source: string
    logo?: string
    num_guests?: string
    rate_per_night?: {
      lowest: string
      extracted_lowest: number
      before_taxes_fees?: string
      extracted_before_taxes_fees?: number
    }
    total_rate?: {
      lowest: string
      extracted_lowest: number
      before_taxes_fees?: string
      extracted_before_taxes_fees?: number
    }
    deal?: string
    link?: string
  }>
}

// ============================================================================
// Filter & Sort Options
// ============================================================================

export interface HotelFilters {
  priceRange?: {
    min: number
    max: number
  }
  hotelClass?: number[] // [3, 4, 5]
  amenities?: string[] // ["WiFi", "Pool"]
  rating?: number // minimum rating
  types?: string[] // ["Hotel", "Resort"]
}

export type HotelSortOption =
  | "relevance"
  | "price_low_to_high"
  | "price_high_to_low"
  | "rating_high_to_low"
  | "rating_low_to_high"

// ============================================================================
// Search Result
// ============================================================================

export interface HotelSearchResult {
  hotels: HotelResult[]
  total: number
  searchParams: HotelSearchParams
  searchId?: string
  timestamp: string
}

// ============================================================================
// Error Types
// ============================================================================

export class HotelSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = "HotelSearchError"
  }
}

// ============================================================================
// Constants
// ============================================================================

export const COMMON_AMENITIES = [
  "Free WiFi",
  "Pool",
  "Parking",
  "Breakfast included",
  "Air conditioning",
  "Restaurant",
  "Fitness center",
  "Spa",
  "Bar",
  "Room service",
  "Pet friendly",
  "Airport shuttle",
  "Business center",
  "Kitchen",
  "Laundry",
] as const

export const HOTEL_TYPES = [
  "Hotel",
  "Resort",
  "Hostel",
  "Apartment",
  "Guesthouse",
  "Vacation rental",
] as const

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CRC", symbol: "₡", name: "Costa Rican Colón" },
] as const
