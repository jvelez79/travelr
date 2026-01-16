# Modelo de Datos

## Arquitectura de Datos

El modelo de datos de Travelr utiliza un enfoque híbrido:
- **Supabase PostgreSQL** para persistencia y relaciones
- **JSON/JSONB** para datos complejos y flexibles (planes, preferencias)
- **TypeScript types** para tipado estricto en el frontend

### Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Plan completo | JSON en tabla `plans` | Flexibilidad para itinerarios complejos sin migraciones |
| Estado de generación | Tabla separada `generation_states` | Tracking de progreso, retry logic, resumable |
| Chat AI | Tablas `agent_conversations` + `agent_messages` | Historial persistente, múltiples conversaciones por viaje |
| Ideas guardadas | Tabla `trip_things_to_do` | Lugares guardados por viaje (no globales) |
| Caché | Tablas dedicadas | Reducir llamadas a APIs externas |

---

## Diagrama ER

```
┌─────────────────┐
│     trips       │
├─────────────────┤
│ id (PK)         │
│ user_id         │
│ destination     │
│ origin          │
│ start_date      │
│ end_date        │
│ travelers       │
│ mode            │
│ status          │
│ current_phase   │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐     ┌─────────────────────┐
│     plans       │     │  generation_states  │
├─────────────────┤     ├─────────────────────┤
│ id (PK)         │     │ id (PK)             │
│ trip_id (FK)    │     │ trip_id (FK)        │
│ user_id         │     │ user_id             │
│ data (JSONB)    │◄────│ status              │
│ version         │     │ current_day         │
└─────────────────┘     │ completed_days[]    │
                        │ failed_days         │
         │              │ places_context      │
         │ 1:N          │ summary_result      │
         ▼              └─────────────────────┘
┌─────────────────────┐
│ agent_conversations │
├─────────────────────┤
│ id (PK)             │
│ trip_id (FK)        │
│ user_id             │
│ title               │
└────────┬────────────┘
         │ 1:N
         ▼
┌─────────────────┐
│ agent_messages  │
├─────────────────┤
│ id (PK)         │
│ conversation_id │
│ role            │
│ content         │
│ tool_calls      │
└─────────────────┘

┌─────────────────────┐     ┌─────────────────┐
│  trip_things_to_do  │     │ ai_request_logs │
├─────────────────────┤     ├─────────────────┤
│ id (PK)             │     │ id (PK)         │
│ trip_id (FK)        │     │ trip_id (FK)    │
│ google_place_id     │     │ user_id         │
│ place_data (JSONB)  │     │ endpoint        │
│ category            │     │ provider        │
└─────────────────────┘     │ model           │
                            │ input_tokens    │
┌─────────────────────────┐ │ output_tokens   │
│  destination_suggestions│ │ cost_cents      │
├─────────────────────────┤ │ status          │
│ id (PK)                 │ └─────────────────┘
│ place_name              │
│ suggestions (JSONB)     │ ┌─────────────────┐
│ cache_key               │ │ directions_cache│
│ expires_at              │ ├─────────────────┤
└─────────────────────────┘ │ from_lat/lng    │
                            │ to_lat/lng      │
                            │ mode            │
                            │ travel_info     │
                            └─────────────────┘
```

---

## Tablas Principales

