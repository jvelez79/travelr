"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type {
  AccommodationType,
  TravelStyle,
  TravelPace,
  TravelPriority,
  ContextualQuestion,
  QuickQuestionsResponse,
} from "@/types/plan"

interface QuickQuestionsProps {
  destination: string
  contextualQuestions?: ContextualQuestion[]
  onComplete: (responses: QuickQuestionsResponse) => void
  isLoading?: boolean
}

interface OptionCardProps {
  icon: React.ReactNode
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

function OptionCard({ icon, label, description, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left p-5 rounded-xl border-2 transition-all duration-200
        ${selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
        `}>
          {icon}
        </div>
        <div>
          <div className={`font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
            {label}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
        </div>
      </div>
    </button>
  )
}

const accommodationOptions: Array<{
  value: AccommodationType
  icon: React.ReactNode
  label: string
  description: string
}> = [
  {
    value: "hotel",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    label: "Hotel",
    description: "Comodidad y servicio completo"
  },
  {
    value: "airbnb",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    label: "Airbnb",
    description: "Vive como un local"
  },
  {
    value: "hostel",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    label: "Hostel",
    description: "Social y económico"
  },
  {
    value: "mixed",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    label: "Mixto",
    description: "Combina según convenga"
  },
]

const styleOptions: Array<{
  value: TravelStyle
  icon: React.ReactNode
  label: string
  description: string
}> = [
  {
    value: "budget",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    label: "Económico",
    description: "Maximiza cada peso"
  },
  {
    value: "comfort",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
    label: "Comfort",
    description: "Balance calidad-precio"
  },
  {
    value: "luxury",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    label: "Premium",
    description: "Sin límites"
  },
]

const paceOptions: Array<{
  value: TravelPace
  icon: React.ReactNode
  label: string
  description: string
}> = [
  {
    value: "relaxed",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
    label: "Relajado",
    description: "Pocas actividades, mucho tiempo libre"
  },
  {
    value: "moderate",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    label: "Moderado",
    description: "Balance entre ver y descansar"
  },
  {
    value: "active",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    label: "Activo",
    description: "Aprovechar cada momento"
  },
]

const priorityOptions: Array<{
  value: TravelPriority
  icon: React.ReactNode
  label: string
  description: string
}> = [
  {
    value: "adventure",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    label: "Aventura",
    description: "Actividades y adrenalina"
  },
  {
    value: "relax",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    label: "Relax",
    description: "Descanso y tranquilidad"
  },
  {
    value: "culture",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
    label: "Cultura",
    description: "Historia y arte"
  },
  {
    value: "mix",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    label: "Un poco de todo",
    description: "Experiencias variadas"
  },
]

export function QuickQuestions({
  destination,
  contextualQuestions = [],
  onComplete,
  isLoading = false,
}: QuickQuestionsProps) {
  const [step, setStep] = useState(0)
  const [style, setStyle] = useState<TravelStyle | null>(null)
  const [accommodation, setAccommodation] = useState<AccommodationType | null>(null)
  const [pace, setPace] = useState<TravelPace | null>(null)
  const [priority, setPriority] = useState<TravelPriority | null>(null)
  const [contextualAnswers, setContextualAnswers] = useState<Record<string, string[]>>({})

  // 4 hardcoded questions + contextual questions
  const totalSteps = 4 + contextualQuestions.length

  const handleContextualAnswer = (questionId: string, value: string, allowMultiple: boolean) => {
    setContextualAnswers((prev) => {
      if (allowMultiple) {
        const current = prev[questionId] || []
        if (current.includes(value)) {
          return { ...prev, [questionId]: current.filter((v) => v !== value) }
        }
        return { ...prev, [questionId]: [...current, value] }
      }
      return { ...prev, [questionId]: [value] }
    })
  }

  const canProceed = () => {
    if (step === 0) return style !== null        // Presupuesto
    if (step === 1) return accommodation !== null // Hospedaje
    if (step === 2) return pace !== null          // Ritmo
    if (step === 3) return priority !== null      // Prioridad
    const questionIndex = step - 4
    if (questionIndex < contextualQuestions.length) {
      const question = contextualQuestions[questionIndex]
      return (contextualAnswers[question.id]?.length || 0) > 0
    }
    return true
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      const flatContextual: Record<string, string> = {}
      for (const [key, values] of Object.entries(contextualAnswers)) {
        flatContextual[key] = values.join(", ")
      }

      onComplete({
        style: style!,
        accommodationType: accommodation!,
        pace: pace!,
        priority: priority!,
        contextualAnswers: flatContextual,
      })
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const stepTitles = [
    "¿Cuál es tu presupuesto?",
    "¿Dónde prefieres hospedarte?",
    "¿Qué ritmo de viaje prefieres?",
    "¿Qué es lo más importante para ti?",
  ]

  const renderStep = () => {
    // Step 0: Presupuesto
    if (step === 0) {
      return (
        <div className="grid sm:grid-cols-3 gap-3">
          {styleOptions.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              selected={style === opt.value}
              onClick={() => setStyle(opt.value)}
            />
          ))}
        </div>
      )
    }

    // Step 1: Hospedaje
    if (step === 1) {
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          {accommodationOptions.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              selected={accommodation === opt.value}
              onClick={() => setAccommodation(opt.value)}
            />
          ))}
        </div>
      )
    }

    // Step 2: Ritmo
    if (step === 2) {
      return (
        <div className="grid sm:grid-cols-3 gap-3">
          {paceOptions.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              selected={pace === opt.value}
              onClick={() => setPace(opt.value)}
            />
          ))}
        </div>
      )
    }

    // Step 3: Prioridad
    if (step === 3) {
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          {priorityOptions.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              selected={priority === opt.value}
              onClick={() => setPriority(opt.value)}
            />
          ))}
        </div>
      )
    }

    // Step 4+: Contextual questions
    const questionIndex = step - 4
    const question = contextualQuestions[questionIndex]

    if (question) {
      const selectedValues = contextualAnswers[question.id] || []

      return (
        <div className="space-y-4">
          {question.allowMultiple && (
            <p className="text-sm text-muted-foreground text-center">
              Puedes seleccionar varias opciones
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleContextualAnswer(question.id, opt.value, question.allowMultiple)}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all
                  ${selectedValues.includes(opt.value)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                  }
                `}
              >
                <div className={`font-medium ${selectedValues.includes(opt.value) ? "text-primary" : ""}`}>
                  {opt.label}
                </div>
                {opt.description && (
                  <div className="text-sm text-muted-foreground mt-0.5">{opt.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  const currentTitle = step < 4 ? stepTitles[step] : contextualQuestions[step - 4]?.question

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground">
            Paso {step + 1} de {totalSteps}
          </span>
          <span className="font-medium text-primary">{destination}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {currentTitle}
        </h2>
      </div>

      {/* Options */}
      <div className="min-h-[320px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
          className="h-11"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
          className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {step === totalSteps - 1 ? (
            isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generando plan...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Generar mi plan
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </span>
            )
          ) : (
            <span className="flex items-center gap-2">
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
