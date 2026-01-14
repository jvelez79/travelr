"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Hotel, CheckCircle, Clock, Sparkles, LogOut, AlertTriangle, ChevronRight, Map } from "lucide-react"
import { ActivityListItem } from "./ActivityListItem"
import { ActivityEditor } from "./ActivityEditor"
import { DayTimelineModal } from "./DayTimelineModal"
import { DayMapModal } from "./DayMapModal"
import { TransportBlock } from "./TransportBlock"
import { FlightBadge, getFlightsForDate } from "@/components/planning/overview/FlightBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { recalculateTimeline } from "@/lib/timeUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"
import { useAccommodationTransport } from "@/hooks/useAccommodationTransport"
import { cn } from "@/lib/utils"
import { parseLocalDate } from "@/lib/date-utils"
import type { ItineraryDay, TimelineEntry, FlightReservation } from "@/types/plan"
import type { Accommodation } from "@/types/accommodation"
import type { AccommodationIndicatorInfo } from "@/lib/accommodation/utils"
import type { DayGenerationStatus } from "@/hooks/useDayGeneration"

interface DayEditorProps {
  day: ItineraryDay
  flights?: FlightReservation[]
  onUpdateDay: (updatedDay: ItineraryDay) => void
  // Streaming props
  generationStatus?: DayGenerationStatus
  streamingTimeline?: TimelineEntry[]
  isGenerating?: boolean
  // Canvas integration
  onActivityClick?: (activity: TimelineEntry) => void
  onAddActivityClick?: () => void
  registerRef?: (ref: HTMLDivElement | null) => void
  onRegenerate?: () => Promise<void>
  // Accommodation integration (separated concerns)
  accommodationIndicator?: AccommodationIndicatorInfo | null // For header display
  transportOriginAccommodation?: Accommodation | null // For transport calculation (Day 2+)
  checkOutAccommodation?: Accommodation | null // For check-out block
  onAccommodationClick?: (accommodation: Accommodation) => void
}

