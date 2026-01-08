"use client"

import { DayTimeline } from "./DayTimeline"
import type { ItineraryDay } from "@/types/plan"
import { parseLocalDate } from "@/lib/date-utils"

interface DayTimelineModalProps {
  day: ItineraryDay
  isOpen: boolean
  onClose: () => void
  onUpdateDay: (updatedDay: ItineraryDay) => void
}

export function DayTimelineModal({ day, isOpen, onClose, onUpdateDay }: DayTimelineModalProps) {
  if (!isOpen) return null

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = parseLocalDate(dateStr)
      return date.toLocaleDateString("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 my-8 bg-card border border-border rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                {day.day}
              </span>
              <span>{day.title}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(day.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Arrastra las actividades verticalmente para cambiar su hora. Las horas se ajustan en intervalos de 15 minutos.
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-4">
          <DayTimeline day={day} onUpdateDay={onUpdateDay} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
