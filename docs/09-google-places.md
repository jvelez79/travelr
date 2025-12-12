# Integración Google Places

## Descripción

Google Places API es el motor de datos de Travelr. Proporciona información de lugares (restaurantes, atracciones, hoteles, etc.) que se usa para auto-llenar actividades en el canvas, eliminando la entrada manual de datos.

---

## APIs Utilizadas

| API | Uso | Costo |
|-----|-----|-------|
| Places API (New) | Búsqueda de lugares, detalles, fotos | Por request |
| Maps JavaScript API | Mapas embebidos en frontend | Por carga de mapa |
| Distance Matrix API | Tiempos de traslado entre puntos | Por elemento |
| Directions API | Rutas entre actividades (futuro) | Por request |

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

### Restricciones Recomendadas

**API Key Server:**
- Application restrictions: IP addresses
- API restrictions: Places API (New), Distance Matrix API

**API Key Client:**
- Application restrictions: HTTP referrers
- Referrers: `localhost:*`, `*.tu-dominio.com/*`
- API restrictions: Maps JavaScript API

---

## Endpoints Utilizados

### 1. Text Search (Búsqueda por texto)

Buscar lugares por query (ej. "museos en Roma").

```typescript
// POST https://places.googleapis.com/v1/places:searchText

const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.location,places.photos,places.regularOpeningHours'
  },
  body: JSON.stringify({
    textQuery: 'museos',
    locationBias: {
      circle: {
        center: { latitude: 41.9028, longitude: 12.4964 },
        radius: 5000.0
      }
    },
    maxResultCount: 20
  })
});
```

### 2. Nearby Search (Búsqueda por cercanía)

Buscar lugares cerca de una ubicación, filtrado por tipo.

```typescript
// POST https://places.googleapis.com/v1/places:searchNearby

const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.location'
  },
  body: JSON.stringify({
    locationRestriction: {
      circle: {
        center: { latitude: 41.9028, longitude: 12.4964 },
        radius: 5000.0
      }
    },
    includedTypes: ['restaurant', 'museum', 'tourist_attraction'],
    maxResultCount: 20
  })
});
```

### 3. Place Details

Obtener información completa de un lugar específico.

```typescript
// GET https://places.googleapis.com/v1/places/{placeId}

const response = await fetch(
  `https://places.googleapis.com/v1/places/${placeId}`,
  {
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,priceLevel,formattedAddress,location,photos,regularOpeningHours,websiteUri,nationalPhoneNumber,googleMapsUri,reviews'
    }
  }
);
```

### 4. Place Photos

Obtener URL de foto de un lugar.

```typescript
// GET https://places.googleapis.com/v1/{photoReference}/media

const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_PLACES_API_KEY}`;
```

### 5. Distance Matrix (Tiempos de traslado)

Calcular tiempos de viaje entre puntos.

```typescript
// GET https://maps.googleapis.com/maps/api/distancematrix/json

const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
url.searchParams.set('origins', '41.9028,12.4964');
url.searchParams.set('destinations', '41.9029,12.4534|41.8902,12.4922');
url.searchParams.set('mode', 'walking');
url.searchParams.set('key', GOOGLE_PLACES_API_KEY);

const response = await fetch(url);
```

---

## Implementación

### Cliente Places (`lib/google/places.ts`)

