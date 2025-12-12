"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import type { HotelResult } from "@/lib/hotels/types"

interface HotelMapProps {
  hotels: HotelResult[]
  selectedHotel: HotelResult | null
  onHotelSelect: (hotel: HotelResult) => void
  currency?: string
}

export function HotelMap({
  hotels,
  selectedHotel,
  onHotelSelect,
  currency = "USD",
}: HotelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
      // Wait a bit for initialization
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
      // Calculate center from hotels
      const center = hotels.length > 0
        ? {
            lat: hotels[0].location.lat,
            lng: hotels[0].location.lng,
          }
        : { lat: 9.9281, lng: -84.0907 } // Costa Rica default

      // Create map
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        mapId: "hotel-search-map", // Required for Advanced Markers
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
    } catch (error) {
      console.error("Error creating map:", error)
      setError("Error al crear el mapa")
    }
  }, [isLoaded, hotels])

  // Update markers when hotels change
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded || hotels.length === 0) return
    if (!window.google?.maps?.marker?.AdvancedMarkerElement) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null
    })
    markersRef.current = []

    // Calculate bounds
    const bounds = new google.maps.LatLngBounds()

    // Create markers
    hotels.forEach((hotel) => {
      if (hotel.location.lat === 0 && hotel.location.lng === 0) return

      const position = {
        lat: hotel.location.lat,
        lng: hotel.location.lng,
      }

      // Extend bounds
      bounds.extend(position)

      // Create price label content
      const priceLabel = document.createElement("div")
      priceLabel.className = `
        px-2 py-1 rounded-md font-semibold text-sm cursor-pointer
        transition-all shadow-md
        ${
          selectedHotel?.id === hotel.id
            ? "bg-primary text-primary-foreground scale-110 shadow-lg"
            : "bg-background text-foreground hover:scale-105"
        }
      `
      priceLabel.style.border = "2px solid"
      priceLabel.style.borderColor = selectedHotel?.id === hotel.id
        ? "hsl(var(--primary))"
        : "hsl(var(--border))"
      priceLabel.textContent = formatCurrency(hotel.price.perNight)

      // Create marker
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: googleMapRef.current,
        content: priceLabel,
        title: hotel.name,
      })

      // Add click listener
      marker.addListener("click", () => {
        onHotelSelect(hotel)
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    if (hotels.length > 0) {
      googleMapRef.current.fitBounds(bounds)

      // Don't zoom too close for single hotel
      const listener = google.maps.event.addListener(
        googleMapRef.current,
        "idle",
        () => {
          if (googleMapRef.current!.getZoom()! > 15) {
            googleMapRef.current!.setZoom(15)
          }
          google.maps.event.removeListener(listener)
        }
      )
    }
  }, [hotels, isLoaded, selectedHotel, onHotelSelect, formatCurrency])

  // Update marker styles when selection changes
  useEffect(() => {
    if (!isLoaded || markersRef.current.length === 0) return

    markersRef.current.forEach((marker, index) => {
      const hotel = hotels[index]
      if (!hotel) return

      const content = marker.content as HTMLElement
      const isSelected = selectedHotel?.id === hotel.id

      // Update styles
      if (isSelected) {
        content.className = content.className.replace(
          "bg-background text-foreground",
          "bg-primary text-primary-foreground scale-110 shadow-lg"
        )
        content.style.borderColor = "hsl(var(--primary))"
      } else {
        content.className = content.className.replace(
          "bg-primary text-primary-foreground scale-110 shadow-lg",
          "bg-background text-foreground"
        )
        content.style.borderColor = "hsl(var(--border))"
      }
    })
  }, [selectedHotel, isLoaded, hotels])

  // Loading state
  if (!isLoaded && !error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Verifica la configuración de Google Maps API
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Selected Hotel Info Card */}
      {selectedHotel && (
        <div className="absolute bottom-6 left-6 right-6 max-w-md bg-background rounded-lg shadow-2xl border p-4 z-10">
          <div className="flex items-start gap-3">
            {selectedHotel.images[0] && (
              <img
                src={selectedHotel.images[0]}
                alt={selectedHotel.name}
                className="w-20 h-20 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1">
                {selectedHotel.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {selectedHotel.location.area || selectedHotel.location.address}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(selectedHotel.price.perNight)}
                  </p>
                  <p className="text-xs text-muted-foreground">por noche</p>
                </div>
                {selectedHotel.rating && (
                  <div className="text-xs">
                    <span className="font-semibold">{selectedHotel.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground"> / 5</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
