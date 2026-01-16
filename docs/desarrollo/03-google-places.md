# Integración Google Places

## Descripción

Google Places API es el motor de datos de Travelr. Proporciona información de lugares (restaurantes, atracciones, hoteles, etc.) que se usa para:
- Auto-llenar actividades en el canvas
- Descubrimiento curado de lugares
- Ideas guardadas
- Enriquecimiento del itinerario

---

## APIs Utilizadas

| API | Uso | Costo |
|-----|-----|-------|
| Places API (New) | Búsqueda de lugares, detalles, fotos | Por request |
| Maps JavaScript API | Mapas embebidos en frontend | Por carga de mapa |
| Distance Matrix API | Tiempos de traslado entre puntos | Por elemento |

---

## Configuración

### Google Cloud Console

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar APIs:
   - Places API (New)
   - Maps JavaScript API
   - Distance Matrix API
3. Crear credenciales:
   - **API Key Server** (restringida por IP)
   - **API Key Client** (restringida por dominio/referrer)

### Variables de Entorno

```env
# .env.local

# Server-side (NO exponer al cliente)
# Restringir por IP en producción
GOOGLE_PLACES_API_KEY=AIza...

# Client-side (para Maps JavaScript)
# Restringir por dominio: localhost, tu-dominio.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

---

## Categorías Soportadas

El sistema soporta **12+ categorías** que se mapean a tipos de Google Places:

```typescript
// lib/explore/google-places.ts

type PlaceCategory =
  | 'attractions'
  | 'nature'
  | 'restaurants'
  | 'cafes'
  | 'bars'
  | 'museums'
  | 'landmarks'
  | 'beaches'
  | 'religious'
  | 'markets'
  | 'viewpoints'
  | 'wellness';

// Mapeo a tipos de Google Places
const CATEGORY_MAPPINGS: Record<PlaceCategory, string[]> = {
  attractions: [
    'tourist_attraction',
    'amusement_park',
    'aquarium',
    'zoo',
    'theme_park',
    // ... más tipos
  ],
  nature: [
    'park',
    'national_park',
    'hiking_area',
    'campground',
    'natural_feature',
  ],
  restaurants: [
    'restaurant',
    'meal_takeaway',
    'meal_delivery',
    // + tipos por cocina: italian_restaurant, mexican_restaurant, etc.
    // + tipos por dietary: vegan_restaurant, vegetarian_restaurant
  ],
  cafes: ['cafe', 'coffee_shop', 'bakery'],
  bars: ['bar', 'night_club', 'wine_bar'],
  museums: ['museum', 'art_gallery'],
  landmarks: ['point_of_interest', 'historical_landmark', 'monument'],
  beaches: ['beach'],
  religious: ['church', 'mosque', 'synagogue', 'hindu_temple', 'buddhist_temple'],
  markets: ['market', 'supermarket', 'grocery_store', 'shopping_mall'],
  viewpoints: ['scenic_viewpoint', 'observation_deck'],
  wellness: ['spa', 'gym', 'yoga_studio'],
};
```

---

## Componentes de UI

### ExploreModal

Modal principal para explorar y agregar lugares.

```
┌─────────────────────────────────────────────────┐
│  Explorar [Destino]                         ✕   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [🏛️ Atracciones] [🌲 Naturaleza] [🍽️ Comida]  │
│  [☕ Cafés] [🍺 Bares] [🏛️ Museos] ...          │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │  Place  │  │  Place  │  │  Place  │         │
│  │  Card   │  │  Card   │  │  Card   │         │
│  │         │  │         │  │         │         │
│  │  ⭐4.5  │  │  ⭐4.8  │  │  ⭐4.2  │         │
│  │ [+Idea] │  │ [+Idea] │  │ [+Idea] │         │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                 │
│  [Mapa]                                         │
└─────────────────────────────────────────────────┘
```

**Ubicación:** `components/explore/ExploreModal.tsx`

### PlaceDetailPanel

Panel lateral con detalles completos del lugar.

```
┌─────────────────────────┐
│  [Foto del lugar]       │
├─────────────────────────┤
│  Nombre del Lugar       │
│  ⭐ 4.7 (1,234 reviews) │
│  💰💰 Moderado          │
├─────────────────────────┤
│  📍 Dirección completa  │
│  📞 +1 234 567 8900     │
│  🌐 website.com         │
├─────────────────────────┤
│  Horarios:              │
│  Lun-Vie: 9AM - 5PM     │
│  Sáb-Dom: 10AM - 6PM    │
├─────────────────────────┤
│  [+ Agregar a Ideas]    │
│  [+ Agregar al Día X]   │
│  [🗺️ Ver en Maps]       │
└─────────────────────────┘
```

**Ubicación:** `components/explore/PlaceDetailPanel.tsx`

### PlaceGrid / PlaceCard

Grid de lugares con cards individuales.

**Ubicación:** `components/explore/PlaceGrid.tsx`, `PlaceCard.tsx`

### CuratedDiscoveryView

Vista de descubrimiento personalizado con recomendaciones AI.

**Ubicación:** `components/explore/CuratedDiscoveryView.tsx`

### ExploreMap

Mapa con marcadores de lugares.

**Ubicación:** `components/explore/ExploreMap.tsx`

---

## API Routes

### Búsqueda de Lugares

```typescript
// POST /api/places/search

