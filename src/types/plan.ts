// Types for AI-generated travel plans

import type { PlaceCategory, AccessibilityOptions, ServingOptions } from './explore'
import type { AccommodationReservation } from './accommodation'

export type TravelStyle = 'budget' | 'comfort' | 'luxury'
export type TravelPace = 'relaxed' | 'moderate' | 'active'

// Flight reservation for Overview tab
export interface FlightReservation {
  id: string
  origin: string            // Airport code "SJU"
  originCity: string        // "San Juan"
  destination: string       // Airport code "PTY"
  destinationCity: string   // "Panama City"
  date: string              // ISO date
  departureTime: string     // "5:27 AM"
  arrivalTime: string       // "7:30 AM"
  airline: string           // "COPA AIRLINES CM 451"
  confirmationNumber?: string
  notes?: string
  pricePerPerson?: number
}

// Location for saved places
export interface SavedPlaceLocation {
  lat: number
  lng: number
  address?: string
  city?: string
  country?: string
}

// Source info for saved places (extensible for TripAdvisor, etc.)
export interface PlaceSourceInfo {
  source: 'google' | 'tripadvisor' | 'manual'
  sourceId?: string           // Google Place ID, TripAdvisor ID, etc.
  googleMapsUrl?: string      // Direct URL to open in Google Maps
  lastFetched?: string        // ISO timestamp of last fetch
}

// Saved place from Explore tab - extended with full data
export interface SavedPlace {
  id: string
  name: string

  // Category (typed)
  category?: PlaceCategory
  subcategory?: string        // "Italian", "Waterfall", etc.

  // Location (CRITICAL for directions)
  location?: SavedPlaceLocation

  // Ratings
  rating?: number             // 0-5 stars
  reviewCount?: number
  priceLevel?: 1 | 2 | 3 | 4  // $ to $$$$

  // Content
  description?: string
  images?: string[]           // URLs (max 5)

  // Contact
  phone?: string
  website?: string
  openingHours?: string[]

  // Extended Google Places data
  accessibility?: AccessibilityOptions
  servingOptions?: ServingOptions

  // Source metadata (extensible)
  sourceInfo?: PlaceSourceInfo

  // Trip management
  addedAt: string
  addedToItineraryDay?: number
  notes?: string              // User personal notes

  // Legacy field for backwards compatibility
  placeId?: string            // @deprecated Use sourceInfo.sourceId instead
}
export type AccommodationType = 'hotel' | 'airbnb' | 'hostel' | 'mixed'
export type TravelPriority = 'adventure' | 'relax' | 'culture' | 'mix'

// Note category for important notes (based on Costa Rica planning format)
export type NoteCategory =
  | 'time'       // ⏰ Horarios críticos
  | 'transport'  // 🚗 Transporte/manejo
  | 'weather'    // 🌧️ Clima
  | 'activity'   // 🌋 Actividades
  | 'food'       // 🍽️ Comidas
  | 'lodging'    // 🏠 Alojamiento
  | 'budget'     // 💰 Presupuesto
  | 'gear'       // 👟 Ropa/equipo
  | 'warning'    // ⚠️ Advertencias
  | 'tip'        // 💡 Tips

// User preferences collected from quick questions
export interface TravelPreferences {
  style: TravelStyle              // Budget preference (budget/comfort/luxury)
  accommodationType: AccommodationType
  pace: TravelPace                // Itinerary density (relaxed/moderate/active)
  priority: TravelPriority
  interests?: string[]            // Contextual interests based on destination
}

// Transport method between activities
export type TransportMethod = 'driving' | 'walking' | 'transit' | 'none'

// Transport info between activities
export interface TravelInfo {
  distance?: string       // "3.4 mi" or "5.5 km"
  duration?: string       // "11 min"
  method?: TransportMethod
}

// Match confidence for Google Places linking
export type MatchConfidence = 'exact' | 'high' | 'low' | 'none'

// Place data embedded in timeline/activity items (from Google Places)
export interface PlaceData {
  name: string
  category: PlaceCategory
  rating?: number
  reviewCount?: number
  priceLevel?: 1 | 2 | 3 | 4
  coordinates: { lat: number; lng: number }
  address?: string
  images?: string[]          // Max 5 URLs for carousel display
  googleMapsUrl?: string
  phone?: string
  website?: string
  openingHours?: string[]
  // Extended Google Places data
  accessibility?: AccessibilityOptions
  servingOptions?: ServingOptions
}

// Timeline entry (table row format like Costa Rica planning)
export interface TimelineEntry {
  id: string
  time: string           // "6:00 AM" - start time
  activity: string       // Brief activity name
  location: string       // Where it happens
  icon?: string          // Emoji for visual categorization
  notes?: string         // Optional additional details
  durationMinutes?: number // Duration in minutes (for time recalculation)
  isFixedTime?: boolean  // If true, don't adjust this activity's time when reordering
  travelToNext?: TravelInfo // Transport info to the NEXT activity

