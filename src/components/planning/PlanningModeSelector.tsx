"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export type PlanningMode = "guided" | "manual"

interface PlanningModeSelectorProps {
  destination: string
  onSelectMode: (mode: PlanningMode) => void
  isLoading?: boolean
}

export function PlanningModeSelector({
  destination,
  onSelectMode,
  isLoading = false,
}: PlanningModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<PlanningMode | null>(null)

  const handleSelect = (mode: PlanningMode) => {
    setSelectedMode(mode)
  }

  const handleContinue = () => {
    if (selectedMode) {
      onSelectMode(selectedMode)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
          ¿Cómo quieres planificar tu viaje?
        </h1>
        <p className="text-muted-foreground text-lg">
          Viaje a <span className="font-medium text-foreground">{destination}</span>
        </p>
      </div>

      {/* Options */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Guided Mode */}
        <button
          type="button"
          onClick={() => handleSelect("guided")}
          className={`group relative p-6 rounded-2xl border-2 text-left transition-all ${
            selectedMode === "guided"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          {/* Selected indicator */}
          {selectedMode === "guided" && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
            selectedMode === "guided" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold mb-2">Planificación Asistida</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Responde algunas preguntas sobre tus preferencias y generamos un plan personalizado completo para ti.
          </p>

          {/* Features */}
          <ul className="space-y-2">
            {[
              "Itinerario día a día generado por AI",
              "Sugerencias de hospedaje",
              "Presupuesto estimado",
              "Listas de documentos y equipaje",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <svg className={`w-4 h-4 flex-shrink-0 ${selectedMode === "guided" ? "text-primary" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Badge */}
          <div className="mt-4 pt-4 border-t border-border">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              selectedMode === "guided" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ideal para descubrir nuevos destinos
            </span>
          </div>
        </button>

        {/* Manual Mode */}
        <button
          type="button"
          onClick={() => handleSelect("manual")}
          className={`group relative p-6 rounded-2xl border-2 text-left transition-all ${
            selectedMode === "manual"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          {/* Selected indicator */}
          {selectedMode === "manual" && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
            selectedMode === "manual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold mb-2">Planificación Manual</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Crea tu itinerario desde cero con total control. Añade actividades, define presupuesto y organiza a tu manera.
          </p>

          {/* Features */}
          <ul className="space-y-2">
            {[
              "Control total del itinerario",
              "Añade tus propias actividades",
              "Define tu propio presupuesto",
              "Organiza cada día a tu gusto",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <svg className={`w-4 h-4 flex-shrink-0 ${selectedMode === "manual" ? "text-primary" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Badge */}
          <div className="mt-4 pt-4 border-t border-border">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              selectedMode === "manual" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Ideal para viajeros experimentados
            </span>
          </div>
        </button>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedMode || isLoading}
          className="min-w-[200px] h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando...
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
      </div>

      {/* Tip */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        No te preocupes, puedes editar cualquier plan después de crearlo.
      </p>
    </div>
  )
}
