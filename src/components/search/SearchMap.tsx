/**
 * SearchMap Component
 *
 * Interactive map with pins, clustering, and popups.
 * Shows search results as numbered pins with hover/selected states.
 */

"use client"

import { useCallback, useMemo } from "react"
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api"
import { MarkerClusterer } from "@googlemaps/markerclusterer"
import type { Place } from "@/types/explore"
import type { Coordinates } from "@/types/explore"

interface SearchMapProps {
  places: Place[]
  center: Coordinates
  bounds: google.maps.LatLngBounds | null
  hoveredPlaceId: string | null
  selectedPlaceId: string | null
  onPlaceSelect: (placeId: string) => void
  onMapLoad: (map: google.maps.Map) => void
  onMapIdle: () => void
  className?: string
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
}

/**
 * Get pin color based on state
 */
function getPinColor(
  place: Place,
  hoveredId: string | null,
  selectedId: string | null
): string {
  if (selectedId === place.id) return "#0D9488" // primary
  if (hoveredId === place.id) return "#F97316" // orange
  return "#64748b" // slate-500 (default)
}

/**
 * Get pin scale based on state
 */
function getPinScale(
  place: Place,
  hoveredId: string | null,
  selectedId: string | null
): number {
  if (selectedId === place.id || hoveredId === place.id) return 18
  return 14
}

export function SearchMap({
  places,
  center,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceSelect,
  onMapLoad,
  onMapIdle,
  className,
}: SearchMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  })

  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      onMapLoad(map)
      // Note: Clustering will be implemented in a future iteration
      // For MVP, we show all pins without clustering
    },
    [onMapLoad]
  )

  const markers = useMemo(() => {
    return places.map((place, idx) => {
      const isHighlighted =
        hoveredPlaceId === place.id || selectedPlaceId === place.id

      return (
        <MarkerF
          key={place.id}
          position={{ lat: place.location.lat, lng: place.location.lng }}
          label={{
            text: String(idx + 1),
            color: "#fff",
            fontSize: isHighlighted ? "14px" : "12px",
            fontWeight: "bold",
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: getPinColor(place, hoveredPlaceId, selectedPlaceId),
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
            scale: getPinScale(place, hoveredPlaceId, selectedPlaceId),
          }}
          onClick={() => onPlaceSelect(place.id)}
        />
      )
    })
  }, [places, hoveredPlaceId, selectedPlaceId, onPlaceSelect])

  if (!isLoaded) {
    return (
      <div className={className}>
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={mapOptions}
        onLoad={handleMapLoad}
        onIdle={onMapIdle}
      >
        {markers}
      </GoogleMap>
    </div>
  )
}