### trips
```sql
-- Viajes del usuario
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Info del viaje
  destination TEXT NOT NULL,      -- "Costa Rica"
  origin TEXT NOT NULL,           -- "San Juan, Puerto Rico"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers INTEGER DEFAULT 1,

  -- Estado
  mode TEXT DEFAULT 'guided',     -- 'guided' | 'manual'
  status TEXT DEFAULT 'planning', -- 'planning' | 'draft' | 'completed'
  current_phase INTEGER DEFAULT 0, -- Fase actual de generación

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### plans
```sql
-- Plan completo como JSON (el itinerario y toda la data generada)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL,

  -- El plan completo
  data JSONB NOT NULL,            -- GeneratedPlan completo
  version INTEGER DEFAULT 1,      -- Para tracking de cambios

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### generation_states
```sql
-- Estado de generación (para streaming, retry, resumable)
CREATE TABLE generation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL,

  -- Estado de progreso
  status TEXT,                    -- 'pending' | 'generating' | 'completed' | 'failed'
  current_day INTEGER,
  completed_days INTEGER[],       -- [1, 2, 3]
  pending_days INTEGER[],
  failed_days JSONB,              -- { dayNumber: errorMessage }
  retry_count INTEGER DEFAULT 0,

  -- Datos intermedios
  summary_result JSONB,           -- Resumen inicial generado
  places_context JSONB,           -- Lugares pre-fetched de Google
  full_places JSONB,              -- Cache completo de lugares
  preferences JSONB,              -- Preferencias del usuario

  -- Error handling
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### agent_conversations / agent_messages
```sql
-- Conversaciones del Travel Agent
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes del chat
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,             -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  tool_calls JSONB,               -- Herramientas ejecutadas por el AI
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### trip_things_to_do (Ideas Guardadas)
```sql
-- Lugares guardados por viaje (antes "saved_places")
CREATE TABLE trip_things_to_do (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,

  google_place_id TEXT NOT NULL,
  place_data JSONB NOT NULL,      -- Datos de Google Places
  category TEXT,                  -- 'attractions' | 'food_drink' | 'tours' | 'activities'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(trip_id, google_place_id)
);
```

### Tablas de Caché
```sql
-- Caché de direcciones/rutas
CREATE TABLE directions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  from_lat NUMERIC NOT NULL,
  from_lng NUMERIC NOT NULL,
  to_lat NUMERIC NOT NULL,
  to_lng NUMERIC NOT NULL,
  mode TEXT NOT NULL,             -- 'driving' | 'walking' | 'transit'
  travel_info JSONB NOT NULL,     -- { distance, duration, ... }
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caché de sugerencias de destino
CREATE TABLE destination_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  place_name TEXT NOT NULL,
  suggestions JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_request_logs
```sql
-- Logging de llamadas AI (para admin/debugging)
CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  trip_id UUID REFERENCES trips(id),
  user_id UUID,

  -- Request info
  endpoint TEXT NOT NULL,         -- '/api/ai/generate-day'
  provider TEXT NOT NULL,         -- 'anthropic' | 'openai'
  model TEXT,                     -- 'claude-3-5-sonnet'

  -- Métricas
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_cents NUMERIC,
  duration_ms INTEGER,

  -- Estado
  status TEXT NOT NULL,           -- 'success' | 'error'
  error_message TEXT,
  metadata JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Funciones SQL

```sql
-- Agregar actividad a un día específico
CREATE FUNCTION append_activity_to_day(
  p_activity JSONB,
  p_day_index INTEGER,
  p_trip_id UUID
) RETURNS void;

-- Actualizar día completo en el plan
CREATE FUNCTION update_day_in_plan(
  p_day_data JSONB,
  p_day_index INTEGER,
  p_trip_id UUID
) RETURNS void;

-- Actualizar metadata de un día
CREATE FUNCTION update_day_metadata(
  p_trip_id UUID,
  p_day_index INTEGER,
  p_title TEXT DEFAULT NULL,
  p_transport TEXT DEFAULT NULL,
  p_overnight TEXT DEFAULT NULL,
  p_meals JSONB DEFAULT NULL,
  p_important_notes JSONB DEFAULT NULL
) RETURNS void;
```

---

## TypeScript Types Principales

### GeneratedPlan (en `plans.data`)

