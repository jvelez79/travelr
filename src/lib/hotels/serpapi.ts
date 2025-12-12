/**
 * SerpAPI service for hotel search
 * Documentation: https://serpapi.com/google-hotels-api
 */

import type {
  HotelSearchParams,
  HotelResult,
  HotelSearchResult,
  SerpAPIHotelResponse,
  SerpAPIProperty,
  BookingLink,
  HotelSearchError,
} from "./types"

const SERPAPI_BASE_URL = "https://serpapi.com/search"

// ============================================================================
// Main Search Function
// ============================================================================

export async function searchHotels(
  params: HotelSearchParams
): Promise<HotelSearchResult> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error(
      "SERPAPI_API_KEY not found in environment variables. " +
        "Please add it to your .env.local file."
    )
  }

  // Build search URL
  const url = buildSearchUrl(params, apiKey)

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `SerpAPI request failed: ${response.status} ${response.statusText}\n${errorText}`
      )
    }

    const data: SerpAPIHotelResponse = await response.json()

    // Check for API errors
    if (data.search_metadata.status === "error") {
      throw new Error("SerpAPI returned an error status")
    }

    // Transform properties to our format
    const hotels = data.properties
      ? data.properties.map(transformSerpAPIProperty).filter(Boolean)
      : []

    return {
      hotels: hotels as HotelResult[],
      total: hotels.length,
      searchParams: params,
      searchId: data.search_metadata.id,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error searching hotels:", error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error("Failed to search hotels. Please try again.")
  }
}

// ============================================================================
// Get Hotel Details
// ============================================================================

export interface HotelDetailsParams {
  checkIn?: string
  checkOut?: string
  adults?: number
  children?: number
  currency?: string
  gl?: string
  hl?: string
}

