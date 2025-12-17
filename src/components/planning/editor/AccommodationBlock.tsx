"use client"

import { Hotel, CheckCircle, Clock, Sparkles, LogOut, ChevronRight } from "lucide-react"
import type { Accommodation, AccommodationStatus } from "@/types/accommodation"
import { cn } from "@/lib/utils"

/**
 * Display mode for multi-night accommodations
 * - 'check-in': First night - full block with duration info
 * - 'staying': Intermediate nights - compact single line
 * - 'last-night': Last night of stay - compact with check-out reminder
 * - 'check-out': Check-out day - block showing departure
 */
export type AccommodationDisplayMode = 'check-in' | 'staying' | 'last-night' | 'check-out'

interface AccommodationBlockProps {
  accommodation: Accommodation
  dayDate?: string // ISO date of the current day (e.g., "2024-12-19")
  displayMode?: AccommodationDisplayMode // Override calculated display mode
  onClick?: () => void
}

// Status badge configuration
const STATUS_CONFIG: Record<AccommodationStatus, {
  label: string
  icon: React.ReactNode
  bgClass: string
  textClass: string
  borderClass: string
}> = {
  suggested: {
    label: "Sugerencia AI",
    icon: <Sparkles className="w-3 h-3" />,
    bgClass: "bg-blue-100 dark:bg-blue-900/50",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-300 dark:border-blue-700",
  },
  pending: {
    label: "Pendiente",
    icon: <Clock className="w-3 h-3" />,
    bgClass: "bg-amber-100 dark:bg-amber-900/50",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-300 dark:border-amber-700",
  },
  confirmed: {
    label: "Confirmado",
    icon: <CheckCircle className="w-3 h-3" />,
    bgClass: "bg-green-100 dark:bg-green-900/50",
    textClass: "text-green-700 dark:text-green-300",
    borderClass: "border-green-500 dark:border-green-600",
  },
  cancelled: {
    label: "Cancelado",
    icon: null,
    bgClass: "bg-gray-100 dark:bg-gray-800",
    textClass: "text-gray-500 dark:text-gray-400",
    borderClass: "border-gray-300 dark:border-gray-600",
  },
}

/**
 * Calculate display mode based on current day date and accommodation dates
 */
function calculateDisplayMode(dayDate: string, accommodation: Accommodation): AccommodationDisplayMode {
  const checkIn = accommodation.checkIn
  const checkOut = accommodation.checkOut

  // Check-out day: dayDate equals checkOut
  if (dayDate === checkOut) {
    return 'check-out'
  }

  // Check-in day: dayDate equals checkIn
  if (dayDate === checkIn) {
    return 'check-in'
  }

  // Calculate if this is the last night (day before checkout)
  const checkOutDate = new Date(checkOut)
  const lastNightDate = new Date(checkOutDate)
  lastNightDate.setDate(lastNightDate.getDate() - 1)
  const lastNightStr = lastNightDate.toISOString().split('T')[0]

  if (dayDate === lastNightStr) {
    return 'last-night'
  }

  // Staying: any day between check-in and last night
  return 'staying'
}

/**
 * Calculate which night this is (e.g., "noche 2/3")
 */
function calculateNightNumber(dayDate: string, accommodation: Accommodation): { current: number; total: number } {
  const checkInDate = new Date(accommodation.checkIn)
  const currentDate = new Date(dayDate)

  // Night number is the difference in days from check-in + 1
  const diffTime = currentDate.getTime() - checkInDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const current = diffDays + 1

  return { current, total: accommodation.nights }
}

/**
 * Format date for display
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString("es", { day: "numeric", month: "short" })
}

/**
 * AccommodationBlock - Visual representation of accommodation in timeline
 *
 * Implements Opción B for multi-night display:
 * - Check-in: Full block with duration
 * - Staying: Compact line "Hospedado en X (noche 2/3)"
 * - Last-night: Compact with check-out reminder
 * - Check-out: Block showing departure
 */