  // Google Places linking (populated by AI generation)
  placeId?: string           // Google Place ID
  placeData?: PlaceData      // Full place data for hover display
  matchConfidence?: MatchConfidence // How confident the AI-to-place match is
}

// Activity in the itinerary (expanded format)
export interface Activity {
  id: string
  time?: string          // "09:00"
  endTime?: string       // "11:00" for range display
  name: string
  description: string
  location?: string      // Where the activity takes place
  duration: string       // "2 horas"
  cost?: number
  isOptional: boolean
  type: 'attraction' | 'food' | 'transport' | 'activity' | 'free_time' | 'lodging'

  // Google Places linking (populated by AI generation)
  placeId?: string           // Google Place ID
  placeCategory?: PlaceCategory // Category from Google Places
  placeData?: PlaceData      // Full place data for hover display
  matchConfidence?: MatchConfidence // How confident the AI-to-place match is
}

// Important note with category (emoji-prefixed style)
export interface ImportantNote {
  id: string
  category: NoteCategory
  text: string
  isHighPriority?: boolean
}

// Day summary statistics (like "Resumen del Día")
export interface DaySummary {
  duration: string           // "15 horas (6:00 AM - 9:00 PM)"
  drivingTotal?: {
    distance: string         // "145 km"
    time: string             // "3.5 horas"
    routes?: Array<{
      from: string
      to: string
      distance: string
      time: string
    }>
  }
  mainActivities: string[]   // Top activities of the day
  estimatedBudget?: {
    min: number
    max: number
    perPerson: boolean
    includes?: string        // "con Baldi + almuerzo + cena"
  }
}

// Meal plan for the day
export interface MealPlan {
  breakfast?: {
    suggestion: string
    priceRange?: string      // "$8-12/pp"
    notes?: string
  }
  lunch?: {
    suggestion: string
    priceRange?: string
    notes?: string
  }
  dinner?: {
    suggestion: string
    priceRange?: string
    notes?: string
  }
}

// Single day in the itinerary (enhanced format)
export interface ItineraryDay {
  day: number
  date: string               // ISO date
  title: string              // "Llegada + San José"
  subtitle?: string          // "Traslado a La Fortuna - Volcán Arenal y Aguas Termales"

  // Timeline table (scannable format)
  timeline: TimelineEntry[]

  // Detailed activities (for expanded view) - OPTIONAL, legacy format
  activities?: Activity[]

  // Meals with details
  meals: MealPlan

  // Day summary statistics - OPTIONAL, can be calculated post-generation
  summary?: DaySummary

  // Important notes with categories
  importantNotes: ImportantNote[]

  // Legacy fields (for backwards compatibility)
  transport: string          // "Uber desde aeropuerto ~$25"
  overnight: string          // "Hotel en San José"
  notes?: string
}

// Accommodation suggestion
export interface AccommodationSuggestion {
  id: string
  name: string
  type: AccommodationType
  area: string               // "La Fortuna"
  location?: {               // Coordinates for map visualization
    lat: number
    lng: number
  }
  pricePerNight: number
  why: string                // "Cerca del volcán, ideal para día 2-3"
  nights: number             // How many nights to stay here
  checkIn: string            // ISO date
  checkOut: string           // ISO date
  checkInTime?: string       // "3:00 PM"
  checkOutTime?: string      // "11:00 AM"
  amenities?: string[]       // ["WiFi", "Parking", "Pool"]
  confirmationNote?: string  // Special instructions
}

// Budget breakdown
export interface BudgetBreakdown {
  flights: number
  accommodation: number
  activities: number
  food: number
  transport: number
  other: number
  total: number
  perPerson: number
  currency: string           // "USD"
  // Daily breakdown (new)
  daily?: Array<{
    day: number
    estimated: number
    breakdown?: {
      activities?: number
      food?: number
      transport?: number
      other?: number
    }
  }>
}

// Document checklist item
export interface DocumentItem {
  id: string
  text: string
  checked: boolean
  category: 'passport' | 'visa' | 'insurance' | 'health' | 'other'
  isRequired: boolean
  notes?: string
}

// Packing list item
export interface PackingItem {
  id: string
  text: string
  checked: boolean
  category: string           // "Ropa", "Electrónicos", etc.
  isEssential: boolean
  forDay?: number[]          // Which days this item is needed
}

// Status for background-generated sections
export type BackgroundSectionStatus = 'idle' | 'loading' | 'success' | 'error'

// The complete generated plan
export interface GeneratedPlan {
  id: string
  createdAt: string
  updatedAt: string
  version: number            // For tracking regenerations

