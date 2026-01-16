# Arquitectura Técnica

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14+ (App Router) |
| Lenguaje | TypeScript |
| Styling | Tailwind CSS |
| Componentes | shadcn/ui |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| AI | Sistema multi-endpoint con Travel Agent (ver desarrollo/02-ai-system.md) |
| Maps & Places | Google Places API (New) + Google Maps |
| State | React Context API (CanvasContext, AuthContext) |
| Drag & Drop | @dnd-kit |
| Hoteles | SerpAPI |
| Vuelos | Skyscanner API |

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
│   - Ideas   │      - Actividades            │   - Búsqueda      │
│   - Chat    │      - Drag & Drop            │   - AI Panel      │
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
├── docs/
│   ├── core/                    # Documentación principal
│   ├── desarrollo/              # Guías técnicas
│   └── roadmap/                 # Planificación
├── public/
│
└── src/
    ├── app/                     # App Router pages
    │   ├── page.tsx             # Landing
    │   ├── login/
    │   ├── signup/
    │   ├── trips/
    │   │   ├── page.tsx         # Lista de viajes
    │   │   ├── new/page.tsx     # Crear viaje
    │   │   └── [id]/
    │   │       ├── page.tsx     # Redirect
    │   │       ├── planning/    # Canvas principal
    │   │       ├── explore/     # Explorar destino
    │   │       └── search/      # Búsqueda rápida
    │   ├── admin/
    │   │   ├── ai-logs/         # Logs de AI
    │   │   └── prompts/         # Gestión de prompts
    │   │
    │   └── api/
    │       ├── ai/              # ⭐ Sistema AI (18+ endpoints)
    │       │   ├── generate-plan/
    │       │   ├── generate-plan-stream/
    │       │   ├── generate-day/
    │       │   ├── generate-day-stream/
    │       │   ├── generate-tips/
    │       │   ├── generate-warnings/
    │       │   ├── generate-documents/
    │       │   ├── generate-packing/
    │       │   ├── enrich-itinerary/
    │       │   ├── prefetch-places/
    │       │   ├── curated-discovery/
    │       │   ├── contextual-questions/
    │       │   └── travel-agent/
    │       │       ├── chat/
    │       │       └── conversations/
    │       ├── places/          # Google Places proxy
    │       ├── hotels/          # SerpAPI proxy
    │       ├── flights/         # Skyscanner proxy
    │       └── trips/           # CRUD trips
    │
    ├── components/
    │   ├── ui/                  # shadcn components
    │   │
    │   ├── canvas/              # ⭐ Componentes del canvas
    │   │   ├── CanvasLayout.tsx
    │   │   ├── CanvasContext.tsx
    │   │   ├── CanvasDndContext.tsx
    │   │   ├── LeftSidebar/
    │   │   │   ├── index.tsx
    │   │   │   ├── ThingsToDoSection.tsx  # Ideas guardadas
    │   │   │   └── AddToDayModal.tsx
    │   │   ├── CentralPanel.tsx
    │   │   └── RightPanel/
    │   │       ├── index.tsx
    │   │       ├── PlaceSearch.tsx
    │   │       └── AIPanel.tsx
    │   │
    │   ├── explore/             # Modal de exploración
    │   │   ├── ExploreModal.tsx
    │   │   ├── PlaceDetailPanel.tsx
    │   │   ├── PlaceGrid.tsx
    │   │   ├── PlaceCard.tsx
    │   │   ├── ExploreMap.tsx
    │   │   └── CuratedDiscoveryView.tsx
    │   │
    │   ├── planning/            # Componentes de planificación
    │   │   ├── DayCard.tsx
    │   │   ├── TimelineEntry.tsx
    │   │   └── editor/
    │   │
    │   ├── ai/                  # Componentes AI
    │   │   ├── PlaceChip.tsx
    │   │   ├── ChatPanel.tsx
    │   │   └── DaySelectorDropdown.tsx
    │   │
    │   └── layout/              # Headers, footers
    │
    ├── contexts/
    │   ├── AuthContext.tsx      # Auth state
    │   └── CanvasContext.tsx    # UI state del canvas
    │
    ├── hooks/                   # Custom hooks
    │   ├── usePlan.ts
    │   ├── useTrips.ts
    │   ├── useThingsToDo.ts
    │   ├── useDayGeneration.ts
    │   ├── useChatConversation.ts
    │   ├── useChatStreaming.ts
    │   ├── useBackgroundGeneration.ts
    │   ├── useCuratedDiscovery.ts
    │   ├── useAIPrompts.ts
    │   ├── useAILogs.ts
    │   └── usePlacePhotos.ts
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts        # Browser client
    │   │   ├── server.ts        # Server client
    │   │   └── admin.ts         # Admin client
    │   │
    │   ├── ai/
    │   │   ├── providers/
    │   │   │   ├── claude-cli.ts
    │   │   │   ├── anthropic.ts
    │   │   │   └── openai.ts
    │   │   ├── travel-agent-tools.ts
    │   │   └── travel-agent-prompts.ts
    │   │
    │   ├── explore/
    │   │   └── google-places.ts
    │   │
    │   ├── places/
    │   │   ├── matching.ts
    │   │   ├── distance-matrix.ts
    │   │   └── scoring.ts
    │   │
    │   ├── hotels/
    │   │   ├── index.ts         # SerpAPI integration
    │   │   ├── cache.ts
    │   │   └── types.ts
    │   │
    │   ├── flights/
    │   │   ├── skyscanner.ts
    │   │   └── types.ts
    │   │
    │   ├── pdf/
    │   │   └── generate-pdf.ts
    │   │
    │   └── utils/
    │       ├── transportUtils.ts
    │       ├── timeUtils.ts
    │       └── timelineUtils.ts
    │
    ├── services/
    │   └── ai/
    │
    └── types/
        ├── database.ts          # Generado de Supabase
        ├── plan.ts              # GeneratedPlan, ItineraryDay, etc.
        ├── accommodation.ts
        ├── explore.ts
        └── ai-agent.ts
