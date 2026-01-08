"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useThingsToDo, useRemoveFromThingsToDo, type ThingsToDoItem } from "@/hooks/useThingsToDo"
import { AddToDayModal } from "./AddToDayModal"
import type { GeneratedPlan } from "@/types/plan"

interface ThingsToDoSectionProps {
  tripId: string
  plan: GeneratedPlan
  onAddToDay: (item: ThingsToDoItem, dayNumber: number) => void
}

export function ThingsToDoSection({ tripId, plan, onAddToDay }: ThingsToDoSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ThingsToDoItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { items, loading, refetch } = useThingsToDo(tripId)
  const { removeItem, loading: removing } = useRemoveFromThingsToDo()

  const handleRemove = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await removeItem(itemId)
    refetch()
  }

  const handleAddToDay = (item: ThingsToDoItem) => {
    setSelectedItem(item)
    setIsAddModalOpen(true)
  }

  const handleDaySelected = async (dayNumber: number) => {
    if (selectedItem) {
      onAddToDay(selectedItem, dayNumber)
      // Remove from Things To Do after adding to day
      await removeItem(selectedItem.id)
      refetch()
      setIsAddModalOpen(false)
      setSelectedItem(null)
    }
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t border-border">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Things To Do</span>
            {items.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {items.length}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-6 px-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Compass className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No places saved yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Explore" to discover places
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <ThingsToDoItem
                    key={item.id}
                    item={item}
                    onAddToDay={() => handleAddToDay(item)}
                    onRemove={(e) => handleRemove(item.id, e)}
                    removing={removing}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Add to Day Modal */}
      <AddToDayModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedItem(null)
        }}
        onSelectDay={handleDaySelected}
        plan={plan}
        itemName={selectedItem?.place_data.name || ""}
      />
    </>
  )
}

// Individual item component
interface ThingsToDoItemProps {
  item: ThingsToDoItem
  onAddToDay: () => void
  onRemove: (e: React.MouseEvent) => void
  removing: boolean
}

function ThingsToDoItem({ item, onAddToDay, onRemove, removing }: ThingsToDoItemProps) {
  const { place_data } = item
  const imageUrl = place_data.photos?.[0]?.photo_reference || null

  return (
    <div
      className="group flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
      onClick={onAddToDay}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={place_data.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            unoptimized={imageUrl.includes("googleapis.com")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Compass className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {place_data.name}
        </h4>
        <div className="flex items-center gap-1 mt-0.5">
          {place_data.rating && (
            <span className="text-xs text-muted-foreground">
              ★ {place_data.rating.toFixed(1)}
            </span>
          )}
          {item.category && (
            <span className="text-xs text-muted-foreground capitalize">
              • {item.category.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation()
            onAddToDay()
          }}
        >
          <Calendar className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onRemove}
          disabled={removing}
        >
          {removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}
