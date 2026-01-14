"use client"

import { useCallback, useState } from "react"
import { useCanvasContext } from "../CanvasContext"
import { EmptyState } from "./EmptyState"
import { ActivityDetails } from "./ActivityDetails"
import { AccommodationDetails } from "./AccommodationDetails"
import { PlaceSearch } from "./PlaceSearch"
import { ActivityEditorInPanel } from "./ActivityEditorInPanel"
import { EditAccommodationModal } from "@/components/accommodations/EditAccommodationModal"
import type { GeneratedPlan } from "@/types/plan"
import type { Accommodation } from "@/types/accommodation"

interface RightPanelProps {
  tripId: string
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
  onOpenHotelSearch?: (accommodation?: Accommodation) => void
}

export function RightPanel({ tripId, plan, onUpdatePlan, onOpenHotelSearch }: RightPanelProps) {
  const { rightPanelState, openCustomActivityEditor, clearRightPanel } = useCanvasContext()
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null)

  // Accommodation action handlers
  const updateAccommodations = useCallback((newAccommodations: Accommodation[]) => {
    if (!onUpdatePlan) return
    onUpdatePlan({
      ...plan,
      accommodations: newAccommodations,
    })
  }, [plan, onUpdatePlan])

  const handleDeleteAccommodation = useCallback((accommodation: Accommodation) => {
    if (!confirm(`¿Eliminar ${accommodation.name}?`)) return
    const updated = (plan.accommodations || []).filter(a => a.id !== accommodation.id)
    updateAccommodations(updated)
    clearRightPanel()
  }, [plan.accommodations, updateAccommodations, clearRightPanel])

  const handleDismissAccommodation = useCallback((accommodation: Accommodation) => {
    const updated = (plan.accommodations || []).filter(a => a.id !== accommodation.id)
    updateAccommodations(updated)
    clearRightPanel()
  }, [plan.accommodations, updateAccommodations, clearRightPanel])

  const handleMarkConfirmedAccommodation = useCallback((accommodation: Accommodation) => {
    const updated = (plan.accommodations || []).map(a =>
      a.id === accommodation.id
        ? { ...a, status: 'confirmed' as const, updatedAt: new Date().toISOString() }
        : a
    )
    updateAccommodations(updated)
  }, [plan.accommodations, updateAccommodations])

  const handleReplaceAccommodation = useCallback((accommodation: Accommodation) => {
    onOpenHotelSearch?.(accommodation)
  }, [onOpenHotelSearch])

  const handleBookNowAccommodation = useCallback((accommodation: Accommodation) => {
    onOpenHotelSearch?.(accommodation)
  }, [onOpenHotelSearch])

  const handleEditAccommodation = useCallback((accommodation: Accommodation) => {
    setEditingAccommodation(accommodation)
  }, [])

  const handleSaveAccommodationEdit = useCallback((updated: Accommodation) => {
    const newList = (plan.accommodations || []).map(a =>
      a.id === updated.id ? updated : a
    )
    updateAccommodations(newList)
    setEditingAccommodation(null)
  }, [plan.accommodations, updateAccommodations])

  return (
    <div className="h-full bg-card transition-all duration-200 ease-out">
      {rightPanelState.type === 'empty' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
          <EmptyState plan={plan} />
        </div>
      )}

      {rightPanelState.type === 'activity' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
          <ActivityDetails
            activity={rightPanelState.activity}
            dayNumber={rightPanelState.dayNumber}
            tripId={tripId}
            plan={plan}
            onUpdatePlan={onUpdatePlan}
          />
        </div>
      )}

      {rightPanelState.type === 'accommodation' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
          <AccommodationDetails
            accommodation={rightPanelState.accommodation}
            onEdit={handleEditAccommodation}
            onDelete={handleDeleteAccommodation}
            onReplace={handleReplaceAccommodation}
            onMarkConfirmed={handleMarkConfirmedAccommodation}
            onDismiss={handleDismissAccommodation}
            onBookNow={handleBookNowAccommodation}
          />
        </div>
      )}

      {rightPanelState.type === 'search' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
          <PlaceSearch
            tripId={tripId}
            dayNumber={rightPanelState.dayNumber}
            timeSlot={rightPanelState.timeSlot}
            replaceActivityId={rightPanelState.replaceActivityId}
            preselectedCategory={rightPanelState.preselectedCategory}
            plan={plan}
            onUpdatePlan={onUpdatePlan}
            onOpenCustomActivity={rightPanelState.dayNumber ? () => openCustomActivityEditor(rightPanelState.dayNumber!, rightPanelState.timeSlot) : undefined}
          />
        </div>
      )}

      {rightPanelState.type === 'customActivity' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
          <ActivityEditorInPanel
            dayNumber={rightPanelState.dayNumber}
            timeSlot={rightPanelState.timeSlot}
            plan={plan}
            onUpdatePlan={onUpdatePlan}
          />
        </div>
      )}

      {rightPanelState.type === 'ai' && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
          <AISuggestionsPlaceholder dayNumber={rightPanelState.dayNumber} />
        </div>
      )}

      {/* Edit Accommodation Modal */}
      <EditAccommodationModal
        accommodation={editingAccommodation}
        open={!!editingAccommodation}
        onClose={() => setEditingAccommodation(null)}
        onSave={handleSaveAccommodationEdit}
      />
    </div>
  )
}

// Placeholder for AI suggestions - to be implemented
function AISuggestionsPlaceholder({ dayNumber }: { dayNumber: number }) {
  const { clearRightPanel } = useCanvasContext()

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Sugerencias AI</h3>
        <button
          onClick={clearRightPanel}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Sugerencias de AI para el dia {dayNumber}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Proximamente...
          </p>
        </div>
      </div>
    </div>
  )
}
