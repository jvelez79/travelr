# Feature: Explore (Descubrimiento de Destinos)

**Estado: COMPLETADO** | Implementado: 2025-12-04

## Descripción

Feature similar a Wanderlog que permite a los usuarios descubrir destinos, explorar lugares por categoría (restaurantes, atracciones, etc.), verlos en un mapa interactivo, y añadirlos directamente al timeline de sus viajes en el canvas.

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/explore` | Landing con búsqueda y destinos populares |
| `/explore/[destination]` | Detalle del destino con lugares y mapa |

---

## Arquitectura

### Estructura de Archivos

```
app/src/
├── app/
│   ├── explore/
│   │   ├── page.tsx                    # Landing de exploración
│   │   └── [destination]/
│   │       ├── page.tsx                # Detalle del destino
│   │       └── loading.tsx             # Skeleton de carga
│   └── api/explore/
│       ├── destinations/route.ts       # API: autocomplete, populares
│       └── places/route.ts             # API: lugares por categoría
├── components/explore/
│   ├── PlaceMap.tsx                    # Mapa Google Maps
│   └── AddToTripModal.tsx              # Modal añadir a viaje
├── lib/explore/
│   ├── index.ts                        # Exports
│   ├── google-places.ts                # Cliente Google Places API
│   └── hooks.ts                        # React hooks
└── types/
    └── explore.ts                      # Tipos TypeScript
```

### Tipos Principales

```typescript
type PlaceCategory = 'restaurants' | 'attractions' | 'cafes' | 'bars' | 'museums' | 'nature'

interface Place {
  id: string
  name: string
  category: PlaceCategory
  subcategory?: string
  location: Coordinates & { address?: string; city: string; country: string }
  rating?: number
  reviewCount?: number
  priceLevel?: 1 | 2 | 3 | 4
  images: string[]
  // Google Places data
  google_place_id?: string
  opening_hours?: OpeningHours
}

interface Destination {
  id: string               // Slug: "la-fortuna-costa-rica"
  name: string             // "La Fortuna"
  fullName: string         // "La Fortuna, Costa Rica"
  country: string
  location: Coordinates
  categories: PlaceCategory[]
}
```

---

## Componentes

### PlaceMap

Mapa interactivo con Google Maps que muestra markers de lugares.

```tsx
<PlaceMap
  places={filteredPlaces}
  center={destination.location}
  selectedPlaceId={selectedPlace?.id}
  onPlaceSelect={(id) => scrollToPlace(id)}
/>
```

**Características:**
- Markers con colores por categoría
- InfoWindow con detalles al hacer click
- Estados: loading, error, sin API key
- Responsive (oculto en mobile)

### AddToTripModal

Modal para añadir un lugar a un viaje existente, seleccionando día y hora en el timeline.

```tsx
<AddToTripModal
  place={selectedPlace}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onAddToTrip={handleAddToTrip}
/>
```

**Características:**
- Lista viajes del usuario desde Supabase
- Selección de viaje con dropdown
- Selector de día y bloque de tiempo
- Preview de conflictos si el bloque está ocupado
- Crea Activity con `source: 'explore'`

---

## Integración con Canvas

### Flujo: Explore → Canvas

```
Usuario en /explore/[destination]
       ↓
Click "Añadir a viaje" en una Place card
       ↓
AddToTripModal:
  1. Seleccionar viaje existente (o crear nuevo)
  2. Seleccionar día del viaje
  3. Seleccionar bloque de tiempo disponible
       ↓
Crear Activity:
  - google_place_id: place.id
  - google_data: { ...place }
  - source: 'explore'
  - status: 'pending'
       ↓