```typescript
// lib/google/places.ts

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

interface SearchPlacesParams {
  query?: string;
  location: { lat: number; lng: number };
  radius?: number;
  types?: string[];
  maxResults?: number;
}

export async function searchPlaces(params: SearchPlacesParams): Promise<Place[]> {
  const { query, location, radius = 5000, types, maxResults = 20 } = params;

  // Usar Text Search si hay query, sino Nearby Search
  const endpoint = query
    ? `${PLACES_API_BASE}/places:searchText`
    : `${PLACES_API_BASE}/places:searchNearby`;

  const body = query
    ? {
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: location.lat, longitude: location.lng },
            radius: radius
          }
        },
        maxResultCount: maxResults
      }
    : {
        locationRestriction: {
          circle: {
            center: { latitude: location.lat, longitude: location.lng },
            radius: radius
          }
        },
        includedTypes: types || ['restaurant', 'tourist_attraction', 'museum'],
        maxResultCount: maxResults
      };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
      'X-Goog-FieldMask': PLACE_FIELDS.join(',')
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Places API error: ${response.status}`);
  }

  const data = await response.json();
  return data.places?.map(transformGooglePlace) || [];
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const response = await fetch(
    `${PLACES_API_BASE}/places/${placeId}`,
    {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask': PLACE_DETAIL_FIELDS.join(',')
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Place Details error: ${response.status}`);
  }

  const data = await response.json();
  return transformGooglePlaceDetails(data);
}

// Field masks para optimizar costos
const PLACE_FIELDS = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.location',
  'places.photos'
];

const PLACE_DETAIL_FIELDS = [
  'id',
  'displayName',
  'rating',
  'userRatingCount',
  'priceLevel',
  'formattedAddress',
  'location',
  'photos',
  'regularOpeningHours',
  'websiteUri',
  'nationalPhoneNumber',
  'googleMapsUri'
];
```

### Transformación de Datos

```typescript
// lib/google/transforms.ts

interface GooglePlace {
  id: string;
  displayName: { text: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  location: { latitude: number; longitude: number };
  photos?: Array<{ name: string }>;
  regularOpeningHours?: {
    weekdayDescriptions: string[];
    openNow?: boolean;
  };
}

export function transformGooglePlace(googlePlace: GooglePlace): Place {
  return {
    id: googlePlace.id,
    name: googlePlace.displayName.text,
    rating: googlePlace.rating,
    reviewCount: googlePlace.userRatingCount,
    priceLevel: parsePriceLevel(googlePlace.priceLevel),
    location: {
      lat: googlePlace.location.latitude,
      lng: googlePlace.location.longitude
    },
    photos: googlePlace.photos?.map(p => getPhotoUrl(p.name)) || [],
    openingHours: googlePlace.regularOpeningHours ? {
      weekdayDescriptions: googlePlace.regularOpeningHours.weekdayDescriptions,
      openNow: googlePlace.regularOpeningHours.openNow
    } : undefined
  };
}

function parsePriceLevel(level?: string): number | undefined {
  const levels: Record<string, number> = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4
  };
  return level ? levels[level] : undefined;
}

function getPhotoUrl(photoReference: string): string {
  return `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}
```

### API Routes

```typescript
// app/api/places/search/route.ts

import { searchPlaces } from '@/lib/google/places';
import { getCachedPlaces, setCachedPlaces } from '@/lib/cache';

export async function POST(req: Request) {
  const body = await req.json();
  const { query, lat, lng, radius, types } = body;

  // Generar cache key
  const cacheKey = `places:${lat}:${lng}:${query || 'nearby'}:${types?.join(',')}`;

  // Intentar obtener de cache
  const cached = await getCachedPlaces(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  // Buscar en Google Places
  const places = await searchPlaces({
    query,
    location: { lat, lng },
    radius,
    types
  });

  // Guardar en cache (1 hora)
  await setCachedPlaces(cacheKey, places, 3600);

  return Response.json({ places, count: places.length });
}
```

```typescript
// app/api/places/details/route.ts

import { getPlaceDetails } from '@/lib/google/places';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return Response.json({ error: 'placeId required' }, { status: 400 });
  }

  const details = await getPlaceDetails(placeId);
  return Response.json(details);
}
```

---

## Caching

Para reducir costos y mejorar performance, cacheamos resultados de Google Places.

### Redis (Recomendado para Producción)

```typescript
// lib/cache/redis.ts

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedPlaces(key: string): Promise<Place[] | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached as string) : null;
}

export async function setCachedPlaces(
  key: string,
  places: Place[],
  ttlSeconds: number
): Promise<void> {
  await redis.set(key, JSON.stringify(places), { ex: ttlSeconds });
}
```

### In-Memory (Desarrollo)

```typescript
// lib/cache/memory.ts

const cache = new Map<string, { data: any; expires: number }>();

