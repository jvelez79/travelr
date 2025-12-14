"use client"

import { Hotel } from "lucide-react"
import type { AccommodationSuggestion } from "@/types/plan"
import { cn } from "@/lib/utils"

interface AccommodationBlockProps {
  accommodation: AccommodationSuggestion
  onClick?: () => void
}

/**
 * A special block that represents the accommodation where the user
 * stayed the night before. This is rendered automatically before
 * the first activity of the day and is NOT editable or draggable.
 */
export function AccommodationBlock({ accommodation, onClick }: AccommodationBlockProps) {
  const formatCheckOutTime = () => {
    if (accommodation.checkOutTime) {
      return `Check-out: ${accommodation.checkOutTime}`
    }
    return null
  }

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border-2 border-dashed",
        "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700",
        "transition-all cursor-pointer",
        "hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600"
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
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        <Hotel className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </div>

      {/* Accommodation Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Alojamiento
          </span>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {accommodation.name}
        </p>
        {accommodation.area && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {accommodation.area}
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
