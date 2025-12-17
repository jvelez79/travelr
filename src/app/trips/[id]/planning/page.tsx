"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QuickQuestions } from "@/components/planning/QuickQuestions"
import { CanvasLayout } from "@/components/canvas"
import { generateContextualQuestions } from "@/lib/ai/agent"
import { getCachedPlan, cachePlan } from "@/lib/ai/cache"
import { calculateTransportForTimeline } from "@/lib/transportUtils"
import { createEmptyPlan } from "@/lib/plan/empty-plan"
import {
  useDayGeneration,
  loadGenerationState,
  type DayGenerationStatus,
} from "@/hooks/useDayGeneration"
import { useTrip } from "@/hooks/useTrips"
import { usePlan, useSavePlan } from "@/hooks/usePlan"
import { useAuth } from "@/contexts/AuthContext"
import type {
  GeneratedPlan,
  QuickQuestionsResponse,
  ContextualQuestion,
  ItineraryDay,
} from "@/types/plan"
import type { Trip as DbTrip } from "@/types/database"

type PlanningMode = "guided" | "manual"

// Helper to convert DB trip to UI format
interface TripUI {
  id: string
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
  mode?: string | null
}

function dbTripToUI(trip: DbTrip): TripUI {
  return {
    id: trip.id,
    destination: trip.destination,
    origin: trip.origin,
    startDate: trip.start_date,
    endDate: trip.end_date,
    travelers: trip.travelers ?? 1,
    mode: trip.mode,
  }
}

type PlanningStep = "loading" | "questions" | "generating-summary" | "viewing"

// Helper to calculate transport for a single day and update plan
async function calculateAndUpdateDayTransport(
  currentPlan: GeneratedPlan,
  dayNumber: number
): Promise<GeneratedPlan> {
  const day = currentPlan.itinerary.find(d => d.day === dayNumber)
  if (!day || day.timeline.length < 2) return currentPlan

  const timelineWithTransport = await calculateTransportForTimeline(day.timeline)

  return {
    ...currentPlan,
    itinerary: currentPlan.itinerary.map(d =>
      d.day === dayNumber ? { ...d, timeline: timelineWithTransport } : d
    )
  }
}

// Helper to calculate transport for all days in a plan
async function calculateAllDaysTransport(
  currentPlan: GeneratedPlan
): Promise<GeneratedPlan> {
  let updatedPlan = { ...currentPlan }

  for (const day of currentPlan.itinerary) {
    if (day.timeline.length >= 2) {
      updatedPlan = await calculateAndUpdateDayTransport(updatedPlan, day.day)
    }
  }

  return updatedPlan
}

