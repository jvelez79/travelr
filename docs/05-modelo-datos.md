# Modelo de Datos

## Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Modelo central | Activities (no phases) | Canvas muestra actividades en timeline, no fases |
| Google Places data | JSONB en activities | Datos variables por tipo de lugar |
| Multi-destino | Tabla destinations | Un viaje puede tener varios destinos |
| Lugares guardados | Tabla saved_places | Usuario puede reutilizar lugares entre viajes |
| Chat AI | Tabla messages | Contexto para AI agents |

---

## Diagrama ER

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   profiles  │       │    trips    │       │ destinations │
├─────────────┤       ├─────────────┤       ├──────────────┤
│ id (PK)     │──────<│ id (PK)     │──────<│ id (PK)      │
│ display_name│       │ user_id(FK) │       │ trip_id (FK) │
│ default_orig│       │ title       │       │ name         │
└─────────────┘       │ status      │       │ location     │
                      │ mode        │       │ days_start   │
                      │ style       │       │ days_end     │
                      │ budget_level│       │ order        │
                      │ travelers   │       └──────────────┘
                      │ start_date  │              │
                      │ end_date    │              │
                      └─────────────┘              │
                             │                     │
                             │                     ▼
                             │              ┌──────────────┐
                             │              │  activities  │
                             │              ├──────────────┤
                             ├─────────────<│ id (PK)      │
                             │              │ trip_id (FK) │
                             │              │ dest_id (FK) │
                             │              │ title        │
                             │              │ type         │
                             │              │ date         │
                             │              │ time_start   │
                             │              │ time_end     │
                             │              │ status       │
                             │              │ source       │
                             │              │ google_place │
                             │              │ google_data  │
                             │              └──────────────┘
                             │
                             ├─────────────<┌──────────────┐
                             │              │   messages   │
                             │              ├──────────────┤
                             │              │ id (PK)      │
                             │              │ trip_id (FK) │
                             │              │ role         │
                             │              │ content      │
                             │              │ context      │
                             │              └──────────────┘
                             │
┌─────────────┐              │
│saved_places │              │
├─────────────┤              │
│ id (PK)     │              │
│ user_id(FK) │──────────────┘
│ google_place│
│ google_data │
│ name        │
│ notes       │
└─────────────┘
```

---

## Tablas SQL

### profiles
```sql
-- Extiende Supabase Auth con datos del usuario
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_origin TEXT,         -- Ciudad de origen por defecto
  preferences JSONB DEFAULT '{}',  -- Preferencias generales
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);
```

### trips
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Info básica
  title TEXT,                    -- "Viaje a Roma" (puede ser generado)
  origin TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  travelers INTEGER DEFAULT 1 CHECK (travelers > 0),

  -- Configuración del viaje
  mode TEXT DEFAULT 'assisted' CHECK (mode IN ('assisted', 'manual')),
  style TEXT DEFAULT 'balanced' CHECK (style IN ('relax', 'balanced', 'adventure')),
  budget_level TEXT DEFAULT 'mid' CHECK (budget_level IN ('budget', 'mid', 'premium')),

  -- Estado
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'ready', 'completed', 'archived')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own trips"
  ON trips FOR ALL
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
```

### destinations
```sql
-- Soporta viajes multi-destino (Roma -> Florencia -> Venecia)
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,

  -- Ubicación
  name TEXT NOT NULL,           -- "Roma"
  location JSONB,               -- { lat: 41.9028, lng: 12.4964 }
  google_place_id TEXT,         -- Para referenciar en Google Places

  -- Período en el viaje
  days_start INTEGER NOT NULL,  -- Día 1
  days_end INTEGER NOT NULL,    -- Día 3
  order_index INTEGER DEFAULT 0, -- Para ordenar destinos

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD destinations of own trips"
  ON destinations FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX idx_destinations_trip_id ON destinations(trip_id);
```

