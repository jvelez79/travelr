"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin, Hotel } from "lucide-react"
import type { ItineraryDay, TimelineEntry } from "@/types/plan"
import type { Accommodation } from "@/types/accommodation"
import { parseLocalDate } from "@/lib/date-utils"

interface DayMapModalProps {
  day: ItineraryDay
  accommodation?: Accommodation | null
  isOpen: boolean
  onClose: () => void
}

interface MapPoint {
  id: string
  name: string
  location: { lat: number; lng: number }
  type: "activity" | "hotel"
  order: number
  time?: string
}

function extractMapPoints(
  day: ItineraryDay,
  accommodation?: Accommodation | null
): MapPoint[] {
  const points: MapPoint[] = []

  // Add activities with coordinates
  day.timeline.forEach((activity, index) => {
    if (
      activity.placeData?.coordinates?.lat &&
      activity.placeData?.coordinates?.lng
    ) {
      points.push({
        id: activity.id,
        name: activity.activity,
        location: {
          lat: activity.placeData.coordinates.lat,
          lng: activity.placeData.coordinates.lng,
        },
        type: "activity",
        order: index + 1,
        time: activity.time,
      })
    }
  })

  // Add hotel at the end if it has coordinates
  if (
    accommodation?.placeData?.coordinates?.lat &&
    accommodation?.placeData?.coordinates?.lng
  ) {
    points.push({
      id: accommodation.id,
      name: accommodation.name,
      location: {
        lat: accommodation.placeData.coordinates.lat,
        lng: accommodation.placeData.coordinates.lng,
      },
      type: "hotel",
      order: points.length + 1,
    })
  }

  return points
}

export function DayMapModal({
  day,
  accommodation,
  isOpen,
  onClose,
}: DayMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const points = extractMapPoints(day, accommodation)
  const hasPoints = points.length > 0

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = parseLocalDate(dateStr)
      return date.toLocaleDateString("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    } catch {
      return dateStr
    }
  }

  // Load Google Maps Script
  useEffect(() => {
    if (!isOpen) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setError("Google Maps API key no configurada")
      return
    }

    // Check if already loaded and ready
    if (window.google?.maps?.Map) {
      setIsLoaded(true)
      return
    }

    // Check if script is already loading
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    )

    if (existingScript) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkLoaded)
          setIsLoaded(true)
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkLoaded)
        if (!window.google?.maps?.Map) {
          setError("Timeout al cargar Google Maps")
        }
      }, 10000)

      return () => clearInterval(checkLoaded)
    }

    // Load script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`
    script.async = true
    script.defer = true

    script.onload = () => {
      const checkReady = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkReady)
          setIsLoaded(true)
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkReady)
        if (!window.google?.maps?.Map) {
          setError("Google Maps no se inicializó correctamente")
        }
      }, 5000)
    }

    script.onerror = () => {
      setError("Error al cargar Google Maps")
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [isOpen])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !isOpen) return
    if (!window.google?.maps?.Map) return

    // Reset map ref when modal opens
    if (googleMapRef.current) {
      googleMapRef.current = null
    }

    try {
      // Default center
      const defaultCenter =
        points.length > 0
          ? points[0].location
          : { lat: 9.9281, lng: -84.0907 } // Costa Rica default

      // Create map
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapId: "day-map-modal",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
    } catch (err) {
      console.error("Error creating map:", err)
      setError("Error al crear el mapa")
    }
  }, [isLoaded, isOpen, points])

  // Create markers and polyline
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded || points.length === 0 || !isOpen)
      return
    if (!window.google?.maps?.marker?.AdvancedMarkerElement) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null
    })
    markersRef.current = []

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }

    // Calculate bounds
    const bounds = new google.maps.LatLngBounds()

    // Create markers for each point
    points.forEach((point) => {
      bounds.extend(point.location)

      // Create custom marker content with hover tooltip
      const markerContent = document.createElement("div")
      markerContent.className = "group/marker relative"

      if (point.type === "activity") {
        markerContent.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm shadow-lg border-2 border-white cursor-pointer transition-transform hover:scale-110">
            ${point.order}
          </div>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white rounded-md shadow-lg text-xs font-medium whitespace-nowrap border border-gray-200 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
            ${point.time ? `<span class="text-gray-500">${point.time}</span> · ` : ""}${point.name}
          </div>
        `
      } else {
        // Hotel marker
        markerContent.innerHTML = `
          <div class="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-transform hover:scale-110">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white rounded-md shadow-lg text-xs font-medium whitespace-nowrap border border-gray-200 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
            ${point.name}
          </div>
        `
      }

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: point.location,
        map: googleMapRef.current,
        content: markerContent,
        title: point.name,
      })

      markersRef.current.push(marker)
    })

    // Create polyline connecting all points
    if (points.length > 1) {
      const path = points.map((point) => point.location)

      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#7C3AED", // Purple
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: googleMapRef.current,
      })
    }

    // Fit bounds to show all markers
    googleMapRef.current.fitBounds(bounds)

    // Don't zoom too close for single/few points
    const listener = google.maps.event.addListener(
      googleMapRef.current,
      "idle",
      () => {
        const zoom = googleMapRef.current?.getZoom()
        if (zoom && zoom > 15) {
          googleMapRef.current?.setZoom(15)
        }
        google.maps.event.removeListener(listener)
      }
    )
  }, [points, isLoaded, isOpen])

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clear markers
      markersRef.current.forEach((marker) => {
        marker.map = null
      })
      markersRef.current = []

      // Clear polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }

      // Clear map ref
      googleMapRef.current = null
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 my-8 bg-card border border-border rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                {day.day}
              </span>
              <span>Mapa del día</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {day.title} · {formatDate(day.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Map Content */}
        <div className="relative w-full h-[500px]">
          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30">
              <MapPin className="size-10 text-destructive mb-3" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!error && !hasPoints && isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30">
              <MapPin className="size-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                No hay ubicaciones para mostrar
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Las actividades sin coordenadas de Google Places no aparecen en
                el mapa
              </p>
            </div>
          )}

          {/* Loading state */}
          {!error && !isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30">
              <Loader2 className="size-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
          )}

          {/* Map container */}
          <div ref={mapRef} className="absolute inset-0" />

          {/* Legend */}
          {hasPoints && isLoaded && !error && (
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border">
              <p className="text-xs font-medium text-foreground mb-2">
                Ruta del día
              </p>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-medium">
                    1
                  </div>
                  <span>Actividad</span>
                </div>
                {accommodation?.placeData?.coordinates && (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Hotel className="w-3 h-3" />
                    </div>
                    <span>Hotel</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-0.5 bg-purple-600" />
                  <span>Ruta</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
