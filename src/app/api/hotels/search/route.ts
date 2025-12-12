/**
 * API Route: Hotel Search
 * POST /api/hotels/search
 *
 * Searches for hotels using SerpAPI (Google Hotels)
 */

import { NextRequest, NextResponse } from "next/server"
import {
  searchHotels,
  validateSearchParams,
  filterHotels,
  sortHotels,
} from "@/lib/hotels/serpapi"
import type {
  HotelSearchParams,
  HotelFilters,
  HotelSortOption,
} from "@/lib/hotels/types"

// Cache duration: 1 hour
export const revalidate = 3600

interface SearchRequestBody extends HotelSearchParams {
  filters?: HotelFilters
  sortBy?: HotelSortOption
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SearchRequestBody = await request.json()

    const {
      destination,
      checkIn,
      checkOut,
      adults,
      children,
      currency = "USD",
      gl = "us",
      hl = "en",
      filters,
      sortBy = "relevance",
    } = body

    // Validate required parameters
    const searchParams: HotelSearchParams = {
      destination,
      checkIn,
      checkOut,
      adults,
      children,
      currency,
      gl,
      hl,
    }

    const validationErrors = validateSearchParams(searchParams)

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          message: validationErrors.join(". "),
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // Search hotels via SerpAPI
    console.log("Searching hotels with params:", searchParams)
    const result = await searchHotels(searchParams)

    // Apply client-side filters if provided
    let filteredHotels = result.hotels

    if (filters) {
      filteredHotels = filterHotels(filteredHotels, filters)
    }

    // Apply sorting
    const sortedHotels = sortHotels(filteredHotels, sortBy)

    // Return results
    return NextResponse.json({
      success: true,
      hotels: sortedHotels,
      total: sortedHotels.length,
      originalTotal: result.total,
      searchId: result.searchId,
      searchParams: result.searchParams,
      appliedFilters: filters,
      appliedSort: sortBy,
      timestamp: result.timestamp,
    })
  } catch (error) {
    console.error("Error in hotel search API:", error)

    // Handle specific error types
    if (error instanceof Error) {
      // API key missing
      if (error.message.includes("SERPAPI_API_KEY")) {
        return NextResponse.json(
          {
            error: "API configuration error",
            message: "Hotel search service is not configured. Please contact support.",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
          { status: 503 }
        )
      }

      // SerpAPI errors
      if (error.message.includes("SerpAPI")) {
        return NextResponse.json(
          {
            error: "Hotel search failed",
            message: "Unable to search hotels at this time. Please try again later.",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
          { status: 502 }
        )
      }

      // Generic errors
      return NextResponse.json(
        {
          error: "Internal server error",
          message: error.message,
        },
        { status: 500 }
      )
    }

    // Unknown errors
    return NextResponse.json(
      {
        error: "Unknown error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}

// Optional: GET method for simple queries via URL params
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams

    const destination = params.get("destination")
    const checkIn = params.get("checkIn")
    const checkOut = params.get("checkOut")
    const adults = parseInt(params.get("adults") || "1")
    const childrenParam = params.get("children")
    const children = childrenParam ? parseInt(childrenParam) : undefined
    const currency = params.get("currency") || "USD"
    const gl = params.get("gl") || "us"
    const hl = params.get("hl") || "en"

    if (!destination || !checkIn || !checkOut) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["destination", "checkIn", "checkOut"],
        },
        { status: 400 }
      )
    }

    const searchParams: HotelSearchParams = {
      destination,
      checkIn,
      checkOut,
      adults,
      children,
      currency,
      gl,
      hl,
    }

    const validationErrors = validateSearchParams(searchParams)

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          message: validationErrors.join(". "),
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    const result = await searchHotels(searchParams)

    return NextResponse.json({
      success: true,
      hotels: result.hotels,
      total: result.total,
      searchId: result.searchId,
      searchParams: result.searchParams,
      timestamp: result.timestamp,
    })
  } catch (error) {
    console.error("Error in hotel search GET API:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