```

---

## Componentes del Canvas

### CanvasLayout.tsx (Layout Principal)

```tsx
// Estructura del layout de 3 columnas
export function CanvasLayout({ tripId, plan }: Props) {
  return (
    <CanvasProvider tripId={tripId} initialPlan={plan}>
      <CanvasDndContext>
        <div className="h-screen flex flex-col">
          <CanvasHeader />

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar izquierdo */}
            <LeftSidebar />

            {/* Panel central - Timeline */}
            <CentralPanel />

            {/* Panel derecho - Contextual */}
            <RightPanel />
          </div>
        </div>
      </CanvasDndContext>
    </CanvasProvider>
  );
}
```

### CanvasContext (State Management)

```typescript
// contexts/CanvasContext.tsx

interface CanvasContextType {
  // UI state
  rightPanelState: RightPanelState;
  exploreModalState: ExploreModalState;
  isSidebarOpen: boolean;

  // Actions
  selectActivity: (activityId: string) => void;
  openSearch: (query?: string) => void;
  openAIPanel: () => void;
  openExploreModal: (category?: string) => void;
  closeExploreModal: () => void;
  // ... más acciones
}

type RightPanelState =
  | { type: 'empty' }
  | { type: 'activity'; activityId: string }
  | { type: 'search'; query: string }
  | { type: 'ai' }
  | { type: 'customActivity' }
  | { type: 'accommodation' };
```

---

## API Routes

### Estructura Completa

```
/api/
├── ai/
│   ├── generate-plan/              # POST - Genera plan completo
│   ├── generate-plan-stream/       # POST - Streaming del plan
│   ├── generate-plan-summary/      # POST - Resumen inicial
│   ├── generate-day/               # POST - Genera día individual
│   ├── generate-day-stream/        # POST - Streaming por día
│   ├── generate-tips/              # POST - Tips de viaje
│   ├── generate-warnings/          # POST - Advertencias de seguridad
│   ├── generate-documents/         # POST - Checklist de documentos
│   ├── generate-packing/           # POST - Lista de empaque
│   ├── enrich-itinerary/           # POST - Enriquecer con detalles
│   ├── enrich-accommodations/      # POST - Enriquecer alojamientos
│   ├── prefetch-places/            # POST - Pre-fetch lugares de Google
│   ├── curated-discovery/          # POST - Descubrimiento personalizado
│   ├── contextual-questions/       # POST - Preguntas dinámicas
│   └── travel-agent/
│       ├── chat/                   # POST - Chat con el agente
│       └── conversations/
│           ├── route.ts            # GET/POST - Lista/crear
│           ├── [conversationId]/   # GET - Mensajes
│           └── trip/[tripId]/      # GET - Por viaje
│
├── places/
│   ├── search/                     # POST - Buscar lugares
│   ├── details/                    # GET - Detalles de lugar
│   └── photos/                     # GET - Fotos
│
├── hotels/
│   └── search/                     # POST - Buscar hoteles (SerpAPI)
│
├── flights/
│   └── search/                     # POST - Buscar vuelos (Skyscanner)
│
└── trips/
    ├── route.ts                    # GET/POST - Lista/Crear
    └── [id]/
        ├── route.ts                # GET/PUT/DELETE
        └── plan/                   # GET/PUT - Plan completo