Redirigir a /trips/[id] (canvas)
Panel derecho muestra detalles de la actividad recién agregada
```

### Transformación Place → Activity

```typescript
// lib/explore/transforms.ts
export function placeToActivity(
  place: Place,
  tripId: string,
  date: string,
  timeStart: string,
  timeEnd: string
): Omit<Activity, 'id'> {
  return {
    trip_id: tripId,
    title: place.name,
    type: mapCategoryToActivityType(place.category),
    date,
    time_start: timeStart,
    time_end: timeEnd,
    google_place_id: place.id,
    google_data: {
      name: place.name,
      rating: place.rating,
      reviews_count: place.reviewCount,
      price_level: place.priceLevel,
      photos: place.images,
      location: place.location,
      opening_hours: place.opening_hours,
    },
    status: 'pending',
    source: 'explore',
    notes: null,
    ai_reasoning: null,
  };
}

function mapCategoryToActivityType(category: PlaceCategory): ActivityType {
  const mapping: Record<PlaceCategory, ActivityType> = {
    restaurants: 'food',
    cafes: 'food',
    bars: 'food',
    attractions: 'activity',
    museums: 'activity',
    nature: 'activity',
  };
  return mapping[category];
}
```

### Integración con Curator Agent

El Curator Agent puede usar lugares explorados como contexto:

```typescript
// Cuando el usuario pide ideas para un bloque
// El Curator considera lugares ya explorados por el usuario

interface CuratorInput {
  // ...otros campos
  explored_places?: string[];  // IDs de lugares que el usuario vio en Explore
}

// En el prompt del Curator:
// "El usuario ha estado explorando estos lugares: [lista]
//  Considera si alguno encaja en este bloque de tiempo."
```

---

## API Routes

### GET /api/explore/places

Buscar lugares por categoría en un destino.

**Query params:**
- `destination` (string) - Nombre del destino
- `category` (PlaceCategory) - Categoría a buscar
- `lat`, `lng` (number) - Coordenadas del destino
- `placeId` (string, opcional) - Obtener detalles de un lugar

**Response:**
```json
{
  "places": [Place],
  "count": 20,
  "destination": "La Fortuna",
  "category": "restaurants"
}
```

### GET /api/explore/destinations

Autocomplete de destinos o lista de populares.

**Query params:**
- `q` (string, opcional) - Query de búsqueda
- `placeId` (string, opcional) - Obtener info de destino

**Response:**
```json
{
  "suggestions": [
    { "placeId": "xxx", "description": "París, Francia", "mainText": "París" }
  ]
}
```

---

## Google Places API

### Cliente (`lib/explore/google-places.ts`)

```typescript
// Buscar lugares por categoría
const places = await searchPlacesByCategory(
  "La Fortuna",
  "restaurants",
  { lat: 10.4678, lng: -84.6427 }
)

// Obtener detalles de un lugar
const place = await getPlaceDetails("ChIJ...")

// Autocomplete de destinos
const suggestions = await autocompleteDestination("Par")
```

### Variables de Entorno

```env
# .env.local
GOOGLE_PLACES_API_KEY=xxx           # Server-side (Places API)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx # Client-side (Maps JS API)
```

Ver [09-google-places.md](09-google-places.md) para documentación completa de la integración.

---

## Hooks

### usePlaces

```typescript
const { places, isLoading, error, refetch } = usePlaces({
  destination: "La Fortuna",
  location: { lat: 10.4678, lng: -84.6427 },
  category: "restaurants",
  enabled: true,
})
```

### useDestinationSearch

```typescript
const { suggestions, isLoading, search } = useDestinationSearch()
search("París") // Dispara búsqueda
```

### useAddToTrip

```typescript
const { addToTrip, isAdding, error } = useAddToTrip()

