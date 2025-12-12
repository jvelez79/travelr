"use client"

import { useState } from "react"
import { MapPin, Plus, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlaceItem } from "./PlaceItem"
import type { SavedPlace } from "@/types/plan"

interface PlacesToVisitSectionProps {
  places: SavedPlace[]
  onAddPlace: (place: SavedPlace) => void
  onDeletePlace: (id: string) => void
  onAddToItinerary?: (place: SavedPlace) => void
}

export function PlacesToVisitSection({
  places,
  onAddPlace,
  onDeletePlace,
  onAddToItinerary,
}: PlacesToVisitSectionProps) {
  const [newPlaceName, setNewPlaceName] = useState("")

  const handleAddPlace = () => {
    if (!newPlaceName.trim()) return

    const newPlace: SavedPlace = {
      id: `place-${Date.now()}`,
      name: newPlaceName.trim(),
      addedAt: new Date().toISOString(),
    }

    onAddPlace(newPlace)
    setNewPlaceName("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddPlace()
    }
  }

  return (
    <section id="places" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Lugares por visitar</h3>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {places.length === 0 ? (
          <div className="p-6 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay lugares guardados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Guarda lugares desde la pestana Explorar o agregalos manualmente
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {places.map((place, index) => (
              <div key={place.id} className="px-4">
                <PlaceItem
                  place={place}
                  index={index}
                  onDelete={onDeletePlace}
                  onAddToItinerary={onAddToItinerary}
                />
              </div>
            ))}
          </div>
        )}

        {/* Add place input */}
        <div className="border-t border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Agregar un lugar..."
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-8"
            />
            {newPlaceName.trim() && (
              <Button size="sm" variant="ghost" onClick={handleAddPlace}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