```typescript
// src/types/plan.ts

interface GeneratedPlan {
  id: string
  createdAt: string
  updatedAt: string
  version: number

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

  // Itinerary (array of days)
  itinerary: ItineraryDay[]

  // Optional sections (loaded on demand)
  savedPlaces?: SavedPlace[]
  accommodations?: Accommodation[]
  flights?: FlightReservation[]
  budget?: BudgetBreakdown
  tips?: string[]
  warnings?: string[]
  documents?: DocumentItem[]
  packing?: PackingItem[]
}
```

### ItineraryDay

```typescript
interface ItineraryDay {
  day: number
  date: string               // ISO date
  title: string              // "Llegada + San José"
  subtitle?: string

  // Timeline (main content)
  timeline: TimelineEntry[]

  // Meals
  meals: MealPlan

  // Notes and logistics
  importantNotes: ImportantNote[]
  transport: string
  overnight: string
}
```

### TimelineEntry

```typescript
interface TimelineEntry {
  id: string
  time: string              // "6:00 AM"
  activity: string          // Brief name
  location: string
  icon?: string             // Emoji
  notes?: string
  durationMinutes?: number
  isFixedTime?: boolean
  travelToNext?: TravelInfo

  // Google Places linking
  placeId?: string
  placeData?: PlaceData
  matchConfidence?: 'exact' | 'high' | 'low' | 'none'
}
```

### ThingsToDoItem (Ideas Guardadas)

```typescript
// src/hooks/useThingsToDo.ts

interface ThingsToDoItem {
  id: string
  trip_id: string
  google_place_id: string
  place_data: {
    name: string
    formatted_address?: string
    rating?: number
    user_ratings_total?: number
    types?: string[]
    photos?: Array<{ photo_reference: string }>
    opening_hours?: { open_now?: boolean }
    price_level?: number
    geometry?: { location: { lat: number; lng: number } }
  }
  category: 'attractions' | 'food_drink' | 'tours' | 'activities' | null
  created_at: string
}
```

---

## Queries Comunes

### Obtener plan completo
```typescript
const { data: plan } = await supabase
  .from('plans')
  .select('*')
  .eq('trip_id', tripId)
  .single()

// El plan completo está en plan.data (JSONB)
const generatedPlan = plan.data as GeneratedPlan
```

### Guardar/actualizar plan
```typescript
await supabase
  .from('plans')
  .upsert({
    trip_id: tripId,
    user_id: userId,
    data: generatedPlan,
    version: (currentVersion || 0) + 1,
    updated_at: new Date().toISOString()
  })
```

### Obtener estado de generación
```typescript
const { data: state } = await supabase
  .from('generation_states')
  .select('*')
  .eq('trip_id', tripId)
  .maybeSingle() // Puede no existir
```

### Ideas guardadas de un viaje
```typescript
const { data: items } = await supabase
  .from('trip_things_to_do')
  .select('*')
  .eq('trip_id', tripId)
  .order('created_at', { ascending: false })
```

### Historial de chat
```typescript
// Obtener conversación con mensajes
const { data: conversation } = await supabase
  .from('agent_conversations')
  .select(`
    *,
    agent_messages (*)
  `)
  .eq('trip_id', tripId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

---

## Notas Importantes

### ⚠️ .single() vs .maybeSingle()

```typescript
// ✅ CORRECTO: Verificar si existe (puede no existir)
const { data } = await supabase
  .from('generation_states')
  .select('status')
  .eq('trip_id', tripId)
  .maybeSingle()  // Retorna null si no existe

// ❌ INCORRECTO: Esto lanza error 406 si no existe
const { data } = await supabase
  .from('generation_states')
  .select('status')
  .eq('trip_id', tripId)
  .single()  // ERROR si no hay filas
```

### RLS (Row Level Security)

Todas las tablas tienen RLS habilitado. Las policies aseguran que:
- Usuarios solo ven sus propios datos
- Las foreign keys a `trips` heredan el control de acceso

### Generación de Types

```bash
# Regenerar types desde Supabase
npx supabase gen types typescript --local > src/types/database.ts
```
