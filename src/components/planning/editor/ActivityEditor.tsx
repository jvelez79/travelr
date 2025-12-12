"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { TimelineEntry } from "@/types/plan"
import { estimateDuration, formatDuration, isTypicallyFixedTime } from "@/lib/timeUtils"

interface ActivityEditorProps {
  activity: TimelineEntry | null
  isOpen: boolean
  onClose: () => void
  onSave: (activity: TimelineEntry) => void
  mode: "edit" | "create"
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

export function ActivityEditor({ activity, isOpen, onClose, onSave, mode }: ActivityEditorProps) {
  const [formData, setFormData] = useState<Partial<TimelineEntry> & { durationMinutes?: number }>({
    time: "",
    activity: "",
    location: "",
    icon: "🎯",
    notes: "",
    durationMinutes: undefined,
    isFixedTime: false,
    // Google Places data (preserved during edits)
    placeId: undefined,
    placeData: undefined,
    matchConfidence: undefined,
    travelToNext: undefined,
  })

  useEffect(() => {
    if (activity && mode === "edit") {
      setFormData({
        id: activity.id,
        time: activity.time || "",
        activity: activity.activity || "",
        location: activity.location || "",
        icon: activity.icon || "🎯",
        notes: activity.notes || "",
        durationMinutes: activity.durationMinutes,
        isFixedTime: activity.isFixedTime || false,
        // Preserve Google Places data
        placeId: activity.placeId,
        placeData: activity.placeData,
        matchConfidence: activity.matchConfidence,
        travelToNext: activity.travelToNext,
      })
    } else if (mode === "create") {
      setFormData({
        time: "",
        activity: "",
        location: "",
        icon: "🎯",
        notes: "",
        durationMinutes: undefined,
        isFixedTime: false,
        placeId: undefined,
        placeData: undefined,
        matchConfidence: undefined,
        travelToNext: undefined,
      })
    }
  }, [activity, mode, isOpen])

  if (!isOpen) return null

  // Check if this is a linked Google Place (from Explore)
  const isLinkedPlace = !!(formData.placeId || formData.placeData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const savedActivity: TimelineEntry = {
      id: formData.id || `activity-${Date.now()}`,
      time: formData.time || "",
      activity: formData.activity || "",
      location: formData.location || "",
      icon: formData.icon,
      notes: formData.notes,
      durationMinutes: formData.durationMinutes,
      isFixedTime: formData.isFixedTime,
      // Preserve Google Places data
      placeId: formData.placeId,
      placeData: formData.placeData,
      matchConfidence: formData.matchConfidence,
      travelToNext: formData.travelToNext,
    }

    onSave(savedActivity)
    onClose()
  }

  const handleChange = (field: keyof TimelineEntry, value: string | number | boolean | undefined) => {
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

  const suggestedDuration = estimateDuration(formData.icon)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Editar Actividad" : "Nueva Actividad"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Linked Place Indicator */}
          {isLinkedPlace && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                  Lugar vinculado a Google Places
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-500">
                  El nombre y ubicación no son editables para mantener la vinculación
                </p>
              </div>
            </div>
          )}

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
              disabled={isLinkedPlace}
              className={isLinkedPlace ? "bg-muted/50 cursor-not-allowed" : ""}
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
              disabled={isLinkedPlace}
              className={isLinkedPlace ? "bg-muted/50 cursor-not-allowed" : ""}
            />
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_ICONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleIconChange(emoji)}
                  className={`p-2 rounded-lg border transition-all ${
                    formData.icon === emoji
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  title={label}
                >
                  <span className="text-lg">{emoji}</span>
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
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange("durationMinutes", value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
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
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                  formData.durationMinutes === undefined
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                Auto
              </button>
            </div>
            {formData.durationMinutes !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                La siguiente actividad empezará aproximadamente {formatDuration(formData.durationMinutes)} después
              </p>
            )}
          </div>

          {/* Fixed Time Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isFixedTime"
              checked={formData.isFixedTime || false}
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
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Notas adicionales..."
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!formData.activity?.trim()}
            >
              {mode === "edit" ? "Guardar Cambios" : "Añadir Actividad"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
