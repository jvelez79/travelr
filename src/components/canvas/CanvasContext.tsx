"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import type { TimelineEntry, GeneratedPlan, AccommodationSuggestion } from "@/types/plan"
import type { PlaceCategory } from "@/types/explore"

// Right panel state types
export type RightPanelState =
  | { type: 'empty' }
  | { type: 'activity'; activity: TimelineEntry; dayNumber: number }
  | { type: 'search'; dayNumber: number; timeSlot?: string; replaceActivityId?: string; preselectedCategory?: PlaceCategory }
  | { type: 'ai'; dayNumber: number }
  | { type: 'customActivity'; dayNumber: number; timeSlot?: string }
  | { type: 'accommodation'; accommodation: AccommodationSuggestion }

// Explore modal state type
export interface ExploreModalState {
  isOpen: boolean
  dayNumber: number
  dayLocation: string
  mode: 'add' | 'replace'
  replaceActivityId?: string
  preselectedCategory?: PlaceCategory
  activityName?: string // For showing "Buscar para: [nombre]" in header
}

interface CanvasContextType {
  // Right panel state
  rightPanelState: RightPanelState
  setRightPanelState: (state: RightPanelState) => void

  // Sidebar state (for mobile)
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Right panel visibility (for mobile)
  isRightPanelOpen: boolean
  setRightPanelOpen: (open: boolean) => void

  // Explore modal state
  exploreModalState: ExploreModalState | null
  openExploreModal: (
    dayNumber: number,
    dayLocation: string,
    mode: 'add' | 'replace',
    options?: {
      replaceActivityId?: string
      preselectedCategory?: PlaceCategory
      activityName?: string
    }
  ) => void
  closeExploreModal: () => void

  // Day refs for scrolling
  registerDayRef: (dayNumber: number, ref: HTMLDivElement | null) => void
  scrollToDay: (dayNumber: number) => void

  // Quick actions
  selectActivity: (activity: TimelineEntry, dayNumber: number) => void
  selectAccommodation: (accommodation: AccommodationSuggestion) => void
  openSearch: (dayNumber: number, timeSlot?: string) => void
  openSearchToReplace: (dayNumber: number, activityId: string, category: PlaceCategory) => void
  openAISuggestions: (dayNumber: number) => void
  openCustomActivityEditor: (dayNumber: number, timeSlot?: string) => void
  clearRightPanel: () => void
}

const CanvasContext = createContext<CanvasContextType | null>(null)

interface CanvasProviderProps {
  children: ReactNode
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  // Right panel state
  const [rightPanelState, setRightPanelState] = useState<RightPanelState>({ type: 'empty' })

  // Mobile UI state
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isRightPanelOpen, setRightPanelOpen] = useState(false)

  // Explore modal state
  const [exploreModalState, setExploreModalState] = useState<ExploreModalState | null>(null)

  // Day refs for scrolling
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const registerDayRef = useCallback((dayNumber: number, ref: HTMLDivElement | null) => {
    dayRefs.current[dayNumber] = ref
  }, [])

  const scrollToDay = useCallback((dayNumber: number) => {
    const ref = dayRefs.current[dayNumber]
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // Close sidebar on mobile after navigation
    setSidebarOpen(false)
  }, [])

  // Action handlers
  const selectActivity = useCallback((activity: TimelineEntry, dayNumber: number) => {
    setRightPanelState({ type: 'activity', activity, dayNumber })
    setRightPanelOpen(true) // Open panel on mobile
  }, [])

  const selectAccommodation = useCallback((accommodation: AccommodationSuggestion) => {
    setRightPanelState({ type: 'accommodation', accommodation })
    setRightPanelOpen(true) // Open panel on mobile
  }, [])

  const openSearch = useCallback((dayNumber: number, timeSlot?: string) => {
    setRightPanelState({ type: 'search', dayNumber, timeSlot })
    setRightPanelOpen(true)
  }, [])

  const openSearchToReplace = useCallback((dayNumber: number, activityId: string, category: PlaceCategory) => {
    setRightPanelState({ type: 'search', dayNumber, replaceActivityId: activityId, preselectedCategory: category })
    setRightPanelOpen(true)
  }, [])

  const openAISuggestions = useCallback((dayNumber: number) => {
    setRightPanelState({ type: 'ai', dayNumber })
    setRightPanelOpen(true)
  }, [])

  const openCustomActivityEditor = useCallback((dayNumber: number, timeSlot?: string) => {
    setRightPanelState({ type: 'customActivity', dayNumber, timeSlot })
    setRightPanelOpen(true)
  }, [])

  const clearRightPanel = useCallback(() => {
    setRightPanelState({ type: 'empty' })
    setRightPanelOpen(false)
  }, [])

  // Explore modal actions
  const openExploreModal = useCallback((
    dayNumber: number,
    dayLocation: string,
    mode: 'add' | 'replace',
    options?: {
      replaceActivityId?: string
      preselectedCategory?: PlaceCategory
      activityName?: string
    }
  ) => {
    setExploreModalState({
      isOpen: true,
      dayNumber,
      dayLocation,
      mode,
      replaceActivityId: options?.replaceActivityId,
      preselectedCategory: options?.preselectedCategory,
      activityName: options?.activityName,
    })
  }, [])

  const closeExploreModal = useCallback(() => {
    setExploreModalState(null)
  }, [])

  return (
    <CanvasContext.Provider
      value={{
        rightPanelState,
        setRightPanelState,
        isSidebarOpen,
        setSidebarOpen,
        isRightPanelOpen,
        setRightPanelOpen,
        exploreModalState,
        openExploreModal,
        closeExploreModal,
        registerDayRef,
        scrollToDay,
        selectActivity,
        selectAccommodation,
        openSearch,
        openSearchToReplace,
        openAISuggestions,
        openCustomActivityEditor,
        clearRightPanel,
      }}
    >
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvasContext() {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider')
  }
  return context
}