interface SearchInput {
  query?: string;
  category: PlaceCategory;
  destination: string;
  coordinates?: { lat: number; lng: number };
  radius?: number; // metros, default 20000
}

interface SearchOutput {
  places: Place[];
  nextPageToken?: string;
}
```

### Detalles de Lugar

```typescript
// GET /api/places/details?placeId=xxx

interface DetailsOutput {
  place: PlaceDetails;
}
```

### Fotos

```typescript
// GET /api/places/photos?photoReference=xxx&maxWidth=400

// Retorna la imagen directamente o URL
```

---

## Flujo de Datos

```
Usuario abre Explorar
       ↓
Selecciona categoría (ej: "Restaurants")
       ↓
Frontend: POST /api/ai/curated-discovery
       ↓
Backend:
  1. Busca en Google Places por categoría
  2. AI ordena por relevancia + preferencias
  3. Enriquece con datos adicionales
       ↓
Retorna lista de lugares ordenados
       ↓
Usuario selecciona lugar
       ↓
Frontend: GET /api/places/details
       ↓
Muestra PlaceDetailPanel
       ↓
Usuario puede:
  • Guardar en Ideas (trip_things_to_do)
  • Agregar al día (update plan)
```

---

## Caching

### Estrategia

| Dato | TTL | Storage |
|------|-----|---------|
| Búsquedas | 1 hora | `destination_suggestions` |
| Detalles | 24 horas | En memoria / Supabase |
| Fotos | 7 días | CDN |
| Direcciones | 7 días | `directions_cache` |

### Implementación

```typescript
// Caché en Supabase
const { data: cached } = await supabase
  .from('destination_suggestions')
  .select('suggestions')
  .eq('cache_key', `${destination}:${category}`)
  .gt('expires_at', new Date().toISOString())
  .maybeSingle();

if (cached) {
  return cached.suggestions;
}

// Fetch y guardar
const results = await fetchFromGooglePlaces(params);
await supabase.from('destination_suggestions').upsert({
  cache_key: `${destination}:${category}`,
  place_name: destination,
  suggestions: results,
  expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
});
```

---

## Place Data Structure

### Place (Búsqueda)

```typescript
interface Place {
  id: string;              // Google Place ID
  name: string;
  category: PlaceCategory;
  rating?: number;
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  images?: string[];       // URLs de fotos
  openingHours?: string[];
}
```

### PlaceDetails (Completo)

```typescript
interface PlaceDetails extends Place {
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  editorialSummary?: string;
  accessibility?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleParking?: boolean;
  };
  servingOptions?: {
    dineIn?: boolean;
    takeout?: boolean;
    delivery?: boolean;
  };
}
```

---

## Hooks

### useCuratedDiscovery

```typescript
// hooks/useCuratedDiscovery.ts

function useCuratedDiscovery(destination: string, category: PlaceCategory) {
  return {
    places: Place[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => void;
  };
}
```

### usePlacePhotos

```typescript
// hooks/usePlacePhotos.ts

function usePlacePhotos(photoReferences: string[]) {
  return {
    photos: string[]; // URLs
    isLoading: boolean;
  };
}
```

---

## Costos y Optimización

### Costos Aproximados

| API | Costo (USD) |
|-----|-------------|
| Text Search | $0.032/request |
| Nearby Search | $0.032/request |
| Place Details | $0.017/request |
| Place Photos | $0.007/request |
| Distance Matrix | $0.005/element |

### Optimización

1. **Caching agresivo** - Reducir requests repetidos
2. **Field masks** - Solo pedir campos necesarios
3. **Batch requests** - Agrupar cuando sea posible
4. **Pre-fetch** - Cargar datos en background durante generación

---

## Troubleshooting

### "OVER_QUERY_LIMIT"
- Verificar cuota en Google Cloud Console
- Implementar retry con backoff

### "REQUEST_DENIED"
- Verificar API key
- Verificar que APIs estén habilitadas
- Verificar restricciones de la key

### Fotos no cargan
- Verificar photo_reference es válido
- Verificar que Places API está habilitada
- Usar URL completa con API key

### Resultados vacíos
- Ampliar radio de búsqueda
- Verificar que la categoría mapea a tipos válidos
- Verificar que el destino tiene coordenadas válidas
