/**
 * React hooks for hotel search functionality
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  HotelSearchParams,
  HotelResult,
  HotelFilters,
  HotelSortOption,
} from "./types"

// ============================================================================
// useHotelSearch - Main search hook
// ============================================================================

interface UseHotelSearchOptions extends HotelSearchParams {
  filters?: HotelFilters
  sortBy?: HotelSortOption
  enabled?: boolean // Only search when enabled = true
  autoSearch?: boolean // Auto-search on param changes
}

interface UseHotelSearchResult {
  hotels: HotelResult[]
  isLoading: boolean
  error: string | null
  total: number
  originalTotal?: number
  searchId?: string
  search: () => Promise<void>
  refetch: () => Promise<void>
  reset: () => void
}

export function useHotelSearch(
  options: UseHotelSearchOptions
): UseHotelSearchResult {
  const {
    destination,
    checkIn,
    checkOut,
    adults,
    children,
    currency = "USD",
    gl = "us",
    hl = "en",
    filters,
    sortBy = "relevance",
    enabled = true,
    autoSearch = true,
  } = options

  const [hotels, setHotels] = useState<HotelResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [originalTotal, setOriginalTotal] = useState<number>()
  const [searchId, setSearchId] = useState<string>()

  const search = useCallback(async () => {
    if (!enabled) return
    if (!destination || !checkIn || !checkOut) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/hotels/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          checkIn,
          checkOut,
          adults,
          children,
          currency,
          gl,
          hl,
          filters,
          sortBy,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to search hotels")
      }

      setHotels(data.hotels || [])
      setTotal(data.total || 0)
      setOriginalTotal(data.originalTotal)
      setSearchId(data.searchId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      setHotels([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [
    enabled,
    destination,
    checkIn,
    checkOut,
    adults,
    children,
    currency,
    gl,
    hl,
    filters,
    sortBy,
  ])

  const refetch = useCallback(() => search(), [search])

  const reset = useCallback(() => {
    setHotels([])
    setError(null)
    setTotal(0)
    setOriginalTotal(undefined)
    setSearchId(undefined)
    setIsLoading(false)
  }, [])

  // Auto-search on params change
  useEffect(() => {
    if (autoSearch && enabled) {
      search()
    }
  }, [autoSearch, enabled, search])

  return {
    hotels,
    isLoading,
    error,
    total,
    originalTotal,
    searchId,
    search,
    refetch,
    reset,
  }
}

// ============================================================================
// useHotelFilters - Client-side filtering
// ============================================================================

interface UseHotelFiltersOptions {
  hotels: HotelResult[]
  initialFilters?: HotelFilters
  initialSortBy?: HotelSortOption
}

interface UseHotelFiltersResult {
  filteredHotels: HotelResult[]
  filters: HotelFilters
  sortBy: HotelSortOption
  setFilters: (filters: HotelFilters) => void
  setSortBy: (sortBy: HotelSortOption) => void
  updateFilter: <K extends keyof HotelFilters>(
    key: K,
    value: HotelFilters[K]
  ) => void
  clearFilters: () => void
  stats: {
    total: number
    filtered: number
    priceRange: { min: number; max: number }
    availableClasses: number[]
    availableAmenities: string[]
  }
}

export function useHotelFilters(
  options: UseHotelFiltersOptions
): UseHotelFiltersResult {
  const { hotels, initialFilters = {}, initialSortBy = "relevance" } = options

  const [filters, setFilters] = useState<HotelFilters>(initialFilters)
  const [sortBy, setSortBy] = useState<HotelSortOption>(initialSortBy)

  const updateFilter = useCallback(
    <K extends keyof HotelFilters>(key: K, value: HotelFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const prices = hotels
      .map((h) => h.price.perNight)
      .filter((p) => p > 0)
    const classes = hotels
      .map((h) => h.hotelClass)
      .filter((c): c is number => c !== undefined)
    const amenities = Array.from(
      new Set(hotels.flatMap((h) => h.amenities))
    ).sort()

    return {
      total: hotels.length,
      filtered: hotels.length, // Will be updated below
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 1000,
      },
      availableClasses: Array.from(new Set(classes)).sort(),
      availableAmenities: amenities,
    }
  }, [hotels])

  // Apply filters
  const filteredHotels = useMemo(() => {
    let result = [...hotels]

    // Price range
    if (filters.priceRange) {
      result = result.filter(
        (h) =>
          h.price.perNight >= filters.priceRange!.min &&
          h.price.perNight <= filters.priceRange!.max
      )
    }

    // Hotel class
    if (filters.hotelClass && filters.hotelClass.length > 0) {
      result = result.filter(
        (h) => h.hotelClass && filters.hotelClass!.includes(h.hotelClass)
      )
    }

    // Amenities (must have ALL selected)
    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((h) =>
        filters.amenities!.every((amenity) =>
          h.amenities.some((a) =>
            a.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      )
    }

    // Rating
    if (filters.rating) {
      result = result.filter((h) => h.rating && h.rating >= filters.rating!)
    }

    // Type
    if (filters.types && filters.types.length > 0) {
      result = result.filter((h) => filters.types!.includes(h.type))
    }

    // Sort
    switch (sortBy) {
      case "price_low_to_high":
        result.sort((a, b) => a.price.perNight - b.price.perNight)
        break
      case "price_high_to_low":
        result.sort((a, b) => b.price.perNight - a.price.perNight)
        break
      case "rating_high_to_low":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "rating_low_to_high":
        result.sort((a, b) => (a.rating || 0) - (b.rating || 0))
        break
      case "relevance":
      default:
        // Keep original order
        break
    }

    return result
  }, [hotels, filters, sortBy])

  return {
    filteredHotels,
    filters,
    sortBy,
    setFilters,
    setSortBy,
    updateFilter,
    clearFilters,
    stats: {
      ...stats,
      filtered: filteredHotels.length,
    },
  }
}

// ============================================================================
// useHotelSelection - Manage selected hotel(s)
// ============================================================================

interface UseHotelSelectionResult {
  selectedHotel: HotelResult | null
  selectedHotels: HotelResult[]
  selectHotel: (hotel: HotelResult) => void
  deselectHotel: (hotelId: string) => void
  toggleHotel: (hotel: HotelResult) => void
  clearSelection: () => void
  isSelected: (hotelId: string) => boolean
}

export function useHotelSelection(
  multiSelect = false
): UseHotelSelectionResult {
  const [selectedHotel, setSelectedHotel] = useState<HotelResult | null>(null)
  const [selectedHotels, setSelectedHotels] = useState<HotelResult[]>([])

  const selectHotel = useCallback(
    (hotel: HotelResult) => {
      if (multiSelect) {
        setSelectedHotels((prev) => {
          if (prev.some((h) => h.id === hotel.id)) {
            return prev
          }
          return [...prev, hotel]
        })
      } else {
        setSelectedHotel(hotel)
      }
    },
    [multiSelect]
  )

  const deselectHotel = useCallback((hotelId: string) => {
    setSelectedHotels((prev) => prev.filter((h) => h.id !== hotelId))
    setSelectedHotel((prev) => (prev?.id === hotelId ? null : prev))
  }, [])

  const toggleHotel = useCallback(
    (hotel: HotelResult) => {
      if (multiSelect) {
        setSelectedHotels((prev) => {
          if (prev.some((h) => h.id === hotel.id)) {
            return prev.filter((h) => h.id !== hotel.id)
          }
          return [...prev, hotel]
        })
      } else {
        setSelectedHotel((prev) => (prev?.id === hotel.id ? null : hotel))
      }
    },
    [multiSelect]
  )

  const clearSelection = useCallback(() => {
    setSelectedHotel(null)
    setSelectedHotels([])
  }, [])

  const isSelected = useCallback(
    (hotelId: string) => {
      if (multiSelect) {
        return selectedHotels.some((h) => h.id === hotelId)
      }
      return selectedHotel?.id === hotelId
    },
    [multiSelect, selectedHotel, selectedHotels]
  )

  return {
    selectedHotel,
    selectedHotels,
    selectHotel,
    deselectHotel,
    toggleHotel,
    clearSelection,
    isSelected,
  }
}

// ============================================================================
// useHotelLocalStorage - Persist search state
// ============================================================================

interface HotelSearchState {
  lastSearch?: HotelSearchParams
  recentSearches: HotelSearchParams[]
  favorites: string[] // Hotel IDs
}

const STORAGE_KEY = "travelr-hotel-search"
const MAX_RECENT_SEARCHES = 5

export function useHotelLocalStorage() {
  const [state, setState] = useState<HotelSearchState>(() => {
    if (typeof window === "undefined") {
      return { recentSearches: [], favorites: [] }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored
        ? JSON.parse(stored)
        : { recentSearches: [], favorites: [] }
    } catch {
      return { recentSearches: [], favorites: [] }
    }
  })

  const saveLastSearch = useCallback((params: HotelSearchParams) => {
    setState((prev) => {
      const newState = {
        ...prev,
        lastSearch: params,
        recentSearches: [
          params,
          ...prev.recentSearches.filter(
            (s) => s.destination !== params.destination
          ),
        ].slice(0, MAX_RECENT_SEARCHES),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }, [])

  const addFavorite = useCallback((hotelId: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        favorites: [...new Set([...prev.favorites, hotelId])],
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }, [])

  const removeFavorite = useCallback((hotelId: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        favorites: prev.favorites.filter((id) => id !== hotelId),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }, [])

  const isFavorite = useCallback(
    (hotelId: string) => state.favorites.includes(hotelId),
    [state.favorites]
  )

  const clearRecentSearches = useCallback(() => {
    setState((prev) => {
      const newState = { ...prev, recentSearches: [] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }, [])

  return {
    lastSearch: state.lastSearch,
    recentSearches: state.recentSearches,
    favorites: state.favorites,
    saveLastSearch,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearRecentSearches,
  }
}
