import { NextResponse } from "next/server"
import { getPlacePhotos } from "@/lib/explore/google-places"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get("placeId")

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId is required" },
      { status: 400 }
    )
  }

  try {
    const photos = await getPlacePhotos(placeId)
    return NextResponse.json({ photos })
  } catch (error) {
    console.error("[places/photos] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}
