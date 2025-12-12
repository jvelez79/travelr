/**
 * API Route: Hotel Details
 * GET /api/hotels/[id]
 *
 * Gets detailed hotel information including booking links from various OTAs
 */

import { NextRequest, NextResponse } from "next/server"
import { getHotelDetails } from "@/lib/hotels/serpapi"

// Cache duration: 30 minutes (details change less frequently)
export const revalidate = 1800

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error: "Missing hotel ID",
          message: "Please provide a valid hotel property token",
        },
        { status: 400 }
      )
    }

    // Extract search params for accurate pricing
    const searchParams = request.nextUrl.searchParams
    const detailsParams = {
      checkIn: searchParams.get("checkIn") || undefined,
      checkOut: searchParams.get("checkOut") || undefined,
      adults: searchParams.get("adults") ? parseInt(searchParams.get("adults")!) : undefined,
      children: searchParams.get("children") ? parseInt(searchParams.get("children")!) : undefined,
      currency: searchParams.get("currency") || undefined,
    }

    const hotel = await getHotelDetails(id, detailsParams)

    if (!hotel) {
      return NextResponse.json(
        {
          error: "Hotel not found",
          message: "Could not find hotel details for the provided ID",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      hotel,
    })
  } catch (error) {
    console.error("Error in hotel details API:", error)

    if (error instanceof Error) {
      if (error.message.includes("SERPAPI_API_KEY")) {
        return NextResponse.json(
          {
            error: "API configuration error",
            message: "Hotel service is not configured. Please contact support.",
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        {
          error: "Internal server error",
          message: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Unknown error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}
