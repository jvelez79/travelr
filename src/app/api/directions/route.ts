import { NextRequest, NextResponse } from "next/server"
import type { TransportMethod, TravelInfo } from "@/types/plan"

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""
const ROUTES_API_BASE = "https://routes.googleapis.com/directions/v2:computeRoutes"

// Map our transport methods to Google's travel modes
const TRANSPORT_TO_GOOGLE_MODE: Record<TransportMethod, string> = {
  driving: "DRIVE",
  walking: "WALK",
  transit: "TRANSIT",
  none: "DRIVE", // Fallback
}

interface GoogleRouteResponse {
  routes?: Array<{
    distanceMeters?: number
    duration?: string // Format: "1234s"
    localizedValues?: {
      distance?: { text: string }
      duration?: { text: string }
    }
  }>
  error?: {
    code: number
    message: string
    status: string
  }
}

/**
 * GET /api/directions
 *
 * Query params:
 * - originLat: number (required)
 * - originLng: number (required)
 * - destLat: number (required)
 * - destLng: number (required)
 * - mode: TransportMethod (optional, default: 'driving')
 *
 * Returns: TravelInfo with distance, duration, and method
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const originLat = parseFloat(searchParams.get("originLat") || "")
  const originLng = parseFloat(searchParams.get("originLng") || "")
  const destLat = parseFloat(searchParams.get("destLat") || "")
  const destLng = parseFloat(searchParams.get("destLng") || "")
  const mode = (searchParams.get("mode") || "driving") as TransportMethod

  // Validate coordinates
  if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
    return NextResponse.json(
      { error: "Invalid coordinates. Required: originLat, originLng, destLat, destLng" },
      { status: 400 }
    )
  }

  // Validate mode
  const validModes: TransportMethod[] = ["driving", "walking", "transit", "none"]
  if (!validModes.includes(mode)) {
    return NextResponse.json(
      { error: `Invalid mode. Must be one of: ${validModes.join(", ")}` },
      { status: 400 }
    )
  }

  if (!GOOGLE_API_KEY) {
    console.warn("[directions] Google API key not configured")
    return NextResponse.json(
      { error: "Google API not configured" },
      { status: 500 }
    )
  }

  try {
    const googleMode = TRANSPORT_TO_GOOGLE_MODE[mode]

    const response = await fetch(ROUTES_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.localizedValues",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: originLat,
              longitude: originLng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destLat,
              longitude: destLng,
            },
          },
        },
        travelMode: googleMode,
        routingPreference: googleMode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
        computeAlternativeRoutes: false,
        languageCode: "es", // Spanish for user-facing text
        units: "METRIC",
      }),
    })

    const data: GoogleRouteResponse = await response.json()

    if (data.error) {
      console.error("[directions] Google API error:", data.error)
      return NextResponse.json(
        { error: data.error.message },
        { status: response.status }
      )
    }

    if (!data.routes || data.routes.length === 0) {
      console.warn("[directions] No routes found")
      return NextResponse.json(
        { error: "No route found between these locations" },
        { status: 404 }
      )
    }

    const route = data.routes[0]

    // Parse duration from "1234s" format to minutes
    const durationSeconds = route.duration
      ? parseInt(route.duration.replace("s", ""))
      : 0
    const durationMinutes = Math.round(durationSeconds / 60)

    // Format distance
    const distanceMeters = route.distanceMeters || 0
    const distanceKm = distanceMeters / 1000

    // Use localized values if available, otherwise format ourselves
    const distance =
      route.localizedValues?.distance?.text ||
      (distanceKm < 1
        ? `${Math.round(distanceMeters)} m`
        : `${distanceKm.toFixed(1)} km`)

    const duration =
      route.localizedValues?.duration?.text ||
      (durationMinutes < 60
        ? `${durationMinutes} min`
        : `${Math.floor(durationMinutes / 60)} h ${durationMinutes % 60} min`)

    const travelInfo: TravelInfo = {
      distance,
      duration,
      method: mode,
    }

    console.log(
      "[directions] Success:",
      `${originLat},${originLng} -> ${destLat},${destLng}`,
      `= ${distance} (${duration})`
    )

    return NextResponse.json(travelInfo)
  } catch (error) {
    console.error("[directions] Error:", error)
    return NextResponse.json(
      { error: "Failed to calculate directions" },
      { status: 500 }
    )
  }
}
