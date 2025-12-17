---
name: skill-zustand-canvas
description: Canvas state management patterns for Travelr (Context, interactions, panels)
topics: ["zustand", "react-context", "state-management", "canvas", "dnd-kit"]
---

# Zustand Canvas Skill

Travelr uses React Context (not Zustand stores directly) for canvas state management.

## Canvas Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Header (fijo)                            │
├─────────────┬───────────────────────────────────────────────────┤
│   Sidebar   │      Panel Central            │   Panel Derecho   │
│   Izquierdo │      (Timeline)               │   (Contextual)    │
│   200-250px │      flex-1 (600-700px)       │   280-350px       │
│             │                               │                   │
│   - Resumen │      - Días con bloques       │   - Vacío         │
│   - Destinos│      - Actividades            │   - Detalles      │
│   - Controles│     - Drag & Drop            │   - Búsqueda      │
│             │                               │   - AI Ideas      │
└─────────────┴───────────────────────────────┴───────────────────┘
```

---

## CanvasContext

**File**: `src/components/canvas/CanvasContext.tsx`

### State Types

```typescript
type RightPanelState =
  | { type: 'empty' }
  | { type: 'activity'; activity: TimelineEntry; dayNumber: number }
  | { type: 'search'; dayNumber: number; initialTimeSlot?: string }
  | { type: 'ai'; dayNumber: number }
  | { type: 'accommodation'; day: ItineraryDay }

interface ExploreModalState {
  dayNumber: number
  dayLocation: string
  mode: 'explore' | 'search'
  initialQuery?: string
  timeSlot?: string
}

interface CanvasContextType {
  // Right panel state
  rightPanelState: RightPanelState
  setRightPanelState: (state: RightPanelState) => void

  // Sidebar visibility (mobile)
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Right panel visibility (mobile)
  isRightPanelOpen: boolean
  setRightPanelOpen: (open: boolean) => void

  // Explore modal
  exploreModalState: ExploreModalState | null
  openExploreModal: (dayNumber: number, dayLocation: string, mode: 'explore' | 'search', options?: { initialQuery?: string; timeSlot?: string }) => void
  closeExploreModal: () => void

  // Day refs for scrolling
  registerDayRef: (dayNumber: number, ref: HTMLDivElement | null) => void
  scrollToDay: (dayNumber: number) => void

  // Quick actions
  selectActivity: (activity: TimelineEntry, dayNumber: number) => void
  openSearch: (dayNumber: number, timeSlot?: string) => void
  openAISuggestions: (dayNumber: number) => void
}
```

### Usage Pattern

```typescript
'use client'

import { useCanvasContext } from '@/components/canvas/CanvasContext'

export function MyComponent() {
  const {
    rightPanelState,
    setRightPanelState,
    selectActivity,
    openSearch,
    scrollToDay,
  } = useCanvasContext()

  // Select an activity to show in right panel
  const handleActivityClick = (activity: TimelineEntry, dayNumber: number) => {
    selectActivity(activity, dayNumber)
  }

  // Open search panel for a day
  const handleAddActivity = (dayNumber: number) => {
    openSearch(dayNumber)
  }

  // Scroll to a specific day
  const handleDaySelect = (dayNumber: number) => {
    scrollToDay(dayNumber)
  }

  return (/* ... */)
}
```

---

## Right Panel States

### Empty State
```typescript
setRightPanelState({ type: 'empty' })
```
Shows placeholder or instructions.

### Activity Details
```typescript
setRightPanelState({
  type: 'activity',
  activity: selectedActivity,
  dayNumber: 3,
})
```
Shows activity details, edit options, delete button.

### Search Panel
```typescript
setRightPanelState({
  type: 'search',
  dayNumber: 3,
  initialTimeSlot: '14:00',
})
```
Shows Google Places search, results, add to day.

### AI Suggestions
```typescript
setRightPanelState({
  type: 'ai',
  dayNumber: 3,
})
```
Shows AI-generated activity suggestions for the day.

### Accommodation
```typescript
setRightPanelState({
  type: 'accommodation',
  day: itineraryDay,
})
```
Shows accommodation options for the day.

---

## Interaction Flows

### Adding Activity to Day

```typescript
// 1. User clicks "Add Activity" on Day 3
openSearch(3)