### activities
```sql
-- El corazón del canvas: cada bloque en el timeline
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,

  -- Info básica
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'flight', 'hotel', 'restaurant', 'attraction',
    'tour', 'transport', 'entertainment', 'nature',
    'photo_spot', 'custom', 'free_time'
  )),

  -- Tiempo
  date DATE NOT NULL,
  time_start TIME,              -- NULL = todo el día
  time_end TIME,
  duration_minutes INTEGER,     -- Duración estimada

  -- Ubicación
  address TEXT,
  location JSONB,               -- { lat, lng }

  -- Google Places (si viene de GP)
  google_place_id TEXT,
  google_data JSONB,            -- Datos completos de Google Places

  -- Estado y origen
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'confirmed', 'pending', 'conflict'
  )),
  source TEXT DEFAULT 'manual' CHECK (source IN (
    'google_places', 'ai_suggestion', 'manual'
  )),

  -- AI metadata
  ai_reasoning TEXT,            -- Por qué la AI lo sugirió
  ai_fit_score DECIMAL(3,2),    -- 0.00 - 1.00

  -- Info adicional
  cost_estimate DECIMAL(10,2),
  notes TEXT,
  booking_url TEXT,
  booking_confirmation TEXT,

  -- Orden dentro del día
  order_index INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD activities of own trips"
  ON activities FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX idx_activities_trip_id ON activities(trip_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_destination ON activities(destination_id);
CREATE INDEX idx_activities_type ON activities(type);
```

### saved_places
```sql
-- Biblioteca personal de lugares del usuario
CREATE TABLE saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Google Places
  google_place_id TEXT NOT NULL,
  google_data JSONB NOT NULL,   -- Datos cacheados de Google

  -- Personalización del usuario
  name TEXT NOT NULL,           -- Puede ser diferente al nombre de GP
  notes TEXT,
  tags TEXT[],                  -- ["museos", "roma", "favoritos"]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own saved places"
  ON saved_places FOR ALL
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_saved_places_user ON saved_places(user_id);
CREATE INDEX idx_saved_places_google ON saved_places(google_place_id);
```

### messages
```sql
-- Chat con AI para contexto
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,

  -- Mensaje
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Contexto (qué agent/acción generó el mensaje)
  context TEXT,                 -- 'architect', 'curator', 'optimizer', 'general'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD messages of own trips"
  ON messages FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX idx_messages_trip_id ON messages(trip_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

---

## JSON Schemas

### google_data (en activities y saved_places)
```typescript
interface GooglePlaceData {
  // Identificación
  place_id: string;
  name: string;
  types: string[];              // ["museum", "tourist_attraction"]

  // Ubicación
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };

  // Contacto
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;

  // Operación
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };

  // Valoración
  rating?: number;              // 4.5
  user_ratings_total?: number;  // 12500

  // Fotos
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;

  // Precio
  price_level?: number;         // 0-4

  // Metadata
  fetched_at: string;           // ISO timestamp para saber antigüedad del cache
}
```

### location (en destinations y activities)
```typescript
interface Location {
  lat: number;
  lng: number;
}
```

### preferences (en profiles)
```typescript
interface UserPreferences {
  interests?: string[];         // ["history", "food", "art"]
  default_style?: 'relax' | 'balanced' | 'adventure';
  default_budget?: 'budget' | 'mid' | 'premium';
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
}
```

---

## TypeScript Types

### Core Types

```typescript
// types/database.ts

export type TripStatus = 'draft' | 'planning' | 'ready' | 'completed' | 'archived';
export type TripMode = 'assisted' | 'manual';
export type TripStyle = 'relax' | 'balanced' | 'adventure';
export type BudgetLevel = 'budget' | 'mid' | 'premium';

export type ActivityType =
  | 'flight' | 'hotel' | 'restaurant' | 'attraction'
  | 'tour' | 'transport' | 'entertainment' | 'nature'
  | 'photo_spot' | 'custom' | 'free_time';

export type ActivityStatus = 'confirmed' | 'pending' | 'conflict';
export type ActivitySource = 'google_places' | 'ai_suggestion' | 'manual';

export interface Trip {
  id: string;
  user_id: string;
  title?: string;
  origin: string;
  start_date?: string;
  end_date?: string;
  travelers: number;
  mode: TripMode;
  style: TripStyle;
  budget_level: BudgetLevel;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  trip_id: string;
  name: string;
  location?: { lat: number; lng: number };
  google_place_id?: string;
  days_start: number;
  days_end: number;
  order_index: number;
  created_at: string;
}

export interface Activity {
  id: string;
  trip_id: string;
  destination_id?: string;
  title: string;
  type: ActivityType;
  date: string;
  time_start?: string;
  time_end?: string;
  duration_minutes?: number;
  address?: string;
  location?: { lat: number; lng: number };
  google_place_id?: string;
  google_data?: GooglePlaceData;
  status: ActivityStatus;
  source: ActivitySource;
  ai_reasoning?: string;
  ai_fit_score?: number;
  cost_estimate?: number;
  notes?: string;
  booking_url?: string;
  booking_confirmation?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  google_place_id: string;
  google_data: GooglePlaceData;
  name: string;
  notes?: string;
  tags?: string[];
  created_at: string;
}

