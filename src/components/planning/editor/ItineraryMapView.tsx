"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle, MapPin } from "lucide-react"
import type { GeneratedPlan } from "@/types/plan"
import type { Accommodation } from "@/types/accommodation"

interface ItineraryMapViewProps {
  plan: GeneratedPlan
}

interface TravelBase {
  id: string
  name: string
  location: { lat: number; lng: number }
  nights: number
  order: number
  checkIn: string
}

function extractTravelBases(plan: GeneratedPlan): TravelBase[] {
  if (!plan.accommodations?.length) return []

  return plan.accommodations
    .filter(
      (acc): acc is Accommodation & { placeData: { coordinates: { lat: number; lng: number } } } =>
        !!acc.placeData?.coordinates &&
        typeof acc.placeData.coordinates.lat === "number" &&
        typeof acc.placeData.coordinates.lng === "number" &&
        !(acc.placeData.coordinates.lat === 0 && acc.placeData.coordinates.lng === 0)
    )
    .map((acc, index) => ({
      id: acc.id,
      name: acc.area || acc.name,
      location: { lat: acc.placeData.coordinates.lat, lng: acc.placeData.coordinates.lng },
      nights: acc.nights,
      order: index,
      checkIn: acc.checkIn,
    }))
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
}

export function ItineraryMapView({ plan }: ItineraryMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bases = extractTravelBases(plan)

  // Load Google Maps Script
  useEffect(() => {
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
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return
    if (!window.google?.maps?.Map) return

    try {
      // Default center (will be adjusted by fitBounds)
      const defaultCenter = bases.length > 0
        ? bases[0].location
        : { lat: 9.9281, lng: -84.0907 } // Costa Rica default

      // Create map
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 8,
        mapId: "itinerary-map-view",
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
  }, [isLoaded, bases])

  // Create markers and polyline
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded || bases.length === 0) return
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

    // Create markers for each base
    bases.forEach((base, index) => {
      bounds.extend(base.location)

      // Create custom marker content
      const markerContent = document.createElement("div")
      markerContent.className = "flex flex-col items-center"
      markerContent.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm shadow-lg border-2 border-white">
          ${index + 1}
        </div>
        <div class="mt-1 px-2 py-1 bg-white rounded-md shadow-md text-xs font-medium whitespace-nowrap border border-gray-200">
          ${base.name} - ${base.nights} ${base.nights === 1 ? "noche" : "noches"}
        </div>
      `

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: base.location,
        map: googleMapRef.current,
        content: markerContent,
        title: base.name,
      })

      markersRef.current.push(marker)
    })

    // Create polyline connecting all bases
    if (bases.length > 1) {
      const path = bases.map((base) => base.location)

      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#7C3AED", // Purple to match the route in the reference image
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: googleMapRef.current,
      })
    }

    // Fit bounds to show all markers
    googleMapRef.current.fitBounds(bounds)

    // Don't zoom too close for single/few bases
    const listener = google.maps.event.addListener(
      googleMapRef.current,
      "idle",
      () => {
        const zoom = googleMapRef.current?.getZoom()
        if (zoom && zoom > 12) {
          googleMapRef.current?.setZoom(12)
        }
        google.maps.event.removeListener(listener)
      }
    )
  }, [bases, isLoaded])

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted/30 rounded-lg">
        <AlertCircle className="size-10 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  // Empty state - no bases
  if (bases.length === 0 && isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted/30 rounded-lg">
        <MapPin className="size-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">
          No hay destinos para mostrar
        </p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          El mapa mostrará los destinos de tu viaje cuando se generen las sugerencias de hospedaje con ubicaciones.
        </p>
      </div>
    )
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted/30 rounded-lg">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
      <div ref={mapRef} className="absolute inset-0" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border">
        <p className="text-xs font-medium text-foreground mb-2">Ruta del viaje</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-medium">
            1
          </div>
          <span>Destino</span>
          <div className="w-8 h-0.5 bg-purple-600 ml-2" />
          <span>Ruta</span>
        </div>
      </div>
    </div>
  )
}