// 2. User searches for a place
// (Google Places API handles search)

// 3. User selects a place
const handleSelectPlace = async (place: Place, dayNumber: number) => {
  // Create activity from place
  const newActivity: TimelineEntry = {
    id: crypto.randomUUID(),
    time: suggestedTime,
    activity: place.name,
    location: place.formatted_address,
    coordinates: { lat: place.location.lat, lng: place.location.lng },
    icon: getCategoryIcon(place.category),
    placeData: placeToPlaceData(place),
  }

  // Add to day's timeline
  const updatedItinerary = plan.itinerary.map(day =>
    day.day === dayNumber
      ? { ...day, timeline: recalculateTimeline([...day.timeline, newActivity]) }
      : day
  )

  // Update plan
  onUpdatePlan({ ...plan, itinerary: updatedItinerary })

  // Calculate transport in background
  calculateTransportForDay(dayNumber)
}
```

### Drag and Drop

Uses `@dnd-kit` for drag and drop:

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

function DayTimeline({ day, onReorder }: Props) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = day.timeline.findIndex(a => a.id === active.id)
    const newIndex = day.timeline.findIndex(a => a.id === over.id)

    const reorderedTimeline = arrayMove(day.timeline, oldIndex, newIndex)
    const recalculated = recalculateTimeline(reorderedTimeline)

    onReorder(day.day, recalculated)
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={day.timeline.map(a => a.id)} strategy={verticalListSortingStrategy}>
        {day.timeline.map(activity => (
          <SortableActivity key={activity.id} activity={activity} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

### Scrolling to Day

```typescript
// Register day ref when component mounts
const dayRef = useRef<HTMLDivElement>(null)
const { registerDayRef } = useCanvasContext()

useEffect(() => {
  registerDayRef(day.day, dayRef.current)
  return () => registerDayRef(day.day, null)
}, [day.day, registerDayRef])

// Scroll to day from sidebar
const { scrollToDay } = useCanvasContext()

const handleDayClick = (dayNumber: number) => {
  scrollToDay(dayNumber)
}
```

---

## Timeline Utilities

### Recalculate Timeline

After adding/removing/reordering activities:

```typescript
import { recalculateTimeline } from '@/lib/timelineUtils'

// Recalculates times based on activity order and durations
const updatedTimeline = recalculateTimeline(timeline)
```

### Calculate Transport

After timeline changes, calculate transport between activities:

```typescript
import { calculateTransportForTimeline } from '@/lib/transportUtils'

// Adds transport blocks between activities
const timelineWithTransport = await calculateTransportForTimeline(timeline)
```

---

## Mobile Responsiveness

### Sidebar Toggle
```typescript
const { isSidebarOpen, setSidebarOpen } = useCanvasContext()

// Toggle sidebar (shows as Sheet on mobile)
<Button onClick={() => setSidebarOpen(!isSidebarOpen)}>
  <Menu className="h-4 w-4" />
</Button>
```

### Right Panel Toggle
```typescript
const { isRightPanelOpen, setRightPanelOpen } = useCanvasContext()

// Toggle right panel (shows as Sheet on mobile)
<Button onClick={() => setRightPanelOpen(!isRightPanelOpen)}>
  <PanelRightOpen className="h-4 w-4" />
</Button>
```

---

## Reference Files

- `src/components/canvas/CanvasContext.tsx` - Main context
- `src/components/canvas/CanvasLayout.tsx` - Layout component
- `src/lib/timelineUtils.ts` - Timeline calculations
- `src/lib/transportUtils.ts` - Transport calculations
