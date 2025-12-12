// Tipos para datos de cada fase del viaje
// Basado en docs/05-modelo-datos.md

// ============================================
// Fase 1: Investigación
// ============================================
export interface InvestigationData {
  climate?: {
    summary: string
    averageTemp?: { min: number; max: number }
    rainyMonths?: string[]
    bestTimeToVisit?: string
  }
  safety?: {
    level: 'low' | 'medium' | 'high'
    notes: string
    warnings?: string[]
  }
  visaRequirements?: {
    required: boolean
    type?: string
    duration?: string
    notes?: string
  }
  vaccines?: {
    required: string[]
    recommended: string[]
  }
  currency?: {
    code: string
    name: string
    exchangeRate?: number
    exchangeRateDate?: string
  }
  language?: {
    official: string[]
    englishLevel?: 'low' | 'medium' | 'high'
  }
  topAttractions?: Array<{
    name: string
    type: string
    description?: string
    estimatedTime?: string
  }>
  localTips?: string[]
  notes?: string
}

// ============================================
// Fase 2: Presupuesto
// ============================================
export interface BudgetItem {
  category: string
  description: string
  estimatedMin: number
  estimatedMax: number
  actual?: number
  currency: string
  notes?: string
}

export interface BudgetData {
  totalEstimated?: { min: number; max: number }
  totalActual?: number
  currency: string
  categories?: {
    flights?: BudgetItem[]
    lodging?: BudgetItem[]
    transport?: BudgetItem[]
    food?: BudgetItem[]
    activities?: BudgetItem[]
    other?: BudgetItem[]
  }
  dailyBudget?: { min: number; max: number }
  notes?: string
}

// ============================================
// Fase 3: Documentación
// ============================================
export interface DocumentItem {
  type: string
  name: string
  number?: string
  expirationDate?: string
  status: 'pending' | 'obtained' | 'not_needed'
  notes?: string
}

export interface DocumentationData {
  passport?: {
    number?: string
    expirationDate?: string
    validForTrip: boolean
  }
  visa?: DocumentItem
  insurance?: {
    provider?: string
    policyNumber?: string
    coverage?: string[]
    emergencyPhone?: string
  }
  vaccines?: Array<{
    name: string
    date?: string
    required: boolean
  }>
  otherDocuments?: DocumentItem[]
  emergencyContacts?: Array<{
    name: string
    relationship: string
    phone: string
    email?: string
  }>
  notes?: string
}

// ============================================
// Fase 4: Vuelos
// ============================================
export interface FlightSegment {
  airline: string
  flightNumber: string
  departure: {
    airport: string
    city: string
    datetime: string
  }
  arrival: {
    airport: string
    city: string
    datetime: string
  }
  duration: string
  class?: string
  seat?: string
}

export interface FlightOption {
  id: string
  segments: FlightSegment[]
  totalPrice: number
  currency: string
  bookingUrl?: string
  notes?: string
}

export interface FlightsData {
  searchCriteria?: {
    from: string
    to: string
    departureDate: string
    returnDate?: string
    passengers: number
    class?: string
    flexibleDates?: boolean
  }
  options?: FlightOption[]
  selectedOption?: string // ID of selected option
  booking?: {
    confirmationNumber?: string
    bookingDate?: string
    totalPaid?: number
    currency?: string
  }
  notes?: string
}

// ============================================
// Fase 5: Hospedaje
// ============================================
export interface LodgingOption {
  id: string
  name: string
  type: 'hotel' | 'hostel' | 'airbnb' | 'apartment' | 'resort' | 'other'
  address?: string
  coordinates?: { lat: number; lng: number }
  checkIn: string
  checkOut: string
  pricePerNight: number
  totalPrice: number
  currency: string
  amenities?: string[]
  rating?: number
  reviewCount?: number
  bookingUrl?: string
  images?: string[]
  notes?: string
}

export interface LodgingData {
  searchCriteria?: {
    location: string
    checkIn: string
    checkOut: string
    guests: number
    rooms?: number
    type?: string[]
    maxPrice?: number
  }
  options?: LodgingOption[]
  selectedOption?: string // ID of selected option
  booking?: {
    confirmationNumber?: string
    bookingDate?: string
    totalPaid?: number
    currency?: string
    contactPhone?: string
    contactEmail?: string
  }
  notes?: string
}

// ============================================
// Fase 6: Transporte Local
// ============================================
export interface TransportOption {
  id: string
  type: 'rental_car' | 'public_transport' | 'taxi' | 'uber' | 'tour' | 'other'
  provider?: string
  description: string
  priceEstimate?: { min: number; max: number }
  currency: string
  bookingUrl?: string
  notes?: string
}

export interface TransportData {
  mainTransportMode?: string
  options?: TransportOption[]
  selectedOptions?: string[] // IDs of selected options
  rentalCar?: {
    company?: string
    confirmationNumber?: string
    pickupLocation?: string
    pickupDatetime?: string
    dropoffLocation?: string
    dropoffDatetime?: string
    carType?: string
    totalPrice?: number
    currency?: string
    insuranceIncluded?: boolean
  }
  publicTransport?: {
    cards?: string[] // e.g., "Metro card", "Bus pass"
    apps?: string[]
    tips?: string[]
  }
  notes?: string
}

// ============================================
// Fase 7: Itinerario
// ============================================
export interface Activity {
  id: string
  name: string
  type: string
  startTime?: string
  endTime?: string
  duration?: string
  location?: string
  address?: string
  coordinates?: { lat: number; lng: number }
  cost?: number
  currency?: string
  bookingRequired?: boolean
  bookingUrl?: string
  confirmationNumber?: string
  notes?: string
}

export interface DayPlan {
  date: string
  dayNumber: number
  title?: string
  activities: Activity[]
  meals?: {
    breakfast?: { place?: string; notes?: string }
    lunch?: { place?: string; notes?: string }
    dinner?: { place?: string; notes?: string }
  }
  notes?: string
}

export interface ItineraryData {
  days?: DayPlan[]
  flexibleActivities?: Activity[] // Activities not assigned to a specific day
  reservations?: Array<{
    type: string
    name: string
    confirmationNumber?: string
    datetime?: string
    notes?: string
  }>
  notes?: string
}

// ============================================
// Fase 8: Equipaje (Packing)
// ============================================
export interface PackingItem {
  id: string
  name: string
  category: string
  quantity: number
  packed: boolean
  essential: boolean
  notes?: string
}

export interface PackingData {
  categories?: {
    clothing?: PackingItem[]
    toiletries?: PackingItem[]
    electronics?: PackingItem[]
    documents?: PackingItem[]
    medications?: PackingItem[]
    other?: PackingItem[]
  }
  luggage?: Array<{
    type: 'carry_on' | 'checked' | 'personal' | 'other'
    weightLimit?: number
    dimensions?: string
  }>
  reminders?: string[]
  notes?: string
}

// ============================================
// Union type for all phase data
// ============================================
export type PhaseData =
  | InvestigationData
  | BudgetData
  | DocumentationData
  | FlightsData
  | LodgingData
  | TransportData
  | ItineraryData
  | PackingData
