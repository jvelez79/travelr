import { NextRequest, NextResponse } from "next/server"
import { autocompleteDestination, getDestinationInfo, searchNearbyDestinations } from "@/lib/explore/google-places"

/**
 * GET /api/explore/destinations
 *
 * Query params:
 * - q: string (optional) - Search query for autocomplete
 * - placeId: string (optional) - Get info for specific destination
 * - lat, lng: number (optional) - Get nearby destinations around location
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const placeId = searchParams.get("placeId")
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  // Get nearby destinations
  if (lat && lng) {
    try {
      const nearby = await searchNearbyDestinations({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      })
      return NextResponse.json({ nearby })
    } catch (error) {
      console.error("Error searching nearby destinations:", error)
      return NextResponse.json(
        { error: "Failed to search nearby destinations" },
        { status: 500 }
      )
    }
  }

  // Get destination details by place ID
  if (placeId) {
    const info = await getDestinationInfo(placeId)
    if (!info) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(info)
  }

  // Autocomplete destinations
  if (query) {
    try {
      const suggestions = await autocompleteDestination(query)
      return NextResponse.json({ suggestions })
    } catch (error) {
      console.error("Error in destination autocomplete:", error)
      return NextResponse.json(
        { error: "Failed to search destinations" },
        { status: 500 }
      )
    }
  }

  // Return popular destinations if no query
  // These are curated destinations to show when no search is active
  const popularDestinations = [
    {
      id: "paris",
      name: "París",
      fullName: "París, Francia",
      country: "Francia",
      location: { lat: 48.8566, lng: 2.3522 },
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    },
    {
      id: "tokyo",
      name: "Tokio",
      fullName: "Tokio, Japón",
      country: "Japón",
      location: { lat: 35.6762, lng: 139.6503 },
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    },
    {
      id: "new-york",
      name: "Nueva York",
      fullName: "Nueva York, Estados Unidos",
      country: "Estados Unidos",
      location: { lat: 40.7128, lng: -74.006 },
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
    },
    {
      id: "barcelona",
      name: "Barcelona",
      fullName: "Barcelona, España",
      country: "España",
      location: { lat: 41.3851, lng: 2.1734 },
      image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800",
    },
    {
      id: "rome",
      name: "Roma",
      fullName: "Roma, Italia",
      country: "Italia",
      location: { lat: 41.9028, lng: 12.4964 },
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
    },
    {
      id: "la-fortuna",
      name: "La Fortuna",
      fullName: "La Fortuna, Alajuela, Costa Rica",
      country: "Costa Rica",
      location: { lat: 10.4678, lng: -84.6427 },
      image: "https://images.unsplash.com/photo-1580963548619-45f7b4e5c4f3?w=800",
    },
  ]

  return NextResponse.json({ destinations: popularDestinations })
}
