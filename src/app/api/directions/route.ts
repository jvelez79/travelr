import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { TransportMethod, TravelInfo } from "@/types/plan"
import type { Database, Json } from "@/types/database"

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""
const ROUTES_API_BASE = "https://routes.googleapis.com/directions/v2:computeRoutes"

// Supabase client for server-side cache (using anon key for public cache)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cache TTL: 30 days (shared cache benefits from longer TTL)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

// Map our transport methods to Google's travel modes
const TRANSPORT_TO_GOOGLE_MODE: Record<TransportMethod, string> = {
  driving: "DRIVE",
  walking: "WALK",
  transit: "TRANSIT",
  none: "DRIVE", // Fallback
}

/**
 * Generate a cache key from coordinates and transport mode
 * Normalizes coordinates to 4 decimal places (~11m precision)
 */
function generateCacheKey(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: string
): string {
  const normalized = [
    fromLat.toFixed(4),
    fromLng.toFixed(4),
    toLat.toFixed(4),
    toLng.toFixed(4),
    mode,
  ].join("|")

  // Simple hash function for shorter key
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  return `dir_${Math.abs(hash).toString(36)}`
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

  // Generate cache key
  const cacheKey = generateCacheKey(originLat, originLng, destLat, destLng, mode)

  // Check Supabase cache first
  try {
    const { data: cached } = await supabase
      .from("directions_cache")
      .select("travel_info")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cached?.travel_info) {
      console.log("[directions] Cache HIT:", cacheKey)
      return NextResponse.json(cached.travel_info as TravelInfo)
    }
  } catch {
    // Cache miss or error - continue to fetch from Google
    console.log("[directions] Cache MISS:", cacheKey)
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

    // Store in Supabase cache (fire and forget - don't block response)
    supabase
      .from("directions_cache")
      .upsert(
        {
          cache_key: cacheKey,
          from_lat: originLat,
          from_lng: originLng,
          to_lat: destLat,
          to_lng: destLng,
          mode,
          travel_info: travelInfo as unknown as Json,
          expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
        },
        { onConflict: "cache_key" }
      )
      .then(({ error }) => {
        if (error) {
          console.error("[directions] Cache store error:", error.message)
        } else {
          console.log("[directions] Cached:", cacheKey)
        }
      })

    console.log(
      "[directions] Google API:",
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
