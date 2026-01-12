"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChevronDown,
  Compass,
  Trash2,
  Calendar,
  Loader2,
  GripVertical,
  Ban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useThingsToDo, useRemoveFromThingsToDo, type ThingsToDoItem } from "@/hooks/useThingsToDo"
import { useCanvasDnd } from "@/components/canvas/CanvasDndContext"
import { AddToDayModal } from "./AddToDayModal"
import type { GeneratedPlan } from "@/types/plan"

interface ThingsToDoSectionProps {
  tripId: string
  plan: GeneratedPlan
  onAddToDay: (item: ThingsToDoItem, dayNumber: number) => void
  refreshTrigger?: number
}

export function ThingsToDoSection({ tripId, plan, onAddToDay, refreshTrigger }: ThingsToDoSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ThingsToDoItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { items, loading, refetch } = useThingsToDo(tripId)

  // Refetch when refreshTrigger changes (after drag-drop operations)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch()
    }
  }, [refreshTrigger, refetch])
  const { removeItem, loading: removing } = useRemoveFromThingsToDo()
  const { isDraggingActivity, canDropToIdeas, isDesktop } = useCanvasDnd()

  // Droppable for receiving activities from timeline
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: "ideas-drop-zone",
    data: {
      type: "ideas-drop-zone",
    },
    disabled: !isDraggingActivity || !canDropToIdeas,
  })

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

  // Show drop zone when dragging an activity
  const showDropZone = isDraggingActivity && isDesktop

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t border-border/50">
        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Compass className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm text-foreground block">Ideas guardadas</span>
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {items.length} lugar{items.length !== 1 ? 'es' : ''} por agregar
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            "w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center transition-transform duration-200",
            isOpen && "rotate-180"
          )}>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-4">
            {/* Drop zone for activities - appears when dragging */}
            {showDropZone && (
              <div
                ref={setDropRef}
                className={cn(
                  "mb-3 p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all duration-200",
                  canDropToIdeas
                    ? isOver
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-primary/50 bg-primary/5"
                    : "border-muted-foreground/30 bg-muted/20"
                )}
              >
                {canDropToIdeas ? (
                  <>
                    <Compass className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {isOver ? "Suelta para guardar" : "Suelta aqui para guardar como idea"}
                    </span>
                  </>
                ) : (
                  <>
                    <Ban className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Solo actividades con lugar enlazado
                    </span>
                  </>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-muted/20 border border-dashed border-muted-foreground/20">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Compass className="h-7 w-7 text-primary/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Sin ideas guardadas
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Usa <span className="font-medium text-primary">Explore</span> para descubrir lugares y guardarlos aquí
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <DraggableThingsToDoItem
                    key={item.id}
                    item={item}
                    onAddToDay={() => handleAddToDay(item)}
                    onRemove={(e) => handleRemove(item.id, e)}
                    removing={removing}
                    isDesktop={isDesktop}
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

// Individual item component - Draggable version
interface DraggableThingsToDoItemProps {
  item: ThingsToDoItem
  onAddToDay: () => void
  onRemove: (e: React.MouseEvent) => void
  removing: boolean
  isDesktop: boolean
}

function DraggableThingsToDoItem({ item, onAddToDay, onRemove, removing, isDesktop }: DraggableThingsToDoItemProps) {
  const { place_data } = item
  const imageUrl = place_data.photos?.[0]?.photo_reference || null

  // Only enable dragging on desktop
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `saved-idea-${item.id}`,
    data: {
      type: "saved-idea",
      item,
    },
    disabled: !isDesktop,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative rounded-xl overflow-hidden bg-card border border-border/60 transition-all duration-200",
        isDragging
          ? "opacity-50 shadow-xl scale-95"
          : "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      {/* Drag handle - only visible on desktop */}
      {isDesktop && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="p-1 rounded bg-black/50 backdrop-blur-sm">
            <GripVertical className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Main clickable area - using div to avoid nested button issue */}
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        onClick={onAddToDay}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onAddToDay()
          }
        }}
      >
        {/* Image Section - Taller for better visuals */}
        <div className="relative h-24 bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={place_data.name}
              fill
              className="object-cover"
              unoptimized={imageUrl.includes("googleapis.com")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <Compass className="h-6 w-6 text-primary/30" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Rating badge */}
          {place_data.rating && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
              <span className="text-amber-400 text-xs">★</span>
              <span className="text-xs font-medium text-white">{place_data.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Quick action button on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
              onClick={onRemove}
              disabled={removing}
            >
              {removing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              )}
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-2.5">
          <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {place_data.name}
          </h4>
          {item.category && (
            <span className="inline-block mt-1.5 text-[10px] text-primary/80 capitalize px-2 py-0.5 rounded-full bg-primary/10 font-medium">
              {item.category.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Add to day overlay on hover */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Agregar a día
          </div>
        </div>
      </div>
    </div>
  )
}