export function DayEditor({
  day,
  flights = [],
  onUpdateDay,
  generationStatus = 'completed',
  streamingTimeline = [],
  isGenerating = false,
  onActivityClick,
  onAddActivityClick,
  registerRef,
  onRegenerate,
  accommodationIndicator,
  transportOriginAccommodation,
  checkOutAccommodation,
  onAccommodationClick,
}: DayEditorProps) {
  const hasActivities = day.timeline.length > 0
  const [expanded, setExpanded] = useState(true)
  const [editingActivity, setEditingActivity] = useState<TimelineEntry | null>(null)
  const [editorMode, setEditorMode] = useState<"edit" | "create">("edit")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [isCalculatingTransport, setIsCalculatingTransport] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Use streaming timeline if generating, otherwise use day's timeline
  const displayTimeline = isGenerating ? streamingTimeline : day.timeline
  const firstActivity = displayTimeline.length > 0 ? displayTimeline[0] : null

  // Get flights for this day
  const dayFlights = getFlightsForDate(flights, day.date)

  // Calculate transport from accommodation to first activity (only for Day 2+)
  // transportOriginAccommodation is null for Day 1, so transport won't be shown
  const { travelInfo: accommodationTransport, isLoading: isLoadingAccommodationTransport } =
    useAccommodationTransport(transportOriginAccommodation ?? null, firstActivity)

  // Droppable for receiving places from PlaceSearch
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `day-${day.day}`,
    data: {
      type: "day-drop-zone",
      dayNumber: day.day,
    },
  })

  const isPending = generationStatus === 'pending'
  const hasError = generationStatus === 'error'

  // Check if there are activities or accommodation with coordinates for map
  const hasActivitiesWithCoordinates = displayTimeline.some(
    (a) => a.placeData?.coordinates?.lat && a.placeData?.coordinates?.lng
  ) || (accommodationIndicator?.accommodation?.placeData?.coordinates?.lat &&
        accommodationIndicator?.accommodation?.placeData?.coordinates?.lng)

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Fecha por definir"
    const date = parseLocalDate(dateStr)
    if (isNaN(date.getTime())) return "Fecha por definir"
    return date.toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  const handleEditActivity = (activity: TimelineEntry) => {
    if (isGenerating) return // Disable while generating
    setEditingActivity(activity)
    setEditorMode("edit")
    setIsEditorOpen(true)
  }

  const handleAddActivity = () => {
    if (isGenerating) return // Disable while generating
    setEditingActivity(null)
    setEditorMode("create")
    setIsEditorOpen(true)
  }

  const handleSaveActivity = async (activity: TimelineEntry) => {
    let updatedTimeline: TimelineEntry[]

    if (editorMode === "edit") {
      // Update existing
      updatedTimeline = day.timeline.map((a) =>
        a.id === activity.id ? activity : a
      )
    } else {
      // Add new
      updatedTimeline = [...day.timeline, activity]
    }

    // Recalculate times after adding/editing
    const newTimeline = recalculateTimeline(updatedTimeline)

    // Update immediately with new times
    onUpdateDay({
      ...day,
      timeline: newTimeline,
    })

    // Calculate transport in background
    setIsCalculatingTransport(true)
    try {
      const timelineWithTransport = await calculateTransportForTimeline(newTimeline)
      onUpdateDay({
        ...day,
        timeline: timelineWithTransport,
      })
    } finally {
      setIsCalculatingTransport(false)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    const filteredTimeline = day.timeline.filter((a) => a.id !== activityId)
    // Recalculate times after deletion
    const newTimeline = recalculateTimeline(filteredTimeline)

    // Update immediately
    onUpdateDay({
      ...day,
      timeline: newTimeline,
    })

    // Recalculate transport for affected activities
    if (newTimeline.length >= 2) {
      setIsCalculatingTransport(true)
      try {
        const timelineWithTransport = await calculateTransportForTimeline(newTimeline)
        onUpdateDay({
          ...day,
          timeline: timelineWithTransport,
        })
      } finally {
        setIsCalculatingTransport(false)
      }
    }
  }

  // Combine refs for both registerRef and drop ref
  const handleRef = (node: HTMLDivElement | null) => {
    setDropRef(node)
    if (registerRef) registerRef(node)
  }

  return (
    <div
      ref={handleRef}
      className={cn(
        "group/day h-full flex flex-col rounded-xl bg-card border transition-all duration-300 ease-out",
        // Normal state - enhanced shadows
        !isOver && "border-border/50 shadow-sm hover:shadow-xl hover:border-border hover:-translate-y-0.5",
        // Has activities - slightly elevated
        hasActivities && !isOver && "shadow-md hover:shadow-xl",
        // Collapsed empty state
        !expanded && !hasActivities && "opacity-70 hover:opacity-100 hover:shadow-lg",
        // Drop target state
        isOver && "border-primary border-dashed bg-primary/5 ring-2 ring-primary/20 shadow-xl scale-[1.01]",
        // Generation states
        isGenerating && "border-primary/40 shadow-primary/20 ring-1 ring-primary/10",
        isPending && "opacity-40",
        hasError && "border-destructive/40 shadow-destructive/10"
      )}
    >
      {/* Day Header - Modern Visual Style */}
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer select-none text-left hover:bg-muted/30 transition-colors rounded-t-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded(!expanded)
          }
        }}
        aria-expanded={expanded}
      >
        {/* Day Date Block - More prominent */}
        <div className={cn(
          "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 shadow-sm",
          isGenerating
            ? "bg-primary/20 ring-2 ring-primary/30"
            : hasActivities
            ? "bg-primary text-primary-foreground shadow-primary/20"
            : "bg-muted border border-border/50"
        )}>
          <span className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            hasActivities && !isGenerating ? "text-primary-foreground/90" : "text-muted-foreground"
          )}>
            {formatDate(day.date).split(' ')[0]?.slice(0, 3)}
          </span>
          <span className={cn(
            "text-xl font-bold leading-none mt-0.5",
            hasActivities && !isGenerating ? "text-primary-foreground" : "text-foreground"
          )}>
            {formatDate(day.date).split(' ')[1] || day.day}
          </span>
        </div>

        {/* Day Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium transition-colors",
              hasActivities ? "text-foreground" : "text-muted-foreground"
            )}>
              {formatDate(day.date).split(',').slice(1).join(',').trim() || `Día ${day.day}`}
            </span>
            {day.title && day.title !== `Día ${day.day}` && (
              <span className="text-xs text-muted-foreground/70 truncate">
                · {day.title}
              </span>
            )}
          </div>
          {/* Activity summary when collapsed - more informative */}
          {!expanded && hasActivities && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-primary/15 text-[10px] font-semibold text-primary">
                {displayTimeline.length}
              </span>
              <span>{displayTimeline.length === 1 ? 'actividad' : 'actividades'}</span>
              {displayTimeline[0]?.location && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground/70">{displayTimeline[0].location}</span>
                </>
              )}
            </p>
          )}
          {/* Empty state hint when collapsed - more inviting */}
          {!expanded && !hasActivities && !isPending && !isGenerating && (
            <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Clic para agregar actividades</span>
            </p>
          )}
        </div>

        {/* Activity Thumbnails Preview (when collapsed) */}
        {!expanded && hasActivities && !isGenerating && (
          <div className="hidden sm:flex items-center -space-x-2">
            {displayTimeline.slice(0, 4).map((activity, i) => (
              <div
                key={activity.id}
                className="w-8 h-8 rounded-lg bg-muted overflow-hidden ring-2 ring-card"
                style={{ zIndex: 4 - i }}
              >
                {activity.placeData?.images?.[0] ? (
                  <img
                    src={activity.placeData.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : activity.icon ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-sm">
                    {activity.icon}
                  </div>
                ) : (
                  <div className="w-full h-full bg-primary/10" />
                )}
              </div>
            ))}
            {displayTimeline.length > 4 && (
              <div className="w-8 h-8 rounded-lg bg-muted ring-2 ring-card flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">+{displayTimeline.length - 4}</span>
              </div>
            )}
          </div>
        )}

        {/* Status Badges - Refined */}
        <div className="flex items-center gap-2.5">
          {isGenerating && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Generando
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              Pendiente
            </span>
          )}
          {/* Flight badges for this day */}
          {dayFlights.length > 0 && <FlightBadge flights={dayFlights} />}
          {hasError && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-xs font-medium text-destructive">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Error
              </span>
              {onRegenerate && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (isRegenerating) return
                    setIsRegenerating(true)
                    try {
                      await onRegenerate()
                    } finally {
                      setIsRegenerating(false)
                    }
                  }}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isRegenerating ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Regenerando...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerar
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          {isCalculatingTransport && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary animate-pulse">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Rutas
            </span>
          )}

          {/* Map Button - Show day route on map */}
          {hasActivitiesWithCoordinates && !isGenerating && !isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMapModalOpen(true)
              }}
              title="Ver mapa del día"
              className="opacity-0 group-hover/day:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Map className="w-4 h-4" />
            </button>
          )}

          {/* Regenerate Day Button - Always visible on hover (subtle) */}
          {onRegenerate && !isGenerating && !isPending && !hasError && (
            <button
              onClick={async (e) => {
                e.stopPropagation()
                if (isRegenerating) return
                setIsRegenerating(true)
                try {
                  await onRegenerate()
                } finally {
                  setIsRegenerating(false)
                }
              }}
              disabled={isRegenerating}
              title="Regenerar este día"
              className="opacity-0 group-hover/day:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {isRegenerating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          )}

          {/* Activity Count - Elegant Pill */}
          {/* <span className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            displayTimeline.length > 0
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}>
            {displayTimeline.length} {displayTimeline.length === 1 ? 'actividad' : 'actividades'}
          </span> */}
        </div>

        {/* Expand Chevron - More visible */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          "bg-muted group-hover/day:bg-muted/80",
          expanded ? "bg-primary/10" : "bg-muted"
        )}>
          <svg
            className={cn(
              "w-5 h-5 transition-transform duration-300",
              expanded ? "rotate-180 text-primary" : "text-foreground/70"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Drop indicator when dragging over */}
      {isOver && (
        <div className="mx-5 mb-4 p-4 rounded-xl border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium text-primary">Suelta aqui para agregar al Dia {day.day}</span>
        </div>
      )}

      {/* Expanded Content */}
      {expanded && (
        <div className={cn(
          "px-4 pb-4 pt-0 flex-1 flex flex-col",
          isGenerating && "pointer-events-none"
        )}>
          {/* Divider line */}
          <div className="h-px bg-border/40 mb-3" />

          {/* Accommodation Context Panel - Where you're staying tonight */}
          {accommodationIndicator ? (
            <button
              onClick={() => onAccommodationClick?.(accommodationIndicator.accommodation)}
              className={cn(
                "group/acc w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-4 text-left",
                "border-2 cursor-pointer",
                "transition-all duration-200 ease-out",
                "hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                accommodationIndicator.accommodation.status === "confirmed"
                  ? "bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:border-green-300"
                  : accommodationIndicator.accommodation.status === "pending"
                  ? "bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 hover:border-amber-300"
                  : "bg-gradient-to-r from-blue-50 to-sky-50/50 dark:from-blue-950/30 dark:to-sky-950/20 border-blue-200 dark:border-blue-800 hover:border-blue-300"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                accommodationIndicator.accommodation.status === "confirmed"
                  ? "bg-green-100 dark:bg-green-900/50"
                  : accommodationIndicator.accommodation.status === "pending"
                  ? "bg-amber-100 dark:bg-amber-900/50"
                  : "bg-blue-100 dark:bg-blue-900/50"
              )}>
                <Hotel className={cn(
                  "w-5 h-5",
                  accommodationIndicator.accommodation.status === "confirmed"
                    ? "text-green-600 dark:text-green-400"
                    : accommodationIndicator.accommodation.status === "pending"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Esta noche: {accommodationIndicator.accommodation.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  {accommodationIndicator.isCheckInDay ? (
                    <>
                      <span>Check-in desde las {accommodationIndicator.accommodation.checkInTime || "3:00 PM"}</span>
                      <span>·</span>
                      <span>Noche 1/{accommodationIndicator.totalNights}</span>
                    </>
                  ) : accommodationIndicator.isLastNight ? (
                    <>
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Check-out mañana {accommodationIndicator.accommodation.checkOutTime || "11:00 AM"}
                      </span>
                      <span>·</span>
                      <span>Noche {accommodationIndicator.nightNumber}/{accommodationIndicator.totalNights}</span>
                    </>
                  ) : (
                    <span>Noche {accommodationIndicator.nightNumber}/{accommodationIndicator.totalNights}</span>
                  )}
                </p>
              </div>
              {/* Status badge - subtle outlined style */}
              <div className="flex-shrink-0">
                {accommodationIndicator.accommodation.status === "confirmed" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-300 dark:border-green-700 text-xs font-medium text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    Confirmado
                  </span>
                )}
                {accommodationIndicator.accommodation.status === "suggested" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-300 dark:border-blue-700 text-xs font-medium text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-3 h-3" />
                    Sugerencia
                  </span>
                )}
                {accommodationIndicator.accommodation.status === "pending" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <Clock className="w-3 h-3" />
                    Pendiente
                  </span>
                )}
              </div>
              {/* Chevron indicator - shows more info available */}
              <ChevronRight className={cn(
                "w-4 h-4 flex-shrink-0 transition-all duration-200",
                "text-muted-foreground/50 group-hover/acc:text-muted-foreground",
                "opacity-0 -translate-x-1 group-hover/acc:opacity-100 group-hover/acc:translate-x-0"
              )} />
            </button>
          ) : null}

          {/* Activities List with Transport - Timeline style */}
          <div className="relative space-y-0.5">
            {/* Vertical timeline line - connecting activities visually */}
            {displayTimeline.length > 1 && (
              <div className="absolute left-[4.1rem] top-4 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 via-border to-primary/50 rounded-full" />
            )}
            {isPending && (
              // Show skeleton for pending days
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Check-out Block - Only shown on checkout day */}
            {!isPending && !isGenerating && checkOutAccommodation && (
              <button
                onClick={() => onAccommodationClick?.(checkOutAccommodation)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2",
                  "bg-slate-100 dark:bg-slate-800",
                  "border-2 border-dashed border-slate-300 dark:border-slate-600",
                  "cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-sm transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                )}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                      Check-out
                    </span>
                    {checkOutAccommodation.checkOutTime && (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {checkOutAccommodation.checkOutTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {checkOutAccommodation.name}
                  </p>
                </div>
              </button>
            )}

            {/* Transport from accommodation to first activity (Day 2+ only) */}
            {!isPending && !isGenerating && transportOriginAccommodation && (
              <>
                {accommodationTransport && firstActivity && (
                  <TransportBlock
                    travelInfo={accommodationTransport}
                    fromLocation={{
                      name: transportOriginAccommodation.name,
                      coordinates: transportOriginAccommodation.placeData?.coordinates
                    }}
                    toLocation={{
                      name: firstActivity.location,
                      placeId: firstActivity.placeId,
                      coordinates: firstActivity.placeData?.coordinates
                    }}
                  />
                )}
                {/* Loading indicator for accommodation transport */}
                {isLoadingAccommodationTransport && firstActivity && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Calculando ruta...
                    </div>
                  </div>
                )}
              </>
            )}

            {!isPending && displayTimeline.map((activity, index) => {
              const nextActivity = displayTimeline[index + 1]
              const showTransport = activity.travelToNext &&
                                   activity.travelToNext.method !== 'none' &&
                                   nextActivity

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "transition-all",
                    // Animation for streaming entries
                    isGenerating && "animate-in fade-in slide-in-from-bottom-2 duration-300"
                  )}
                  style={{
                    // Stagger animation for streaming
                    animationDelay: isGenerating ? `${index * 100}ms` : undefined,
                  }}
                >
                  <ActivityListItem
                    activity={activity}
                    dayNumber={day.day}
                    onEdit={handleEditActivity}
                    onDelete={handleDeleteActivity}
                    onSelect={onActivityClick}
                    disabled={isGenerating}
                    enableDrag={!isGenerating}
                  />
                  {showTransport && nextActivity && (
                    <TransportBlock
                      travelInfo={activity.travelToNext!}
                      fromLocation={{
                        name: activity.location,
                        placeId: activity.placeId,
                        coordinates: activity.placeData?.coordinates
                      }}
                      toLocation={{
                        name: nextActivity.location,
                        placeId: nextActivity.placeId,
                        coordinates: nextActivity.placeData?.coordinates
                      }}
                    />
                  )}
                </div>
              )
            })}

            {/* Generating indicator */}
            {isGenerating && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-primary font-medium">Generando actividades...</p>
                  <p className="text-xs text-muted-foreground">Los bloques aparecen mientras se generan</p>
                </div>
              </div>
            )}
          </div>

          {/* Empty state message - No CTA */}
          {!isGenerating && !isPending && !hasActivities && (
            <div className="mt-3 text-center">
              <p className="text-sm text-muted-foreground/60 py-4">
                Sin actividades
              </p>
              <p className="text-xs text-muted-foreground/50 pb-2">
                Usa el botón "Buscar" en el sidebar para agregar actividades
              </p>
            </div>
          )}

          {/* Day Summary - Only show if there's meaningful data (not placeholder values) */}
          {!isGenerating && !isPending && hasActivities && (
            (day.summary?.duration && day.summary.duration !== "Por definir") ||
            day.summary?.drivingTotal
          ) && (
            <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-4">
              {day.summary?.duration && day.summary.duration !== "Por definir" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {day.summary.duration}
                </span>
              )}
              {day.summary?.drivingTotal && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  {day.summary.drivingTotal.distance}
                </span>
              )}
            </div>
          )}

        </div>
      )}

      {/* Activity Editor Modal */}
      <ActivityEditor
        activity={editingActivity}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveActivity}
        mode={editorMode}
      />

      {/* Timeline Modal */}
      <DayTimelineModal
        day={day}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        onUpdateDay={onUpdateDay}
      />

      {/* Day Map Modal */}
      <DayMapModal
        day={day}
        accommodation={accommodationIndicator?.accommodation}
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />
    </div>
  )
}
