/**
 * SearchResults Component
 *
 * Grid of search result cards with loading and empty states.
 */

"use client"

import { useRef, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchResultCard } from "./SearchResultCard"
import { Search, Loader2 } from "lucide-react"
import type { Place } from "@/types/explore"
import type { ItineraryDay } from "@/types/plan"

interface SearchResultsProps {
  places: Place[]
  loading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  hoveredPlaceId: string | null
  selectedPlaceId: string | null
  onHoverPlace: (placeId: string | null) => void
  onSelectPlace: (placeId: string | null) => void
  onAddToThingsToDo: (place: Place) => Promise<void>
  onAddToDay: (place: Place, dayNumber: number) => Promise<void>
  days: ItineraryDay[]
  thingsToDoPlaceIds: Set<string>
}

function SearchResultCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-card border">
      <Skeleton className="aspect-square w-full" />
      <div className="p-2">
        <Skeleton className="h-3 w-3/4 mb-1.5" />
        <Skeleton className="h-2.5 w-1/2 mb-1.5" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No se encontraron lugares</h3>
      <p className="text-muted-foreground text-sm">
        Intenta con otra búsqueda o cambia los filtros
      </p>
    </div>
  )
}

export function SearchResults({
  places,
  loading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  hoveredPlaceId,
  selectedPlaceId,
  onHoverPlace,
  onSelectPlace,
  onAddToThingsToDo,
  onAddToDay,
  days,
  thingsToDoPlaceIds,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loading, onLoadMore])

  return (
    <div className="w-full lg:w-[60%] overflow-y-auto p-4 lg:p-6">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <SearchResultCardSkeleton key={i} />
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <EmptyState />
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-muted-foreground">
            {places.length} {places.length === 1 ? "resultado" : "resultados"}
            {hasMore && " (cargando más...)"}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {places.map((place, idx) => (
              <SearchResultCard
                key={place.id}
                place={place}
                index={idx}
                isHovered={hoveredPlaceId === place.id}
                isSelected={selectedPlaceId === place.id}
                isAdded={thingsToDoPlaceIds.has(place.id)}
                onHover={() => onHoverPlace(place.id)}
                onUnhover={() => onHoverPlace(null)}
                onClick={() => onSelectPlace(place.id)}
                onAddToThingsToDo={() => onAddToThingsToDo(place)}
                onAddToDay={(dayNum) => onAddToDay(place, dayNum)}
                days={days}
              />
            ))}
          </div>

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando más lugares...</span>
            </div>
          )}

          {/* Sentinel element for infinite scroll */}
          {hasMore && !isLoadingMore && (
            <div ref={sentinelRef} className="h-10" aria-hidden="true" />
          )}

          {/* End of results message */}
          {!hasMore && places.length > 20 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay más resultados
            </p>
          )}
        </>
      )}
    </div>
  )
}
