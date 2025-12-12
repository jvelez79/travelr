# Arquitectura Técnica

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14+ (App Router) |
| Lenguaje | TypeScript |
| Styling | Tailwind CSS |
| Componentes | shadcn/ui |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| AI | 3 Agents especializados (ver 04-ai-provider.md) |
| Maps & Places | Google Places API + Google Maps |
| State | Zustand (canvas state) |

---

## Arquitectura del Canvas

### Layout de 3 Columnas

```
┌─────────────────────────────────────────────────────────────────┐
│                         Header (fijo)                            │
├─────────────┬───────────────────────────────┬───────────────────┤
│             │                               │                   │
│   Sidebar   │      Panel Central            │   Panel Derecho   │
│   Izquierdo │      (Timeline)               │   (Contextual)    │
│             │                               │                   │
│   200-250px │      flex-1 (600-700px)       │   280-350px       │
│             │                               │                   │
│   - Resumen │      - Días                   │   - Vacío         │
│   - Destinos│      - Bloques de tiempo      │   - Detalles      │
│   - Controles│     - Actividades            │   - Búsqueda      │
│             │      - Drag & Drop            │   - Sugerencias   │
│             │                               │                   │
└─────────────┴───────────────────────────────┴───────────────────┘
```

### Responsividad

| Breakpoint | Comportamiento |
|------------|----------------|
| Desktop (>1024px) | 3 columnas visibles |
| Tablet (768-1024px) | Sidebar colapsable, 2 columnas |
| Mobile (<768px) | 1 columna, sidebar en drawer, panel derecho en modal |

---

## Estructura de Carpetas

```
travelr/
├── CLAUDE.md
├── docs/                        # Documentación
├── public/                      # Assets estáticos
├── package.json
├── tsconfig.json
├── next.config.ts
│
└── src/
    ├── app/                     # App Router pages
    │   ├── page.tsx             # Landing
    │   ├── trips/
    │   │   ├── new/             # Crear viaje
    │   │   │   └── page.tsx
    │   │   └── [id]/
    │   │       └── page.tsx     # Canvas principal
    │   ├── explore/             # Explorar destinos
    │   │   ├── page.tsx
    │   │   └── [destination]/
    │   └── api/
    │       ├── ai-agents/       # AI endpoints
    │       │   ├── architect/
    │       │   ├── curator/
    │       │   └── optimizer/
    │       ├── places/          # Google Places proxy
    │       └── trips/           # CRUD trips
    │
    ├── components/
    │   ├── ui/                  # shadcn components
    │   │
    │   ├── canvas/              # ⭐ Componentes del canvas
    │   │   ├── Canvas.tsx       # Layout principal 3 columnas
    │   │   ├── Sidebar.tsx      # Panel izquierdo
    │   │   ├── Timeline.tsx     # Panel central
    │   │   ├── DaySection.tsx   # Sección de un día
    │   │   ├── TimeBlock.tsx    # Bloque de tiempo (vacío/lleno)
    │   │   ├── ActivityCard.tsx # Card de actividad
    │   │   └── ContextPanel/    # Panel derecho
    │   │
    │   ├── trip/                # Componentes de viaje
    │   ├── places/              # Google Places
    │   └── ai/                  # Componentes AI
    │
    ├── lib/
    │   ├── supabase/            # Cliente y tipos
    │   ├── ai/                  # AI Provider abstraction
    │   ├── google/              # Google APIs
    │   └── utils/
    │
    ├── stores/                  # Zustand stores
    │
    └── types/                   # TypeScript types
```

---

## Componentes del Canvas

### Canvas.tsx (Layout Principal)

```tsx
// Estructura del layout de 3 columnas
export function Canvas({ tripId }: { tripId: string }) {
  const { trip, destinations, activities, selectedItem } = useCanvasStore();

  return (
    <div className="h-screen flex flex-col">
      <CanvasHeader trip={trip} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar izquierdo */}
        <Sidebar
          trip={trip}
          destinations={destinations}
          className="w-[250px] border-r"
        />

        {/* Panel central - Timeline */}
        <Timeline
          activities={activities}
          destinations={destinations}
          className="flex-1 overflow-y-auto"
        />

        {/* Panel derecho - Contextual */}
        <ContextPanel
          selectedItem={selectedItem}
          className="w-[320px] border-l"
        />
      </div>
    </div>
  );
}
```

### Timeline.tsx (Panel Central)

```tsx
export function Timeline({ activities, destinations }) {
  const days = groupActivitiesByDay(activities);

  return (
    <div className="p-4 space-y-6">
      {days.map((day) => (
        <DaySection
          key={day.date}
          day={day}
          destination={findDestination(destinations, day.date)}
        />
      ))}
    </div>
  );
}
```

### ContextPanel (Panel Derecho)

```tsx
// 4 estados posibles del panel derecho
type PanelState =
  | { type: 'empty' }
  | { type: 'activity_details'; activity: Activity }
  | { type: 'search_results'; results: Place[]; query: string }
  | { type: 'ai_recommendations'; recommendations: CuratorOutput };

export function ContextPanel({ state }: { state: PanelState }) {
  switch (state.type) {
    case 'empty':
      return <EmptyState />;
    case 'activity_details':
      return <ActivityDetails activity={state.activity} />;
    case 'search_results':
      return <SearchResults results={state.results} query={state.query} />;
    case 'ai_recommendations':
      return <AIRecommendations data={state.recommendations} />;
  }
}
```

---

## State Management (Zustand)

### Canvas Store

