"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlanningModeSelector, type PlanningMode } from "@/components/planning/PlanningModeSelector"
import { PlaceAutocomplete } from "@/components/shared/PlaceAutocomplete"
import { useCreateTrip, useUpdateTrip, useDeleteTrip } from "@/hooks/useTrips"

interface TripFormData {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

type Step = "form" | "mode-selection"

export default function NewTripPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("form")
  const [formData, setFormData] = useState<TripFormData>({
    destination: "",
    origin: "",
    startDate: "",
    endDate: "",
    travelers: 1,
  })
  const [tripId, setTripId] = useState<string | null>(null)

  // Supabase hooks
  const { createTrip, loading: isCreating } = useCreateTrip()
  const { updateTrip, loading: isUpdating } = useUpdateTrip()
  const { deleteTrip, loading: isDeleting } = useDeleteTrip()

  const isLoading = isCreating || isUpdating

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 1 : value,
    }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Create trip in Supabase
    const trip = await createTrip({
      destination: formData.destination,
      origin: formData.origin,
      start_date: formData.startDate,
      end_date: formData.endDate,
      travelers: formData.travelers,
      status: "planning",
      current_phase: 1,
    })

    if (trip) {
      setTripId(trip.id)
      setStep("mode-selection")
    }
  }

  const handleModeSelect = async (mode: PlanningMode) => {
    if (!tripId) return

    // Update trip with selected mode
    const updated = await updateTrip(tripId, { mode })

    if (updated) {
      // Redirect to planning flow
      router.push(`/trips/${tripId}/planning`)
    }
  }

  const handleBackToForm = async () => {
    // Remove the trip we just created
    if (tripId) {
      await deleteTrip(tripId)
    }
    setTripId(null)
    setStep("form")
  }

  const isValid = formData.destination.trim() && formData.origin.trim()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          {step === "form" ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </Link>
          ) : (
            <button
              onClick={handleBackToForm}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Modificar detalles
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-16">
        {step === "form" && (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
                Nuevo Viaje
              </h1>
              <p className="text-muted-foreground text-lg">
                Comienza a planificar tu próxima aventura
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-8">
              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-base font-medium">
                  ¿A dónde quieres viajar?
                </Label>
                <PlaceAutocomplete
                  id="destination"
                  placeholder="Ej: Tokio, Japón"
                  value={formData.destination}
                  onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                  required
                />
              </div>

              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-base font-medium">
                  ¿Desde dónde viajas?
                </Label>
                <PlaceAutocomplete
                  id="origin"
                  placeholder="Ej: Ciudad de México"
                  value={formData.origin}
                  onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-base font-medium">
                    Fecha de salida
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="h-12 text-base bg-card border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-base font-medium">
                    Fecha de regreso
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    className="h-12 text-base bg-card border-border focus:border-primary"
                  />
                </div>
              </div>

              {/* Travelers */}
              <div className="space-y-2">
                <Label htmlFor="travelers" className="text-base font-medium">
                  ¿Cuántos viajeros?
                </Label>
                <Input
                  id="travelers"
                  name="travelers"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.travelers}
                  onChange={handleChange}
                  className="h-12 text-base bg-card border-border focus:border-primary w-32"
                />
                <p className="text-sm text-muted-foreground">
                  Incluye a todos los viajeros para calcular el presupuesto correctamente
                </p>
              </div>

              {/* Divider */}
              <div className="pt-4">
                <div className="h-px bg-border" />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                disabled={!isValid || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando viaje...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continuar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                )}
              </Button>
            </form>

            {/* Info card */}
            <div className="mt-12 p-6 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">¿Qué sigue?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Podrás elegir entre crear un plan asistido con AI o planificar manualmente
                    con total control sobre cada detalle de tu viaje.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {step === "mode-selection" && (
          <div className="max-w-3xl mx-auto">
            <PlanningModeSelector
              destination={formData.destination}
              onSelectMode={handleModeSelect}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>
    </div>
  )
}