export interface Message {
  id: string;
  trip_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context?: string;
  created_at: string;
}
```

### Canvas-specific Types

```typescript
// types/canvas.ts

export interface CanvasDay {
  date: string;
  day_number: number;
  title?: string;               // "Llegada y exploración"
  destination?: Destination;
  activities: Activity[];
  free_blocks: TimeBlock[];     // Bloques vacíos calculados
}

export interface TimeBlock {
  start: string;                // "15:00"
  end: string;                  // "19:00"
  duration_hours: number;
}

export interface CanvasState {
  trip: Trip;
  destinations: Destination[];
  days: CanvasDay[];
  selectedActivity?: Activity;
  selectedBlock?: TimeBlock;
  rightPanelState: 'empty' | 'activity_details' | 'search_results' | 'ai_recommendations';
}
```

---

## Queries Comunes

### Obtener viaje completo para canvas
```typescript
const { data: trip } = await supabase
  .from('trips')
  .select(`
    *,
    destinations (
      *
    ),
    activities (
      *
    )
  `)
  .eq('id', tripId)
  .single();

// Ordenar por fecha y hora
const activities = trip.activities.sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return (a.time_start || '00:00').localeCompare(b.time_start || '00:00');
});
```

### Agregar actividad desde Google Places
```typescript
const newActivity = await supabase
  .from('activities')
  .insert({
    trip_id: tripId,
    destination_id: destinationId,
    title: googlePlace.name,
    type: mapGoogleTypeToActivityType(googlePlace.types),
    date: selectedDate,
    time_start: blockStart,
    time_end: calculateEndTime(blockStart, estimatedDuration),
    duration_minutes: estimatedDuration,
    address: googlePlace.formatted_address,
    location: googlePlace.geometry.location,
    google_place_id: googlePlace.place_id,
    google_data: googlePlace,
    status: 'pending',
    source: 'google_places'
  })
  .select()
  .single();
```

### Obtener actividades de un día
```typescript
const { data: activities } = await supabase
  .from('activities')
  .select('*')
  .eq('trip_id', tripId)
  .eq('date', date)
  .order('time_start', { ascending: true });
```

### Guardar lugar en biblioteca personal
```typescript
const { data: savedPlace } = await supabase
  .from('saved_places')
  .insert({
    user_id: userId,
    google_place_id: place.place_id,
    google_data: place,
    name: place.name,
    notes: userNotes,
    tags: ['roma', 'museos']
  })
  .select()
  .single();
```

### Obtener lugares guardados del usuario
```typescript
const { data: savedPlaces } = await supabase
  .from('saved_places')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Filtrar por tags
const museos = savedPlaces.filter(p => p.tags?.includes('museos'));
```

---

## Migraciones

### Crear schema inicial
```bash
# Crear migración
npx supabase migration new create_canvas_schema

# El archivo generado en supabase/migrations/ contendrá el SQL de arriba

# Aplicar migraciones
npx supabase db push

# Generar types
npx supabase gen types typescript --local > src/types/database.ts
```

### Migrar datos existentes (si aplica)
```sql
-- Si hay datos del modelo anterior (phases), migrar a activities
-- Este script es conceptual, ajustar según datos reales

INSERT INTO activities (trip_id, title, type, date, time_start, time_end, source)
SELECT
  p.trip_id,
  a.title,
  a.type,
  a.date,
  a.time_start,
  a.time_end,
  'manual'
FROM phases p
CROSS JOIN LATERAL jsonb_to_recordset(p.data->'activities') AS a(...)
WHERE p.type = 'itinerary';
```

---

## Iconos por Tipo de Actividad

Para referencia en el UI:

| Tipo | Icono | Descripción |
|------|-------|-------------|
| flight | ✈️ | Vuelos |
| hotel | 🏨 | Alojamiento |
| restaurant | 🍽️ | Comida |
| attraction | 🏛️ | Atracciones/Museos |
| tour | 🎫 | Tours guiados |
| transport | 🚗 | Transporte |
| entertainment | 🎭 | Entretenimiento |
| nature | 🌲 | Naturaleza/Outdoor |
| photo_spot | 📸 | Miradores/Fotos |
| custom | 👤 | Evento personalizado |
| free_time | ⏰ | Tiempo libre |
