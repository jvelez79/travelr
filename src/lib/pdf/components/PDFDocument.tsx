/**
 * Main PDF Document Component
 * Orchestrates all pages into a complete PDF
 */

import { Document } from '@react-pdf/renderer'
import type { GeneratedPlan } from '@/types/plan'
import { CoverPage } from './CoverPage'
import { MapPage } from './MapPage'
import { DayPage } from './DayPage'
import { BudgetPage } from './BudgetPage'

export interface PDFDocumentProps {
  plan: GeneratedPlan
  heroImage?: string | null
  staticMapUrl?: string | null
}

export function TravelrPDFDocument({
  plan,
  heroImage,
  staticMapUrl,
}: PDFDocumentProps) {
  // Calculate page numbers
  // Page 1: Cover
  // Page 2: Map
  // Pages 3+: Days (one per day)
  // Last page: Budget
  const startDayPage = 3
  const budgetPageNumber = startDayPage + plan.itinerary.length

  return (
    <Document
      title={`${plan.summary.title} - Itinerario de Viaje`}
      author="Travelr"
      subject={`Itinerario de viaje a ${plan.trip.destination}`}
      keywords={`viaje, ${plan.trip.destination}, itinerario, travelr`}
      creator="Travelr - travelr.ai"
      producer="@react-pdf/renderer"
    >
      {/* Page 1: Cover */}
      <CoverPage plan={plan} heroImage={heroImage} />

      {/* Page 2: Map + Summary */}
      <MapPage plan={plan} staticMapUrl={staticMapUrl} />

      {/* Pages 3+: Daily Itinerary */}
      {plan.itinerary.map((day, index) => (
        <DayPage
          key={day.day}
          day={day}
          plan={plan}
          pageNumber={startDayPage + index}
        />
      ))}

      {/* Last Page: Budget */}
      {plan.budget && (
        <BudgetPage plan={plan} pageNumber={budgetPageNumber} />
      )}
    </Document>
  )
}