export default function PlanningPage() {
  const params = useParams()
  const tripId = params.id as string

  // Auth hook
  const { user } = useAuth()

  // Supabase hooks
  const { trip: dbTrip, loading: tripLoading, error: tripError } = useTrip(tripId)
  const { planData: savedPlanData, loading: planLoading } = usePlan(tripId)
  const { savePlan, loading: savingPlan } = useSavePlan()

  // Convert DB trip to UI format
  const trip = dbTrip ? dbTripToUI(dbTrip) : null

  const [step, setStep] = useState<PlanningStep>("loading")
  const [contextualQuestions, setContextualQuestions] = useState<ContextualQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<QuickQuestionsResponse | null>(null)
  // Local plan state for manual updates (drag & drop, edits)
  const [localPlan, setLocalPlan] = useState<GeneratedPlan | null>(null)
  // Track if initial load is done
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  // Track if transport has been calculated for loaded plan
  const [transportCalculated, setTransportCalculated] = useState(false)

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
    updatePlan,
  } = useDayGeneration({
    tripId,
    userId: user?.id,
    onDayComplete: async (dayNumber, day) => {
      console.log(`[planning] Day ${dayNumber} completed`)
      // Calculate transport for the completed day and save to Supabase
      if (plan && day.timeline.length >= 2) {
        try {
          const updatedPlan = await calculateAndUpdateDayTransport(plan, dayNumber)
          setLocalPlan(updatedPlan)
          await savePlan(tripId, updatedPlan as unknown as Record<string, unknown>)
        } catch (error) {
          console.error('[planning] Error calculating transport:', error)
          // Still save the plan without transport
          await savePlan(tripId, plan as unknown as Record<string, unknown>)
        }
      } else if (plan) {
        await savePlan(tripId, plan as unknown as Record<string, unknown>)
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
    // Wait for both trip and plan to load from Supabase
    if (tripLoading || planLoading || initialLoadDone) return

    // Mark initial load as done
    setInitialLoadDone(true)

    // Check for saved generation state first (for recovery)
    const savedGenerationState = loadGenerationState(tripId)

    // Check if we already have a plan from Supabase
    if (savedPlanData) {
      // Load saved plan into local state
      const loadedPlan = savedPlanData as unknown as GeneratedPlan
      setLocalPlan(loadedPlan)

      // Always hydrate from saved generation state if it exists
      // This ensures the hook's plan state is set for regenerateDay to work
      if (savedGenerationState) {
        console.log('[planning] Found saved generation state, hydrating...')
        console.log('[planning] Loaded plan has', loadedPlan.itinerary?.length || 0, 'days')
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
    } else if (trip) {
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

      // Check the planning mode from trip.mode (now in DB)
      const mode = trip.mode as PlanningMode | null

      if (mode === "manual") {
        // Create empty plan and save to Supabase
        const emptyPlan = createEmptyPlan({
          destination: trip.destination,
          origin: trip.origin,
          startDate: trip.startDate,
          endDate: trip.endDate,
          travelers: trip.travelers,
        })
        savePlan(tripId, emptyPlan as unknown as Record<string, unknown>)
        setLocalPlan(emptyPlan)
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
          loadContextualQuestions(trip)
        }
      }
    }
    // If trip is null after loading completes, set step to "viewing" to show "trip not found"
    // This prevents infinite loading spinner when trip doesn't exist
    if (!trip && !tripLoading && !planLoading) {
      setStep("viewing")
    }
  }, [tripId, tripLoading, planLoading, savedPlanData, trip, initialLoadDone, hydrateFromSavedState, savePlan])

  // Calculate transport for loaded plan (runs once after initial load)
  useEffect(() => {
    // Only run if:
    // - Plan is loaded and has activities
    // - Transport hasn't been calculated yet
    // - We're in viewing mode
    if (!localPlan || transportCalculated || step !== "viewing") return

    // Check if any day needs transport calculation
    const needsTransport = localPlan.itinerary.some(day => {
      // Day has activities but first activity doesn't have travelToNext (except last activity)
      if (day.timeline.length < 2) return false
      // Check if first activity has transport info
      const firstActivity = day.timeline[0]
      return !firstActivity.travelToNext
    })

    if (!needsTransport) {
      setTransportCalculated(true)
      return
    }

    // Calculate transport for all days
    const calculateTransport = async () => {
      console.log('[planning] Calculating transport for loaded plan...')
      try {
        const planWithTransport = await calculateAllDaysTransport(localPlan)
        setLocalPlan(planWithTransport)
        setTransportCalculated(true)
        // Save updated plan with transport info
        await savePlan(tripId, planWithTransport as unknown as Record<string, unknown>)
        console.log('[planning] Transport calculation complete')
      } catch (error) {
        console.error('[planning] Error calculating transport for loaded plan:', error)
        setTransportCalculated(true) // Mark as done to avoid infinite retries
      }
    }

    calculateTransport()
  }, [localPlan, transportCalculated, step, tripId, savePlan])

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

  const loadContextualQuestions = async (tripData: TripUI) => {
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
      savePlan(tripId, cachedPlan as unknown as Record<string, unknown>)
      setLocalPlan(cachedPlan)
      setStep("viewing")
      return
    }

    // Start generating summary - plan updates via Realtime subscription
    setStep("generating-summary")
    setError(null)

    const success = await generateSummary(
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

    if (success) {
      // Go to viewing immediately - plan will update via Supabase Realtime
      // No need to save plan here - the Edge Function handles DB updates
      setStep("viewing")
    } else {
      // Error occurred - stay on questions to allow retry
      setStep("questions")
    }
  }

  const handleUpdatePlan = (updatedPlan: GeneratedPlan) => {
    // Update React state for immediate re-render
    setLocalPlan(updatedPlan)
    // Also update the hook's internal plan state to keep them in sync
    updatePlan(updatedPlan)
    // Persist to Supabase
    savePlan(tripId, updatedPlan as unknown as Record<string, unknown>)
  }

  const handleStartOver = async () => {
    // Delete plan from Supabase will cascade from trip deletion
    // For now, just reset local state and show questions again
    setLocalPlan(null)
    setStep("questions")
  }

  // Get the plan to display - prefer hook's plan (for streaming), fall back to local state
  const displayPlan = plan || localPlan

  // Loading state
  if (step === "loading" || tripLoading || planLoading) {
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

        {/* Loading state while canvas prepares */}
        {step === "viewing" && !displayPlan && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="absolute inset-0 -m-2">
                <svg className="w-24 h-24 animate-spin" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="70 200" className="text-primary" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Cargando tu itinerario...</h2>
              <p className="text-muted-foreground">Preparando el canvas de planificación</p>
            </div>

            {/* Skeleton preview of canvas layout */}
            <div className="w-full max-w-4xl mt-8">
              <div className="flex gap-4">
                {/* Left sidebar skeleton */}
                <div className="hidden md:block w-48 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>

                {/* Center panel skeleton */}
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <Skeleton className="h-6 w-1/3" />
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right panel skeleton */}
                <div className="hidden lg:block w-64 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
