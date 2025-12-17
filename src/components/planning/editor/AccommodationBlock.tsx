"use client"

import { Hotel, CheckCircle, Clock, Sparkles } from "lucide-react"
import type { Accommodation, AccommodationStatus } from "@/types/accommodation"
import { cn } from "@/lib/utils"

interface AccommodationBlockProps {
  accommodation: Accommodation
  dayDate?: string // ISO date of the current day (e.g., "2024-12-19")
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
 * A special block that represents the accommodation where the user
 * stayed the night before. This is rendered automatically before
 * the first activity of the day and is NOT editable or draggable.
 *
 * Shows status badges based on accommodation status.
 */
export function AccommodationBlock({ accommodation, dayDate, onClick }: AccommodationBlockProps) {
  // Only show checkout time if today is the checkout day
  const isCheckoutDay = dayDate && accommodation.checkOut &&
    dayDate === accommodation.checkOut

  const formatCheckOutTime = () => {
    if (isCheckoutDay && accommodation.checkOutTime) {
      return `Check-out: ${accommodation.checkOutTime}`
    }
    return null
  }

  const status = accommodation.status
  const statusConfig = STATUS_CONFIG[status]

  // Determine border style based on status
  const isSolidBorder = status === "confirmed" || status === "pending"

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border-2",
        // Border style: solid for confirmed/pending, dashed for suggested
        isSolidBorder ? "border-solid" : "border-dashed",
        // Background and border colors based on status
        statusConfig.bgClass,
        statusConfig.borderClass,
        "transition-all cursor-pointer",
        "hover:opacity-90"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
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
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Alojamiento
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
        {accommodation.area && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {accommodation.area}
          </p>
        )}
        {/* Show confirmation number for confirmed accommodations */}
        {accommodation.confirmationNumber && status === "confirmed" && (
          <p className="text-[10px] text-green-600 dark:text-green-400 truncate">
            #{accommodation.confirmationNumber}
          </p>
        )}
      </div>

      {/* Check-out time badge */}
      {formatCheckOutTime() && (
        <div className="flex-shrink-0 px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300">
          {formatCheckOutTime()}
        </div>
      )}

      {/* Visual indicator that this is informational */}
      <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}