export function AccommodationBlock({ accommodation, dayDate, displayMode: overrideMode, onClick }: AccommodationBlockProps) {
  const status = accommodation.status
  const statusConfig = STATUS_CONFIG[status]

  // Calculate display mode from dayDate if not overridden
  const displayMode = overrideMode || (dayDate ? calculateDisplayMode(dayDate, accommodation) : 'check-in')

  // Calculate night number for staying/last-night modes
  const nightInfo = dayDate ? calculateNightNumber(dayDate, accommodation) : { current: 1, total: accommodation.nights }

  // Determine border style based on status
  const isSolidBorder = status === "confirmed" || status === "pending"

  // Common click handler props
  const clickProps = onClick ? {
    onClick,
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onClick()
      }
    },
  } : {}

  // Render compact line for intermediate nights
  if (displayMode === 'staying') {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md",
          "bg-slate-50 dark:bg-slate-800/50",
          "border-l-4",
          status === "confirmed"
            ? "border-l-green-500"
            : status === "pending"
            ? "border-l-amber-400"
            : "border-l-blue-400",
          onClick && "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        {...clickProps}
      >
        <Hotel className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
          Hospedado en: <span className="font-medium">{accommodation.name}</span>
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          (noche {nightInfo.current}/{nightInfo.total})
        </span>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </div>
    )
  }

  // Render compact line with check-out reminder for last night
  if (displayMode === 'last-night') {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md",
          "bg-amber-50 dark:bg-amber-950/30",
          "border-l-4 border-l-amber-400",
          onClick && "cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50"
        )}
        {...clickProps}
      >
        <Hotel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
          <span className="font-medium">{accommodation.name}</span>
          <span className="text-slate-500 dark:text-slate-400 ml-1">
            (noche {nightInfo.current}/{nightInfo.total})
          </span>
        </span>
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Check-out mañana {accommodation.checkOutTime || '11:00 AM'}
        </span>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </div>
    )
  }

  // Render check-out block
  if (displayMode === 'check-out') {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-lg",
          "bg-slate-100 dark:bg-slate-800",
          "border-2 border-dashed border-slate-300 dark:border-slate-600",
          onClick && "cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
        )}
        {...clickProps}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
              Check-out
            </span>
            {accommodation.checkOutTime && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {accommodation.checkOutTime}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
            {accommodation.name}
          </p>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </div>
    )
  }

  // Render full check-in block (default)
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border-2",
        // Border style: solid for confirmed/pending, dashed for suggested
        isSolidBorder ? "border-solid" : "border-dashed",
        // Background and border colors based on status
        statusConfig.bgClass,
        statusConfig.borderClass,
        "transition-all",
        onClick && "cursor-pointer hover:opacity-90"
      )}
      {...clickProps}
    >
      {/* Hotel Icon */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
        status === "confirmed"
          ? "bg-green-200 dark:bg-green-800"
          : status === "pending"
          ? "bg-amber-200 dark:bg-amber-800"
          : "bg-slate-200 dark:bg-slate-700"
      )}>
        <Hotel className={cn(
          "w-5 h-5",
          status === "confirmed"
            ? "text-green-700 dark:text-green-300"
            : status === "pending"
            ? "text-amber-700 dark:text-amber-300"
            : "text-slate-600 dark:text-slate-300"
        )} />
      </div>

      {/* Accommodation Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Check-in
          </span>
          {/* Status Badge */}
          {status !== "cancelled" && (
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              statusConfig.bgClass,
              statusConfig.textClass
            )}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {accommodation.name}
        </p>
        {/* Duration and dates info */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {accommodation.area && (
            <span className="truncate">{accommodation.area}</span>
          )}
          <span>•</span>
          <span className="font-medium">
            {accommodation.nights} {accommodation.nights === 1 ? 'noche' : 'noches'}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            ({formatDate(accommodation.checkIn)} - {formatDate(accommodation.checkOut)})
          </span>
        </div>
        {/* Show confirmation number for confirmed accommodations */}
        {accommodation.confirmationNumber && status === "confirmed" && (
          <p className="text-[10px] text-green-600 dark:text-green-400 truncate mt-0.5">
            #{accommodation.confirmationNumber}
          </p>
        )}
      </div>

      {/* Check-in time and price */}
      <div className="flex-shrink-0 text-right">
        {accommodation.checkInTime && (
          <div className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 mb-1">
            {accommodation.checkInTime}
          </div>
        )}
        {accommodation.totalPrice && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ${accommodation.totalPrice}
          </div>
        )}
      </div>

      {/* Arrow indicator for clickable */}
      {onClick && (
        <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