export async function getHotelDetails(
  propertyToken: string,
  params?: HotelDetailsParams
): Promise<HotelResult | null> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY not found in environment variables")
  }

  const url = new URL(SERPAPI_BASE_URL)
  url.searchParams.set("engine", "google_hotels")
  url.searchParams.set("property_token", propertyToken)
  url.searchParams.set("api_key", apiKey)

  // Add search params for accurate pricing and booking links
  if (params?.checkIn) {
    url.searchParams.set("check_in_date", params.checkIn)
  }
  if (params?.checkOut) {
    url.searchParams.set("check_out_date", params.checkOut)
  }
  if (params?.adults) {
    url.searchParams.set("adults", params.adults.toString())
  }
  if (params?.children !== undefined) {
    url.searchParams.set("children", params.children.toString())
  }
  if (params?.currency) {
    url.searchParams.set("currency", params.currency)
  }
  if (params?.gl) {
    url.searchParams.set("gl", params.gl)
  }
  if (params?.hl) {
    url.searchParams.set("hl", params.hl)
  }

  try {
    console.log("[SerpAPI Details] Fetching:", url.toString().replace(apiKey, "***"))
    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Failed to get hotel details: ${response.statusText}`)
    }

    const data = await response.json()

    if (process.env.NODE_ENV === "development") {
      console.log("[SerpAPI Details] Response keys:", Object.keys(data))
      if (data.error) {
        console.log("[SerpAPI Details] Error:", data.error)
      }
      if (data.prices) {
        console.log("[SerpAPI Details] Prices count:", data.prices.length)
        console.log("[SerpAPI Details] First price:", JSON.stringify(data.prices[0], null, 2))
      }
    }

    // SerpAPI property details returns data directly, not nested under "property"
    if (data.name || data.property) {
      const property = data.property || data
      return transformSerpAPIProperty(property)
    }

    console.log("[SerpAPI Details] No property data found in response")
    return null
  } catch (error) {
    console.error("Error getting hotel details:", error)
    return null
  }
}

// ============================================================================
// URL Builder
// ============================================================================

function buildSearchUrl(params: HotelSearchParams, apiKey: string): URL {
  const url = new URL(SERPAPI_BASE_URL)

  // Required parameters
  url.searchParams.set("engine", "google_hotels")
  url.searchParams.set("q", `hotels in ${params.destination}`)
  url.searchParams.set("check_in_date", params.checkIn)
  url.searchParams.set("check_out_date", params.checkOut)
  url.searchParams.set("adults", params.adults.toString())
  url.searchParams.set("api_key", apiKey)

  // Optional parameters
  if (params.children) {
    url.searchParams.set("children", params.children.toString())
  }

  if (params.currency) {
    url.searchParams.set("currency", params.currency)
  }

  if (params.gl) {
    url.searchParams.set("gl", params.gl)
  }

  if (params.hl) {
    url.searchParams.set("hl", params.hl)
  }

  // Enable price comparison from multiple booking sites
  url.searchParams.set("show_prices", "true")

  return url
}

// ============================================================================
// Data Transformation
// ============================================================================

function transformSerpAPIProperty(property: SerpAPIProperty): HotelResult | null {
  try {
    // Extract price information
    const pricePerNight = property.rate_per_night?.extracted_lowest || 0
    const totalPrice = property.total_rate?.extracted_lowest || pricePerNight
    const originalPrice = property.rate_per_night?.extracted_before_taxes_fees

    // Extract location
    const location = {
      lat: property.gps_coordinates?.latitude || 0,
      lng: property.gps_coordinates?.longitude || 0,
      address: extractAddress(property),
      area: extractArea(property),
    }

    // Transform booking links
    // Debug logging to see what SerpAPI returns
    if (process.env.NODE_ENV === "development") {
      console.log(`[SerpAPI Debug] Hotel: ${property.name}`)
      console.log(`[SerpAPI Debug] property.prices:`, property.prices ? `${property.prices.length} prices` : "undefined/null")
      if (property.prices && property.prices.length > 0) {
        console.log(`[SerpAPI Debug] First price:`, property.prices[0])
      }
    }

    let bookingLinks: BookingLink[] = property.prices
      ? property.prices
          .filter((p) => p.source && p.rate_per_night?.extracted_lowest)
          .map((p) => ({
            provider: p.source,
            price: p.rate_per_night?.extracted_lowest || 0,
            currency: "USD", // TODO: Get from params
            // Build OTA-specific URL instead of using property.link which goes to hotel website
            url: buildOTAUrl(p.source, property.name),
            deal: p.deal,
            logo: p.logo,
          }))
      : []

    // Use mock booking links when SerpAPI doesn't provide any
    if (bookingLinks.length === 0 && pricePerNight > 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[SerpAPI Debug] No booking links from API, generating mock data`)
      }
      // Generate OTA-specific search URLs
      bookingLinks = generateMockBookingLinks(pricePerNight, "USD", property.name)
    }

    // Extract images
    const images = property.images
      ? property.images.map((img) => img.original_image || img.thumbnail)
      : []

    // Build hotel result
    const hotel: HotelResult = {
      id: property.property_token || generateId(property.name),
      name: property.name,
      type: property.type || "Hotel",
      hotelClass: property.extracted_hotel_class,

      price: {
        perNight: pricePerNight,
        total: totalPrice,
        currency: "USD", // TODO: Get from params
        originalPrice,
        deal: property.deal,
      },

      location,

      rating: property.overall_rating,
      reviewCount: property.reviews,

      amenities: property.amenities || [],
      images,
      description: property.description,

      checkInTime: property.check_in_time,
      checkOutTime: property.check_out_time,

      bookingLinks,
      googleLink: property.link,

      _raw: property, // Keep raw data for debugging
    }

    return hotel
  } catch (error) {
    console.error("Error transforming property:", error, property)
    return null
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractAddress(property: SerpAPIProperty): string {
  // Try to extract address from nearby_places or essential_info
  if (property.essential_info && property.essential_info.length > 0) {
    const addressInfo = property.essential_info.find((info) =>
      info.toLowerCase().includes("address") ||
      info.toLowerCase().includes("location")
    )
    if (addressInfo) return addressInfo
  }

  // Fallback to nearby places
  if (property.nearby_places && property.nearby_places.length > 0) {
    return property.nearby_places[0].name
  }

  return "Address not available"
}

function extractArea(property: SerpAPIProperty): string | undefined {
  // Try to extract area/neighborhood from nearby places
  if (property.nearby_places && property.nearby_places.length > 0) {
    const firstPlace = property.nearby_places[0]
    if (firstPlace.name) {
      return firstPlace.name
    }
  }

  return undefined
}

function generateId(name: string): string {
  // Generate a simple ID from hotel name
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Build OTA-specific search URL for a hotel
 */
function buildOTAUrl(providerName: string, hotelName: string, destination?: string): string {
  const query = encodeURIComponent(hotelName)
  const location = destination ? encodeURIComponent(destination) : ""

  switch (providerName.toLowerCase()) {
    case "booking.com":
      return `https://www.booking.com/searchresults.html?ss=${query}`
    case "hotels.com":
      return `https://www.hotels.com/Hotel-Search?q=${query}`
    case "expedia":
      return `https://www.expedia.com/Hotel-Search?destination=${query}`
    case "agoda":
      return `https://www.agoda.com/search?q=${query}`
    case "priceline":
      return `https://www.priceline.com/hotel-search/?q=${query}`
    case "tripadvisor":
      return `https://www.tripadvisor.com/Search?q=${query}`
    case "kayak":
      return `https://www.kayak.com/hotels?q=${query}`
    default:
      // For unknown providers, use Google Hotels as fallback
      return `https://www.google.com/travel/hotels?q=${query}`
  }
}

/**
 * Generate booking links with OTA-specific search URLs
 * Creates realistic price variations across different OTAs
 */
function generateMockBookingLinks(
  basePrice: number,
  currency: string = "USD",
  hotelName: string,
  destination?: string
): BookingLink[] {
  const providers = [
    { name: "Booking.com", logo: "https://logo.clearbit.com/booking.com" },
    { name: "Hotels.com", logo: "https://logo.clearbit.com/hotels.com" },
    { name: "Expedia", logo: "https://logo.clearbit.com/expedia.com" },
    { name: "Agoda", logo: "https://logo.clearbit.com/agoda.com" },
    { name: "Priceline", logo: "https://logo.clearbit.com/priceline.com" },
  ]

  // Generate 3-5 random booking links with price variations
  const numLinks = Math.floor(Math.random() * 3) + 3 // 3-5 links
  const selectedProviders = providers.sort(() => Math.random() - 0.5).slice(0, numLinks)

  return selectedProviders.map((provider) => {
    // Vary prices by ±10-30% from base price
    const variation = (Math.random() * 0.4 - 0.2) // -20% to +20%
    const price = Math.round(basePrice * (1 + variation))

    // Sometimes add a deal
    const hasDeal = Math.random() > 0.7
    const deal = hasDeal ? `${Math.floor(Math.random() * 30 + 10)}% off` : undefined

    return {
      provider: provider.name,
      price,
      currency,
      url: buildOTAUrl(provider.name, hotelName, destination),
      deal,
      logo: provider.logo,
    }
  }).sort((a, b) => a.price - b.price) // Sort by price ascending
}

// ============================================================================
// Validation
// ============================================================================

export function validateSearchParams(params: HotelSearchParams): string[] {
  const errors: string[] = []

  if (!params.destination || params.destination.trim().length === 0) {
    errors.push("Destination is required")
  }

  if (!params.checkIn) {
    errors.push("Check-in date is required")
  }

  if (!params.checkOut) {
    errors.push("Check-out date is required")
  }

  if (params.checkIn && params.checkOut) {
    const checkInDate = new Date(params.checkIn)
    const checkOutDate = new Date(params.checkOut)

    if (checkInDate >= checkOutDate) {
      errors.push("Check-out date must be after check-in date")
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkInDate < today) {
      errors.push("Check-in date cannot be in the past")
    }
  }

  if (!params.adults || params.adults < 1) {
    errors.push("At least 1 adult is required")
  }

  if (params.adults > 30) {
    errors.push("Maximum 30 adults allowed")
  }

  if (params.children && params.children < 0) {
    errors.push("Children count cannot be negative")
  }

  return errors
}

// ============================================================================
// Filtering & Sorting (Client-side utilities)
// ============================================================================

export function filterHotels(
  hotels: HotelResult[],
  filters: {
    priceRange?: { min: number; max: number }
    hotelClass?: number[]
    amenities?: string[]
    rating?: number
    types?: string[]
  }
): HotelResult[] {
  return hotels.filter((hotel) => {
    // Price range filter
    if (filters.priceRange) {
      const { min, max } = filters.priceRange
      if (hotel.price.perNight < min || hotel.price.perNight > max) {
        return false
      }
    }

    // Hotel class filter
    if (filters.hotelClass && filters.hotelClass.length > 0) {
      if (!hotel.hotelClass || !filters.hotelClass.includes(hotel.hotelClass)) {
        return false
      }
    }

    // Amenities filter (hotel must have ALL selected amenities)
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every((amenity) =>
        hotel.amenities.some(
          (hotelAmenity) =>
            hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      )
      if (!hasAllAmenities) {
        return false
      }
    }

    // Rating filter
    if (filters.rating) {
      if (!hotel.rating || hotel.rating < filters.rating) {
        return false
      }
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(hotel.type)) {
        return false
      }
    }

    return true
  })
}

export function sortHotels(
  hotels: HotelResult[],
  sortBy: "relevance" | "price_low_to_high" | "price_high_to_low" | "rating_high_to_low" | "rating_low_to_high"
): HotelResult[] {
  const sorted = [...hotels]

  switch (sortBy) {
    case "price_low_to_high":
      return sorted.sort((a, b) => a.price.perNight - b.price.perNight)

    case "price_high_to_low":
      return sorted.sort((a, b) => b.price.perNight - a.price.perNight)

    case "rating_high_to_low":
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    case "rating_low_to_high":
      return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0))

    case "relevance":
    default:
      return sorted
  }
}
