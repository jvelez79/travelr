"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useCanvasContext } from "../CanvasContext"
import type { TimelineEntry, GeneratedPlan } from "@/types/plan"
import { estimateDuration, formatDuration, isTypicallyFixedTime, recalculateTimeline } from "@/lib/timeUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"

interface ActivityEditorInPanelProps {
  dayNumber: number
  timeSlot?: string
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
}

const ACTIVITY_ICONS = [
  { emoji: "🛫", label: "Vuelo" },
  { emoji: "🚗", label: "Transporte" },
  { emoji: "🏨", label: "Hotel" },
  { emoji: "🍽️", label: "Comida" },
  { emoji: "☕", label: "Café" },
  { emoji: "🎯", label: "Actividad" },
  { emoji: "🏖️", label: "Playa" },
  { emoji: "🌋", label: "Naturaleza" },
  { emoji: "🛒", label: "Compras" },
  { emoji: "📸", label: "Foto" },
  { emoji: "🎭", label: "Cultura" },
  { emoji: "💤", label: "Descanso" },
]

const DURATION_PRESETS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "1.5 hr", value: 90 },
  { label: "2 hr", value: 120 },
  { label: "3 hr", value: 180 },
]

export function ActivityEditorInPanel({
  dayNumber,
  timeSlot,
  plan,
  onUpdatePlan
}: ActivityEditorInPanelProps) {
  const { clearRightPanel, openSearch } = useCanvasContext()

  const [formData, setFormData] = useState({
    time: timeSlot || "",
    activity: "",
    location: "",
    icon: "🎯",
    notes: "",
    durationMinutes: undefined as number | undefined,
    isFixedTime: false,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when dayNumber changes
  useEffect(() => {
    setFormData({
      time: timeSlot || "",
      activity: "",
      location: "",
      icon: "🎯",
      notes: "",
      durationMinutes: undefined,
      isFixedTime: false,
    })
  }, [dayNumber, timeSlot])

  const day = plan.itinerary.find(d => d.day === dayNumber)

  const handleChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleIconChange = (emoji: string) => {
    setFormData(prev => {
      const newData = { ...prev, icon: emoji }

      // Auto-suggest duration if not already set
      if (prev.durationMinutes === undefined) {
        const suggestedDuration = estimateDuration(emoji)
        if (suggestedDuration > 0) {
          newData.durationMinutes = suggestedDuration
        }
      }

      // Auto-set fixed time for flights
      if (isTypicallyFixedTime(emoji)) {
        newData.isFixedTime = true
      }

      return newData
    })
  }

  const handleSave = async () => {
    if (!onUpdatePlan || !formData.activity.trim()) return

    setIsSaving(true)

    try {
      const newActivity: TimelineEntry = {
        id: `activity-${Date.now()}`,
        time: formData.time || "12:00 PM",
        activity: formData.activity,
        location: formData.location,
        icon: formData.icon,
        notes: formData.notes,
        durationMinutes: formData.durationMinutes,
        isFixedTime: formData.isFixedTime,
      }

      // Find and update the day
      const updatedItinerary = plan.itinerary.map(d => {
        if (d.day !== dayNumber) return d

        // Add new activity and recalculate timeline
        const newTimeline = recalculateTimeline([...d.timeline, newActivity])
        return { ...d, timeline: newTimeline }
      })

      // Update plan immediately
      onUpdatePlan({ ...plan, itinerary: updatedItinerary })

      // Calculate transport in background
      const dayToUpdate = updatedItinerary.find(d => d.day === dayNumber)
      if (dayToUpdate) {
        const timelineWithTransport = await calculateTransportForTimeline(dayToUpdate.timeline)
        const finalItinerary = updatedItinerary.map(d =>
          d.day === dayNumber ? { ...d, timeline: timelineWithTransport } : d
        )
        onUpdatePlan({ ...plan, itinerary: finalItinerary })
      }

      clearRightPanel()
    } catch (error) {
      console.error('Error saving activity:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const suggestedDuration = estimateDuration(formData.icon)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSearch(dayNumber, timeSlot)}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Volver a búsqueda"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h3 className="font-semibold text-foreground">Nueva Actividad</h3>
            <p className="text-xs text-muted-foreground">
              Día {dayNumber}: {day?.title}
            </p>
          </div>
        </div>
        <button
          onClick={clearRightPanel}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Time */}
        <div className="space-y-2">
          <Label htmlFor="time">Hora de inicio</Label>
          <Input
            id="time"
            type="text"
            placeholder="9:00 AM"
            value={formData.time}
            onChange={(e) => handleChange("time", e.target.value)}
          />
        </div>

        {/* Activity Name */}
        <div className="space-y-2">
          <Label htmlFor="activity">Actividad *</Label>
          <Input
            id="activity"
            type="text"
            placeholder="Visitar el volcán"
            value={formData.activity}
            onChange={(e) => handleChange("activity", e.target.value)}
            required
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            type="text"
            placeholder="Parque Nacional Volcán Arenal"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>

        {/* Icon Picker */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_ICONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleIconChange(emoji)}
                className={`p-1.5 rounded-lg border transition-all ${
                  formData.icon === emoji
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground"
                }`}
                title={label}
              >
                <span className="text-base">{emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Duración</Label>
            {suggestedDuration > 0 && formData.durationMinutes === undefined && (
              <span className="text-xs text-muted-foreground">
                Sugerido: {formatDuration(suggestedDuration)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange("durationMinutes", value)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  formData.durationMinutes === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleChange("durationMinutes", undefined)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                formData.durationMinutes === undefined
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        {/* Fixed Time Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="isFixedTime"
            checked={formData.isFixedTime}
            onCheckedChange={(checked) => handleChange("isFixedTime", checked === true)}
          />
          <Label htmlFor="isFixedTime" className="text-sm font-normal cursor-pointer">
            Hora fija (no ajustar al reordenar)
          </Label>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <textarea
            id="notes"
            className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Notas adicionales..."
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={!formData.activity.trim() || isSaving}
        >
          {isSaving ? "Guardando..." : "Añadir Actividad"}
        </Button>
      </div>
    </div>
  )
}