  // Trip basics
  trip: {
    destination: string
    origin: string
    startDate: string
    endDate: string
    travelers: number
  }

  // User preferences
  preferences: TravelPreferences

  // Summary
  summary: {
    title: string            // "Costa Rica Adventure"
    description: string      // Brief overview of the trip
    highlights: string[]     // Top 3-5 highlights
    totalDays: number
    totalNights: number
    // New summary stats
    totalDriving?: {
      distance: string       // "~500 km"
      time: string           // "~12 horas total"
    }
  }

  // Main sections (generated initially)
  itinerary: ItineraryDay[]
  accommodation: {
    type: AccommodationType
    suggestions: AccommodationSuggestion[]
    totalCost: number
  }

  // Budget - calculated systematically (not AI generated)
  budget?: BudgetBreakdown

  // Background-generated sections (with loading status)
  documents?: DocumentItem[]
  documentsStatus?: BackgroundSectionStatus
  documentsError?: string

  packing?: PackingItem[]
  packingStatus?: BackgroundSectionStatus
  packingError?: string

  tips?: string[]
  tipsStatus?: BackgroundSectionStatus
  tipsError?: string

  warnings?: string[]
  warningsStatus?: BackgroundSectionStatus
  warningsError?: string

  // Overview tab data
  flights?: FlightReservation[]
  savedPlaces?: SavedPlace[]

  // Confirmed accommodation reservations (separate from AI suggestions)
  accommodationReservations?: AccommodationReservation[]

  // AI metadata
  aiGenerated: {
    provider: string
    generatedAt: string
    regenerations: number
  }
}

// Partial plan for regeneration
export interface PartialPlanUpdate {
  section: 'itinerary' | 'accommodation' | 'budget' | 'documents' | 'packing'
  dayNumber?: number         // If updating a specific day
  data: Partial<GeneratedPlan>
}

// Quick questions response
export interface QuickQuestionsResponse {
  style: TravelStyle              // Budget preference (budget/comfort/luxury)
  accommodationType: AccommodationType
  pace: TravelPace                // Itinerary density (relaxed/moderate/active)
  priority: TravelPriority
  contextualAnswers?: Record<string, string> // Dynamic answers to contextual questions
}

// Contextual question generated by AI
export interface ContextualQuestion {
  id: string
  question: string
  options: Array<{
    value: string
    label: string
    description?: string
  }>
  allowMultiple: boolean
}

// ============================================================
// Generation Session State (for persisting generation progress)
// ============================================================

export type GenerationStatus =
  | 'idle'                    // Not started
  | 'generating_summary'      // Generating plan summary
  | 'ready_to_generate'       // Summary done, ready to generate days
  | 'generating'              // Generating days
  | 'paused'                  // User navigated away
  | 'completed'               // All days generated
  | 'error'                   // Fatal error

// Retry information for failed days
export interface DayRetryInfo {
  dayNumber: number
  attempts: number
  lastError?: string
  lastAttemptAt: string
}

// Summary result stored in generation state (matches PlanSummaryResult in agent.ts)
export interface StoredSummaryResult {
  summary: {
    title: string
    description: string
    highlights: string[]
    totalDays: number
    totalNights: number
    totalDriving?: {
      distance: string
      time: string
    }
  }
  dayTitles: string[]
  accommodation: {
    type: string
    suggestions: AccommodationSuggestion[]
    totalCost: number
  }
  trip: {
    destination: string
    origin: string
    startDate: string
    endDate: string
    travelers: number
  }
  preferences: TravelPreferences
}

// Complete generation session state - persisted to localStorage
export interface GenerationSessionState {
  tripId: string
  status: GenerationStatus
  currentDay: number | null
  completedDays: number[]
  pendingDays: number[]
  failedDays: DayRetryInfo[]

  // Critical data that must persist
  summaryResult: StoredSummaryResult | null
  placesContext: Record<string, unknown> | null
  fullPlaces: Record<string, unknown> | null
  preferences: QuickQuestionsResponse | null

  // Timestamps
  startedAt: string
  updatedAt: string
}

// Helper: Create initial generation state
export function createInitialGenerationState(tripId: string): GenerationSessionState {
  return {
    tripId,
    status: 'idle',
    currentDay: null,
    completedDays: [],
    pendingDays: [],
    failedDays: [],
    summaryResult: null,
    placesContext: null,
    fullPlaces: null,
    preferences: null,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Helper: Get emoji for note category
export function getNoteEmoji(category: NoteCategory): string {
  const emojis: Record<NoteCategory, string> = {
    time: '⏰',
    transport: '🚗',
    weather: '🌧️',
    activity: '🌋',
    food: '🍽️',
    lodging: '🏠',
    budget: '💰',
    gear: '👟',
    warning: '⚠️',
    tip: '💡',
  }
  return emojis[category]
}
