"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { QuickQuestions } from "@/components/planning/QuickQuestions"
import { CanvasLayout } from "@/components/canvas"
import { generateContextualQuestions } from "@/lib/ai/agent"
import { getCachedPlan, cachePlan } from "@/lib/ai/cache"
import { createEmptyPlan } from "@/lib/plan/empty-plan"
import {
  useDayGeneration,
  loadGenerationState,
  type DayGenerationStatus,
} from "@/hooks/useDayGeneration"
import type {
  GeneratedPlan,
  QuickQuestionsResponse,
  ContextualQuestion,
  ItineraryDay,
} from "@/types/plan"

type PlanningMode = "guided" | "manual"

interface Trip {
  id: string
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

type PlanningStep = "loading" | "questions" | "generating-summary" | "viewing"

export default function PlanningPage() {
  const params = useParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [step, setStep] = useState<PlanningStep>("loading")
  const [contextualQuestions, setContextualQuestions] = useState<ContextualQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<QuickQuestionsResponse | null>(null)
  // Local plan state for manual updates (drag & drop, edits)
  const [localPlan, setLocalPlan] = useState<GeneratedPlan | null>(null)

  // Day generation hook
  const {
    plan,
    dayStates,
    isGeneratingSummary,
    summaryError,
    isHydrated,
    generateSummary,
    startDayGeneration,
    getDayStatus,
    getDayTimeline,
    isAnyDayGenerating,
    allDaysComplete,
    regenerateDay,
    canRegenerate,
    hydrateFromSavedState,
  } = useDayGeneration({
    tripId,
    onDayComplete: (dayNumber, day) => {
      console.log(`[planning] Day ${dayNumber} completed`)
      // Save progress to localStorage
      if (plan) {
        localStorage.setItem(`plan-${tripId}`, JSON.stringify(plan))
      }
    },
    onAllComplete: (completedPlan) => {
      console.log('[planning] All days complete')
      // Cache the completed plan
      if (preferences && trip) {
        const interests = preferences.contextualAnswers
          ? Object.values(preferences.contextualAnswers)
          : []
        cachePlan(
          completedPlan,
          trip.destination,
          trip.startDate,
          trip.endDate,
          preferences.style,
          interests
        )
      }
    },
    onError: (errorMsg) => {
      console.error('[planning] Error:', errorMsg)
      setError(errorMsg)
    },
  })

  // Load trip data and check for saved generation state
  useEffect(() => {
    const trips = JSON.parse(localStorage.getItem("trips") || "[]")
    const found = trips.find((t: Trip) => t.id === tripId)
    setTrip(found || null)

    // Check for saved generation state first (for recovery)
    const savedGenerationState = loadGenerationState(tripId)

    // Check if we already have a plan
    const savedPlanData = localStorage.getItem(`plan-${tripId}`)

    if (savedPlanData) {
      // Load saved plan into local state
      const loadedPlan = JSON.parse(savedPlanData) as GeneratedPlan
      setLocalPlan(loadedPlan)

      // Always hydrate from saved generation state if it exists
      // This ensures the hook's plan state is set for regenerateDay to work
      if (savedGenerationState) {
        console.log('[planning] Found saved generation state, hydrating...')
        console.log('[planning] Loaded plan has', loadedPlan.itinerary.length, 'days')
        console.log('[planning] Generation status:', savedGenerationState.status)

        // Restore preferences if saved
        if (savedGenerationState.preferences) {
          setPreferences(savedGenerationState.preferences)
        }

        // Hydrate the hook with saved state AND the existing plan
        // This sets the hook's plan state which is needed for regenerateDay
        const shouldContinue = hydrateFromSavedState(savedGenerationState, loadedPlan)
        console.log('[planning] Hydration complete, shouldContinue:', shouldContinue)
      } else {
        console.log('[planning] No generation state found, plan is fully manual')
      }

      setStep("viewing")
    } else if (found) {
      // No plan exists yet - check if we have partial generation state (e.g., summary generated but lost plan)
      if (savedGenerationState?.summaryResult && savedGenerationState.status === 'ready_to_generate') {
        console.log('[planning] Found summary but no plan, recovering...')

        // Restore preferences
        if (savedGenerationState.preferences) {
          setPreferences(savedGenerationState.preferences)
        }

        // Hydrate and continue
        hydrateFromSavedState(savedGenerationState)
        setStep("viewing")
        return
      }

      // Check the planning mode
      const mode = localStorage.getItem(`trip-mode-${tripId}`) as PlanningMode | null

      if (mode === "manual") {
        // Create empty plan and go directly to viewing
        const emptyPlan = createEmptyPlan({
          destination: found.destination,
          origin: found.origin,
          startDate: found.startDate,
          endDate: found.endDate,
          travelers: found.travelers,
        })
        localStorage.setItem(`plan-${tripId}`, JSON.stringify(emptyPlan))
        setStep("viewing")
      } else {
        // Guided mode: Check if user already answered questions (preferences saved)
        if (savedGenerationState?.preferences) {
          console.log('[planning] Found saved preferences, skipping questions')
          setPreferences(savedGenerationState.preferences)
          // Start generation with saved preferences
          setStep("generating-summary")
        } else {
          // Load contextual questions with full trip context
          loadContextualQuestions(found)
        }
      }
    }
  }, [tripId, hydrateFromSavedState])

  // Start day generation when we have a plan with empty days
  useEffect(() => {
    if (plan && step === "viewing") {
      // Find first day that needs generation
      const pendingDay = plan.itinerary.find(day => {
        const status = getDayStatus(day.day)
        return status === 'pending' && day.timeline.length === 0
      })

      if (pendingDay && !isAnyDayGenerating) {
        // Start generating the next pending day
        startDayGeneration(pendingDay.day)
      }
    }
  }, [plan, step, dayStates, getDayStatus, isAnyDayGenerating, startDayGeneration])

  const loadContextualQuestions = async (tripData: Trip) => {
    try {
      const questions = await generateContextualQuestions(tripData)
      setContextualQuestions(questions)
    } catch (e) {
      console.error("Failed to load contextual questions:", e)
    }
    setStep("questions")
  }

  const handleQuestionsComplete = async (responses: QuickQuestionsResponse) => {
    if (!trip) return

    // PERSIST: Save preferences IMMEDIATELY (proactive persistence)
    setPreferences(responses)

    const interests = responses.contextualAnswers
      ? Object.values(responses.contextualAnswers)
      : []

    // Check cache first
    const cachedPlan = getCachedPlan(
      trip.destination,
      trip.startDate,
      trip.endDate,
      responses.style,
      interests
    )

    if (cachedPlan) {
      console.log('[planning] Using cached plan')
      localStorage.setItem(`plan-${tripId}`, JSON.stringify(cachedPlan))
      setStep("viewing")
      return
    }

    // Start generating summary (fast ~10s)
    setStep("generating-summary")
    setError(null)

    const partialPlan = await generateSummary(
      {
        destination: trip.destination,
        origin: trip.origin,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers,
      },
      {
        accommodationType: responses.accommodationType,
        style: responses.style,
        pace: responses.pace,
        priority: responses.priority,
        interests,
      },
      responses  // Pass full preferences for persistence
    )

    if (partialPlan) {
      // Save partial plan
      localStorage.setItem(`plan-${tripId}`, JSON.stringify(partialPlan))
      // Go to viewing immediately - days will generate in background
      setStep("viewing")
    } else {
      // Error occurred
      setStep("questions")
    }
  }

  const handleUpdatePlan = (updatedPlan: GeneratedPlan) => {
    // Update React state for immediate re-render
    setLocalPlan(updatedPlan)
    // Persist to localStorage
    localStorage.setItem(`plan-${tripId}`, JSON.stringify(updatedPlan))
  }

  const handleStartOver = () => {
    localStorage.removeItem(`plan-${tripId}`)
    setLocalPlan(null)
    setStep("questions")
  }

  // Get the plan to display - prefer hook's plan (for streaming), fall back to local state
  const displayPlan = plan || localPlan

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Trip not found
  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Viaje no encontrado</h1>
          <p className="text-muted-foreground">El viaje que buscas no existe o fue eliminado.</p>
        </div>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Volver al inicio
          </Button>
        </Link>
      </div>
    )
  }

  // Canvas Layout for viewing step (full screen)
  if (step === "viewing" && displayPlan) {
    return (
      <CanvasLayout
        trip={trip}
        plan={displayPlan}
        onUpdatePlan={handleUpdatePlan}
        onStartOver={handleStartOver}
        dayGenerationStates={dayStates}
        getDayStatus={getDayStatus}
        getDayTimeline={getDayTimeline}
        onRegenerateDay={canRegenerate ? regenerateDay : undefined}
      />
    )
  }

  // Other steps (loading, questions, generating) use centered layout
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Inicio
          </Link>

          <div className="text-center">
            <h1 className="font-semibold text-foreground">{trip.destination}</h1>
            <p className="text-xs text-muted-foreground">
              {trip.startDate && trip.endDate
                ? `${new Date(trip.startDate).toLocaleDateString("es", { day: "numeric", month: "short" })} - ${new Date(trip.endDate).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}`
                : "Fechas por definir"}
            </p>
          </div>

          <div className="w-28" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Error message */}
        {(error || summaryError) && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center">
            <p className="text-sm">{error || summaryError}</p>
          </div>
        )}

        {/* Questions Step */}
        {step === "questions" && (
          <QuickQuestions
            destination={trip.destination}
            contextualQuestions={contextualQuestions}
            onComplete={handleQuestionsComplete}
            isLoading={isGeneratingSummary}
          />
        )}

        {/* Generating Summary Step */}
        {step === "generating-summary" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              {/* Loading ring */}
              <div className="absolute inset-0 -m-2">
                <svg className="w-24 h-24 animate-spin" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="70 200" className="text-primary" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-3">Preparando tu viaje...</h2>
            <p className="text-muted-foreground text-center max-w-md leading-relaxed">
              Generando el plan para <span className="font-medium text-foreground">{trip.destination}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Solo unos segundos más...
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