```

---

## Integración Google Places

### Flujo de Datos

```
Usuario abre Explore Modal
       ↓
Frontend: POST /api/ai/curated-discovery
       ↓
Backend: Google Places API (Text Search) con 12+ categorías
       ↓
AI prioriza y ordena resultados
       ↓
Cachear en destination_suggestions
       ↓
Retornar al frontend
       ↓
Usuario guarda lugar → trip_things_to_do
       ↓
Usuario agrega al día → update plan.data
```

### Categorías Soportadas

```typescript
// lib/explore/google-places.ts

const PLACE_CATEGORIES = [
  'attractions',
  'nature',
  'restaurants',
  'cafes',
  'bars',
  'museums',
  'landmarks',
  'beaches',
  'religious',
  'markets',
  'viewpoints',
  'wellness'
];
```

Ver [desarrollo/03-google-places.md](../desarrollo/03-google-places.md) para detalles.

---

## Supabase

### Auth
- Email/password (principal)
- OAuth: Google (opcional)
- Row Level Security (RLS) en todas las tablas

### Database (PostgreSQL)
Ver [04-modelo-datos.md](04-modelo-datos.md) para schema completo.

Tablas principales:
- `trips` - Viajes del usuario
- `plans` - Plan completo como JSON
- `generation_states` - Estado de generación
- `agent_conversations` / `agent_messages` - Chat
- `trip_things_to_do` - Ideas guardadas
- Tablas de caché

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
│   │   Canvas    │    │  Context +  │    │  Custom     │        │
│   │ Components  │ ←→ │   Hooks     │ ←→ │  Hooks      │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                │                 │
└────────────────────────────────────────────────┼─────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (API Routes)                       │
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  AI System  │    │   Places    │    │   Hotels/   │        │
│   │  (18+ APIs) │    │   Routes    │    │   Flights   │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                 │
└──────────┼──────────────────┼──────────────────┼─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   AI Provider    │  │  Google Places   │  │    Supabase      │
│ (Anthropic/CLI)  │  │       API        │  │   PostgreSQL     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                             │                      │
                             ▼                      │
                      ┌──────────────────┐          │
                      │  SerpAPI/        │          │
                      │  Skyscanner      │←─────────┘
                      └──────────────────┘
```

---

## Drag & Drop

### Implementación

```tsx
// components/canvas/CanvasDndContext.tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export function CanvasDndContext({ children }) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // Lógica de drag & drop para:
    // - Mover actividades entre días
    // - Reordenar dentro del mismo día
    // - Mover de Ideas Guardadas al timeline
    // - Mover del timeline a Ideas Guardadas
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
}
```

### Comportamiento

| Acción | Resultado |
|--------|-----------|
| Drag actividad a otro día | Actualiza día en plan.data |
| Drag dentro del mismo día | Reordena timeline |
| Drag de Ideas al día | Agrega al timeline, elimina de Ideas |
| Drag del timeline a Ideas | Guarda en trip_things_to_do |

---

## Consideraciones

### Performance
- **SSR**: Landing page para SEO
- **Client Components**: Canvas (interactividad pesada)
- **Streaming**: AI responses con EventSource
- **Caching**: Google Places en Supabase + direcciones

### Seguridad
- API keys solo en servidor (no exponer al cliente)
- RLS en Supabase para aislamiento de datos
- Validación de inputs en todos los endpoints
- Admin panel protegido por verificación de email

### Real-time (Futuro)
- Supabase subscriptions para colaboración
- Optimistic updates
- Conflict resolution para edición concurrente
