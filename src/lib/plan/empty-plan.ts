import type { GeneratedPlan, ItineraryDay } from "@/types/plan"

interface TripData {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

/**
 * Calculates the number of days between two dates
 */
function getDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1) // Include both start and end days, minimum 1 day
}

/**
 * Formats a date for display, avoiding timezone issues
 */
function formatDate(dateString: string, dayOffset: number = 0): string {
  if (!dateString) return ""

  // Parse the date string as local date (YYYY-MM-DD)
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day + dayOffset)

  // Format back to YYYY-MM-DD
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

/**
 * Creates an empty itinerary day structure
 */
function createEmptyDay(dayNumber: number, date: string): ItineraryDay {
  return {
    day: dayNumber,
    date,
    title: dayNumber === 1 ? "Día de llegada" : `Día ${dayNumber}`,
    subtitle: "Añade actividades para este día",
    timeline: [],
    activities: [],
    meals: {},
    summary: {
      duration: "Por definir",
      mainActivities: [],
    },
    importantNotes: [],
    transport: "",
    overnight: "",
  }
}

/**
 * Creates an empty plan structure for manual planning mode
 */
export function createEmptyPlan(trip: TripData): GeneratedPlan {
  const totalDays = trip.startDate && trip.endDate
    ? getDaysBetween(trip.startDate, trip.endDate)
    : 1

  const totalNights = Math.max(0, totalDays - 1)

  // Create empty days
  const itinerary: ItineraryDay[] = []
  for (let i = 0; i < totalDays; i++) {
    const date = trip.startDate ? formatDate(trip.startDate, i) : ""
    itinerary.push(createEmptyDay(i + 1, date))
  }

  // Mark last day as departure
  if (itinerary.length > 0) {
    const lastDay = itinerary[itinerary.length - 1]
    lastDay.title = "Día de regreso"
    lastDay.subtitle = "Añade actividades para tu último día"
  }

  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    version: 1,

    trip: {
      destination: trip.destination,
      origin: trip.origin,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
    },

    preferences: {
      accommodationType: "mixed",
      style: "comfort",
      pace: "moderate",
      priority: "mix",
    },

    summary: {
      title: `Viaje a ${trip.destination}`,
      description: "Plan creado manualmente. Añade actividades, hospedaje y más detalles.",
      highlights: [],
      totalDays,
      totalNights,
    },

    itinerary,

    // Unified accommodations array (empty for manual planning)
    accommodations: [],

    budget: {
      flights: 0,
      accommodation: 0,
      activities: 0,
      food: 0,
      transport: 0,
      other: 0,
      total: 0,
      perPerson: 0,
      currency: "USD",
    },

    documents: [
      {
        id: crypto.randomUUID(),
        text: "Pasaporte vigente",
        checked: false,
        category: "passport",
        isRequired: true,
      },
      {
        id: crypto.randomUUID(),
        text: "Seguro de viaje",
        checked: false,
        category: "insurance",
        isRequired: false,
        notes: "Recomendado para viajes internacionales",
      },
    ],

    packing: [],

    tips: [
      "Este es un plan manual. Añade actividades día a día según tus preferencias.",
      "Puedes agregar hospedaje, presupuesto y listas de equipaje en cualquier momento.",
    ],

    aiGenerated: {
      provider: "manual",
      generatedAt: now,
      regenerations: 0,
    },
  }
}
