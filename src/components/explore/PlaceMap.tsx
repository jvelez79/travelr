"use client"

import { useMemo, useCallback, useState } from "react"
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api"
import type { Place, Coordinates, PlaceCategory } from "@/types/explore"

interface PlaceMapProps {
  places: Place[]
  center: Coordinates
  selectedPlaceId?: string
  onPlaceSelect?: (placeId: string) => void
  className?: string
}

// Map container style
const containerStyle = {
  width: "100%",
  height: "100%",
}

// Custom map styles for warm, editorial look
const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -20 }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
]

// Category colors for markers
const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  restaurants: "#0D9488",  // Teal (primary)
  attractions: "#0891B2",  // Cyan
  cafes: "#14B8A6",        // Teal-500
  bars: "#7C3AED",         // Purple
  museums: "#1D4ED8",      // Blue
  nature: "#059669",       // Green
}

export function PlaceMap({
  places,
  center,
  selectedPlaceId,
  onPlaceSelect,
  className = "",
}: PlaceMapProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null)

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  // Map options
  const options = useMemo(
    () => ({
      styles: mapStyles,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      clickableIcons: false,
    }),
    []
  )

  // Handle marker click
  const handleMarkerClick = useCallback((placeId: string) => {
    setActiveMarker(placeId)
    onPlaceSelect?.(placeId)
  }, [onPlaceSelect])

  // Handle info window close
  const handleInfoWindowClose = useCallback(() => {
    setActiveMarker(null)
  }, [])

  // Error state
  if (loadError) {
    return (
      <div className={`w-full h-full rounded-xl bg-muted border border-border flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Error al cargar el mapa</h3>
          <p className="text-sm text-muted-foreground">
            Verifica tu API key de Google Maps.
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className={`w-full h-full rounded-xl bg-muted border border-border flex items-center justify-center animate-pulse ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  // No API key state
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`w-full h-full rounded-xl bg-muted border border-border flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Configura Google Maps</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Añade tu API key en el archivo .env.local
          </p>
          <code className="text-xs bg-background px-3 py-2 rounded-lg border border-border block">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full overflow-hidden ${className}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        options={options}
      >
        {places.map((place, index) => {
          const isSelected = selectedPlaceId === place.id
          const markerColor = isSelected ? "#0D9488" : CATEGORY_COLORS[place.category]

          return (
            <MarkerF
              key={place.id}
              position={place.location}
              onClick={() => handleMarkerClick(place.id)}
              label={{
                text: String(index + 1),
                color: "#ffffff",
                fontSize: isSelected ? "14px" : "12px",
                fontWeight: "bold",
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: markerColor,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: isSelected ? 18 : 14,
              }}
            >
              {activeMarker === place.id && (
                <InfoWindowF
                  position={place.location}
                  onCloseClick={handleInfoWindowClose}
                >
                  <div className="p-2 min-w-[180px]">
                    <h4 className="font-semibold text-sm text-gray-900">{place.name}</h4>
                    {place.subcategory && (
                      <p className="text-xs text-gray-500 mt-0.5">{place.subcategory}</p>
                    )}
                    {place.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-500">★</span>
                        <span className="text-xs font-medium">{place.rating.toFixed(1)}</span>
                        {place.reviewCount && (
                          <span className="text-xs text-gray-400">
                            ({place.reviewCount.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          )
        })}
      </GoogleMap>
    </div>
  )
}