export function getCachedPlaces(key: string): Place[] | null {
  const item = cache.get(key);
  if (!item || Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

export function setCachedPlaces(
  key: string,
  places: Place[],
  ttlSeconds: number
): void {
  cache.set(key, {
    data: places,
    expires: Date.now() + ttlSeconds * 1000
  });
}
```

### Estrategia de Cache

| Tipo de Dato | TTL | Razón |
|--------------|-----|-------|
| Búsqueda por ubicación | 1 hora | Resultados cambian poco |
| Detalles de lugar | 24 horas | Datos estables |
| Fotos | 7 días | URLs expiran lento |
| Distancias | 1 hora | Tráfico cambia |

---

## Transformación a Activity

Cuando un usuario agrega un lugar al canvas, se crea una Activity con datos de Google Places:

```typescript
// lib/google/activity.ts

export function placeToActivityData(
  place: Place,
  date: string,
  timeStart: string,
  timeEnd: string
): Omit<Activity, 'id' | 'trip_id' | 'destination_id'> {
  return {
    title: place.name,
    type: inferActivityType(place),
    date,
    time_start: timeStart,
    time_end: timeEnd,
    google_place_id: place.id,
    google_data: {
      name: place.name,
      rating: place.rating,
      reviews_count: place.reviewCount,
      price_level: place.priceLevel,
      photos: place.photos,
      location: place.location,
      opening_hours: place.openingHours,
      address: place.address,
      phone: place.phone,
      website: place.website,
      google_maps_url: place.googleMapsUrl
    },
    status: 'pending',
    source: 'google_places',
    notes: null,
    ai_reasoning: null
  };
}

function inferActivityType(place: Place): ActivityType {
  // Inferir tipo basado en categoría de Google Places
  const typeMapping: Record<string, ActivityType> = {
    restaurant: 'food',
    cafe: 'food',
    bar: 'food',
    museum: 'activity',
    tourist_attraction: 'activity',
    park: 'activity',
    lodging: 'hotel',
    airport: 'flight'
  };

  return typeMapping[place.primaryType] || 'activity';
}
```

---

## Integración con AI Agents

### Curator Agent

El Curator usa Google Places como fuente de datos:

```typescript
// lib/ai/curator.ts

export async function getRecommendations(input: CuratorInput): Promise<CuratorOutput> {
  // 1. Buscar lugares en Google Places
  const places = await searchPlaces({
    location: input.block.location,
    radius: 5000,
    types: inferTypesFromInterests(input.user_profile.interests)
  });

  // 2. Construir prompt con lugares
  const prompt = buildCuratorPrompt(input, places);

  // 3. AI prioriza y ordena
  const ai = getAIProvider();
  const result = await ai.askJSON<CuratorOutput>(prompt);

  // 4. Enriquecer con datos completos de Places
  return enrichWithPlaceData(result, places);
}
```

### Optimizer Agent

El Optimizer usa Distance Matrix para tiempos de traslado:

```typescript
// lib/ai/optimizer.ts

export async function optimizeDay(input: OptimizerInput): Promise<OptimizerOutput> {
  // 1. Obtener tiempos de traslado reales
  const travelTimes = await getTravelTimes(
    input.activities.map(a => a.location)
  );

  // 2. Analizar con AI
  const prompt = buildOptimizerPrompt(input, travelTimes);
  const ai = getAIProvider();

  return ai.askJSON<OptimizerOutput>(prompt);
}

async function getTravelTimes(locations: Location[]): Promise<TravelTimeMatrix> {
  // Llamar a Distance Matrix API
  const origins = locations.map(l => `${l.lat},${l.lng}`).join('|');
  const destinations = origins;

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', origins);
  url.searchParams.set('destinations', destinations);
  url.searchParams.set('mode', 'transit'); // o 'walking', 'driving'
  url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY!);

  const response = await fetch(url);
  const data = await response.json();

  return transformDistanceMatrix(data);
}
```

---

## Costos y Límites

### Precios (2024)

| API | Precio | Notas |
|-----|--------|-------|
| Text Search | $32 / 1000 requests | Incluye 20 resultados |
| Nearby Search | $32 / 1000 requests | Incluye 20 resultados |
| Place Details | $17 / 1000 requests | Solo campos básicos |
| Place Photos | $7 / 1000 requests | Por foto |
| Distance Matrix | $5 / 1000 elementos | Origen x Destino |

### Optimizaciones

1. **Field Masks**: Solo pedir campos necesarios (reduce costo 50-70%)
2. **Caching**: Cachear resultados agresivamente (1h-24h)
3. **Batching**: Agrupar requests de Distance Matrix
4. **Lazy Loading**: Cargar fotos solo cuando son visibles

### Límites

- **QPS (Queries per Second)**: 100 QPS por proyecto
- **Daily Limit**: Configurable en Cloud Console
- **Photo Size**: Max 4800x4800 px

---

## Manejo de Errores

```typescript
// lib/google/error-handling.ts

export class GooglePlacesError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'GooglePlacesError';
  }
}

export async function handleGoogleResponse(response: Response): Promise<any> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    switch (response.status) {
      case 400:
        throw new GooglePlacesError('Invalid request', 400, error.error?.code);
      case 403:
        throw new GooglePlacesError('API key invalid or quota exceeded', 403);
      case 404:
        throw new GooglePlacesError('Place not found', 404);
      case 429:
        throw new GooglePlacesError('Rate limit exceeded', 429);
      default:
        throw new GooglePlacesError('Google Places error', response.status);
    }
  }

  return response.json();
}
```

---

## Testing

### Mock para Desarrollo

```typescript
// lib/google/__mocks__/places.ts

export const mockPlaces: Place[] = [
  {
    id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    name: 'Colosseum',
    rating: 4.8,
    reviewCount: 125000,
    priceLevel: 2,
    location: { lat: 41.8902, lng: 12.4922 },
    photos: ['/mock/colosseum.jpg']
  },
  // ... más lugares mock
];

export async function searchPlaces(): Promise<Place[]> {
  return mockPlaces;
}
```

### Test Integration

```typescript
// __tests__/google-places.test.ts

describe('Google Places Integration', () => {
  it('searches places by query', async () => {
    const places = await searchPlaces({
      query: 'museums',
      location: { lat: 41.9028, lng: 12.4964 }
    });

    expect(places.length).toBeGreaterThan(0);
    expect(places[0]).toHaveProperty('id');
    expect(places[0]).toHaveProperty('name');
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    await expect(
      searchPlaces({ query: '', location: { lat: 0, lng: 0 } })
    ).rejects.toThrow(GooglePlacesError);
  });
});
```

---

## Recursos

- [Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)
- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Pricing Calculator](https://mapsplatform.google.com/pricing/)
