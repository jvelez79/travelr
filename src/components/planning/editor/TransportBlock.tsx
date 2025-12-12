"use client"

import type { TravelInfo, TransportMethod } from "@/types/plan"

interface LocationInfo {
  name: string
  placeId?: string
  coordinates?: { lat: number; lng: number }
}

interface TransportBlockProps {
  travelInfo: TravelInfo
  fromLocation: LocationInfo
  toLocation: LocationInfo
}

// Transport method icons (SVG)
function TransportIcon({ method, className = "w-4 h-4" }: { method?: TransportMethod; className?: string }) {
  switch (method) {
    case 'walking':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 14c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v4m0 8v2" />
        </svg>
      )
    case 'transit':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17l4-4 4 4m-4-4V3M3 12l3-3 3 3M21 12l-3-3-3 3" />
        </svg>
      )
    case 'driving':
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 17H3V9l2-4h14l2 4v8h-2M5 13h14" />
        </svg>
      )
  }
}

// Get transport method label
function getMethodLabel(method?: TransportMethod): string {
  switch (method) {
    case 'walking':
      return 'Caminando'
    case 'transit':
      return 'Transporte público'
    case 'driving':
    default:
      return 'En auto'
  }
}

// Build Google Maps directions URL
// Uses origin_place_id/destination_place_id for accuracy when available
// Falls back to coordinates or location name
function buildGoogleMapsUrl(from: LocationInfo, to: LocationInfo, method?: TransportMethod): string {
  const travelMode = method === 'walking' ? 'walking' : method === 'transit' ? 'transit' : 'driving'

  // Build origin parameter - use coordinates if available for precision, otherwise name
  const originText = from.coordinates
    ? `${from.coordinates.lat},${from.coordinates.lng}`
    : encodeURIComponent(from.name)

  // Build destination parameter
  const destinationText = to.coordinates
    ? `${to.coordinates.lat},${to.coordinates.lng}`
    : encodeURIComponent(to.name)

  let url = `https://www.google.com/maps/dir/?api=1&origin=${originText}&destination=${destinationText}&travelmode=${travelMode}`

  // Add place IDs as separate parameters for better accuracy
  // Google requires both text location AND place_id when using place IDs
  if (from.placeId) {
    url += `&origin_place_id=${from.placeId}`
  }
  if (to.placeId) {
    url += `&destination_place_id=${to.placeId}`
  }

  return url
}

export function TransportBlock({ travelInfo, fromLocation, toLocation }: TransportBlockProps) {
  // Don't render if no travel info or method is 'none'
  if (!travelInfo || travelInfo.method === 'none') {
    return null
  }

  const { distance, duration, method } = travelInfo
  const googleMapsUrl = buildGoogleMapsUrl(fromLocation, toLocation, method)

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 mx-3 my-1">
      {/* Vertical connector line */}
      <div className="flex flex-col items-center w-6 -my-1">
        <div className="w-px h-2 bg-border" />
        <div className="w-6 h-6 rounded-full border border-border bg-muted/50 flex items-center justify-center">
          <TransportIcon method={method} className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="w-px h-2 bg-border" />
      </div>

      {/* Travel info */}
      <div className="flex items-center gap-3 flex-1 text-xs text-muted-foreground">
        {duration && (
          <span className="font-medium">{duration}</span>
        )}
        {distance && (
          <>
            <span className="text-border">·</span>
            <span>{distance}</span>
          </>
        )}
        <span className="text-border">·</span>
        <span>{getMethodLabel(method)}</span>
      </div>

      {/* Directions button */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Directions
      </a>
    </div>
  )
}