await addToTrip({
  place: selectedPlace,
  tripId: 'trip-123',
  date: '2024-03-15',
  timeStart: '10:00',
  timeEnd: '12:00',
})
// Redirige al canvas automáticamente
```

---

## UI/UX

### Categorías

| ID | Label | Color (marker) |
|----|-------|----------------|
| restaurants | Restaurantes | #B45309 (Terracotta) |
| attractions | Atracciones | #0D9488 (Teal) |
| cafes | Cafés | #92400E (Amber) |
| bars | Bares | #7C3AED (Purple) |
| museums | Museos | #1D4ED8 (Blue) |
| nature | Naturaleza | #059669 (Green) |

### Layout Desktop

```
+------------------------------------------------+
| Nav: [Logo] [Explorar] [Mis Viajes] [Nuevo]    |
+------------------------------------------------+
| [         Hero del Destino (imagen)          ] |
+------------------------------------------------+
| [Atracciones] [Naturaleza] [Restaurantes] ...  |
+------------------------------------------------+
| +-------------------------+ +----------------+ |
| | Grid de Places (2 col)  | | Mapa (sticky)  | |
| |                         | |                | |
| | [Card: Place 1]         | |    [Markers]   | |
| |   ├─ Foto, nombre       | |                | |
| |   ├─ Rating, reviews    | |                | |
| |   └─ [+ Añadir a viaje] | |                | |
| |                         | |                | |
| +-------------------------+ +----------------+ |
+------------------------------------------------+
```

### Layout Mobile

- Mapa oculto (solo lista de cards)
- Tabs de categorías con scroll horizontal
- Cards full-width
- Botón flotante "Ver en mapa"

### AddToTripModal (Actualizado)

```
┌─────────────────────────────────────────┐
│  Añadir a viaje                    [X]  │
├─────────────────────────────────────────┤
│  [Foto del lugar]                       │
│  Volcán Arenal                          │
│  ★ 4.8 (2,340 reviews)                  │
├─────────────────────────────────────────┤
│  Seleccionar viaje:                     │
│  ┌───────────────────────────────────┐  │
│  │ Costa Rica Marzo 2024         ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Seleccionar día:                       │
│  ┌───────────────────────────────────┐  │
│  │ Día 2 - Mar 16 (La Fortuna)   ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Seleccionar hora:                      │
│  ┌───────────────────────────────────┐  │
│  │ 09:00 - 12:00 (Disponible)    ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⚠️ Este bloque tiene otra actividad   │
│     (Desayuno). ¿Reemplazar?            │
│                                         │
├─────────────────────────────────────────┤
│  [Cancelar]          [Añadir al viaje]  │
└─────────────────────────────────────────┘
```

---

## Datos Mock

Para desarrollo sin API key, se incluyen datos mock:

**6 Destinos populares:**
- La Fortuna, Costa Rica
- Barcelona, España
- Tokio, Japón
- Cusco, Perú
- París, Francia
- Cartagena, Colombia

**12 Lugares en La Fortuna:**
- 3 Atracciones (Catarata, Volcán, Puentes)
- 3 Naturaleza (Parque, Río Celeste, Cerro)
- 3 Restaurantes (Don Rufino, Nene's, Soda)
- 2 Cafés
- 1 Bar

---

## Dependencias

```json
{
  "@react-google-maps/api": "^2.x"
}
```

Componentes shadcn:
- `dialog` - Para AddToTripModal
- `select` - Para selectores de viaje/día/hora
- `alert` - Para advertencias de conflicto

---

## Conexión con Otras Features

### → Canvas (`/trips/[id]`)
- AddToTripModal crea Activities y redirige al canvas
- Activity creada aparece en el timeline del día seleccionado
- Panel derecho muestra detalles con datos de Google Places

### → Curator Agent
- Lugares explorados se pueden usar como contexto
- "El usuario mostró interés en [lugar]" como señal

### → Saved Places (futuro)
- Guardar lugares en biblioteca personal sin añadir a viaje
- Acceder desde cualquier viaje futuro

---

## Roadmap v2

- [ ] Reviews de usuarios propios
- [ ] Sistema de favoritos / Saved Places
- [ ] Filtros avanzados (precio, rating, distancia, horario)
- [ ] Galería de fotos expandida
- [ ] Integración con hospedaje
- [ ] Guías de viaje destacadas
- [ ] Compartir lugar en redes sociales
- [ ] Modo offline (PWA)