```typescript
// stores/canvas-store.ts
interface CanvasState {
  // Datos del viaje
  trip: Trip | null;
  destinations: Destination[];
  activities: Activity[];

  // UI state
  selectedActivity: Activity | null;
  selectedTimeBlock: TimeBlock | null;
  rightPanelState: PanelState;

  // Mode
  mode: 'assisted' | 'manual';

  // Actions
  setTrip: (trip: Trip) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  moveActivity: (id: string, newDate: string, newTime: string) => void;
  selectActivity: (activity: Activity | null) => void;
  selectTimeBlock: (block: TimeBlock | null) => void;
  setRightPanelState: (state: PanelState) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // Initial state
  trip: null,
  destinations: [],
  activities: [],
  selectedActivity: null,
  selectedTimeBlock: null,
  rightPanelState: { type: 'empty' },
  mode: 'assisted',

  // Actions
  addActivity: (activity) =>
    set((state) => ({
      activities: [...state.activities, activity],
    })),

  moveActivity: (id, newDate, newTime) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, date: newDate, time_start: newTime } : a
      ),
    })),

  // ... más actions
}));
```

---

## API Routes

### Estructura

```
/api/
├── ai-agents/
│   ├── architect/route.ts    # POST - Genera estructura
│   ├── curator/route.ts      # POST - Sugiere actividades
│   └── optimizer/route.ts    # POST - Optimiza día
│
├── places/
│   ├── search/route.ts       # POST - Buscar lugares
│   └── details/route.ts      # GET - Detalles de lugar
│
└── trips/
    ├── route.ts              # GET/POST - Lista/Crear
    └── [id]/
        ├── route.ts          # GET/PUT/DELETE - CRUD
        └── activities/
            └── route.ts      # GET/POST - Actividades
```

### Ejemplo: Curator Endpoint

```typescript
// app/api/ai-agents/curator/route.ts
import { getAIProvider } from '@/lib/ai/provider';
import { searchGooglePlaces } from '@/lib/google/places';

export async function POST(req: Request) {
  const input: CuratorInput = await req.json();

  // 1. Buscar lugares en Google Places
  const places = await searchGooglePlaces({
    query: input.query,
    location: input.block.location,
    radius: 5000,
  });

  // 2. Llamar al AI Curator para priorizar
  const ai = getAIProvider();
  const recommendations = await ai.askJSON<CuratorOutput>(
    buildCuratorPrompt(input, places)
  );

  // 3. Enriquecer con datos de Google Places
  const enriched = await enrichRecommendations(recommendations, places);

  return Response.json(enriched);
}
```

---

## Integración Google Places

### Flujo de Datos

```
Usuario busca "museos"
       ↓
Frontend: POST /api/places/search
       ↓
Backend: Google Places API (Text Search)
       ↓
Cachear resultados (Redis/Supabase)
       ↓
Retornar al frontend
       ↓
Usuario selecciona lugar
       ↓
Backend: Google Places API (Place Details)
       ↓
Crear Activity con google_data completo
```

### API Keys

```env
# Server-side (no exponer al cliente)
GOOGLE_PLACES_API_KEY=AIza...

# Client-side (solo para Maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

Ver [09-google-places.md](09-google-places.md) para detalles de la integración.

---

## Supabase

### Auth
- Email/password (principal)
- OAuth: Google, GitHub (opcional)
- Row Level Security (RLS) en todas las tablas

### Database (PostgreSQL)
Ver [05-modelo-datos.md](05-modelo-datos.md) para schema completo.

Tablas principales:
- `trips` - Viajes del usuario
- `destinations` - Destinos por viaje
- `activities` - Actividades en el timeline
- `saved_places` - Lugares guardados del usuario
- `messages` - Historial de chat con AI

### Storage
- Documentos del usuario (futuro)
- Fotos personalizadas (futuro)

---

## Flujo de Datos General

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Canvas    │    │   Zustand   │    │  API Client │        │
│   │ Components  │ ←→ │   Store     │ ←→ │   (fetch)   │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                │                 │
└────────────────────────────────────────────────┼─────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (API Routes)                       │
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  AI Agents  │    │   Places    │    │    Trips    │        │
│   │   Routes    │    │   Routes    │    │   Routes    │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                 │
└──────────┼──────────────────┼──────────────────┼─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   AI Provider    │  │  Google Places   │  │    Supabase      │
│ (Claude/OpenAI)  │  │       API        │  │   PostgreSQL     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Drag & Drop

### Implementación

```tsx
// Usando @dnd-kit/core
import { DndContext, DragEndEvent } from '@dnd-kit/core';

function Timeline() {
  const { moveActivity } = useCanvasStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      const activityId = active.id as string;
      const { date, time } = over.data.current as TimeBlockData;

      moveActivity(activityId, date, time);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* TimeBlocks y ActivityCards */}
    </DndContext>
  );
}
```

### Comportamiento

| Acción | Resultado |
|--------|-----------|
| Drag actividad a otro horario | Actualiza time_start/time_end |
| Drag actividad a otro día | Actualiza date y time |
| Drag sobre bloque ocupado | Muestra indicador de conflicto |
| Drop fuera de área válida | Cancela drag |

---

## Consideraciones

### Performance
- **SSR**: Landing page para SEO
- **Client Components**: Canvas (interactividad pesada)
- **Streaming**: AI responses cuando sea posible
- **Caching**: Google Places (Redis o Supabase cache)

### Seguridad
- API keys solo en servidor (no exponer al cliente)
- RLS en Supabase para aislamiento de datos
- Validación de inputs en todos los endpoints

### Real-time (Futuro)
- Supabase subscriptions para colaboración
- Optimistic updates en el store
- Conflict resolution para edición concurrente
