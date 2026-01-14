# Especificación Técnica: Pantalla Search Fullscreen

## Resumen

Nueva pantalla `/trips/[id]/search` con layout dual (Grid 60% + Mapa 40%) que reemplaza la búsqueda en el panel derecho del canvas. Incluye:
- Barra de búsqueda por texto con Google Places API
- Filtros por categoría mediante chips
- Grid de cards con hover bidireccional sincronizado con mapa
- Mapa interactivo con pins, clustering y popups preview
- Integración con DaySelectorDropdown para añadir a días específicos
- Sincronización bidireccional: búsqueda ajusta viewport del mapa, movimiento del mapa actualiza resultados

**Patrón de referencia**: Basado en `/trips/[id]/explore` existente pero con focus en búsqueda activa + mapa, no en discovery curado.

---

## Arquitectura

### Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│ Header (h-14, sticky top-0)                                 │
│ [← Volver] [Barra búsqueda] [Chips categoría]              │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│  Grid de Resultados          │  Mapa Interactivo            │
│  (60% width, overflow-y)     │  (40% width, sticky top-14)  │
│                              │                              │
│  ┌──────────────┐            │  - Pins con números          │
│  │ Card 1       │            │  - Clustering automático     │
│  └──────────────┘            │  - Popup preview al click    │
│  ┌──────────────┐            │  - Hover highlight           │
│  │ Card 2       │            │  - Bounds sync con grid      │
│  └──────────────┘            │                              │
│  ...                         │                              │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**Responsive**: Desktop (side-by-side), Tablet/Mobile (mapa sticky top, grid scroll debajo).

---

## Componentes

### 1. `src/app/trips/[id]/search/page.tsx`

**Responsabilidad**: Route handler, data fetching, orquestación de estado.

**Props**: Recibe `params.id` (tripId) de Next.js.

**State Management**:
```typescript
const [searchQuery, setSearchQuery] = useState("")
const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | null>(null)
const [places, setPlaces] = useState<Place[]>([])
const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null)
const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
const [mapCenter, setMapCenter] = useState<Coordinates>(defaultCenter)
const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null)
```

**Hooks utilizados**:
- `useTrip(tripId)` - Datos del viaje
- `usePlan(tripId)` - Itinerario para DaySelectorDropdown
- `useThingsToDo(tripId)` - Validar qué lugares ya están guardados
- `useAddToThingsToDo()` - Agregar a Things To Do
- `usePlaceSearch()` - Búsqueda por texto (debounce 300ms)
- `usePlaces()` - Búsqueda por categoría

**Lógica de sincronización bidireccional**:
```typescript
// 1. Búsqueda/filtro → ajustar mapa
useEffect(() => {
  if (places.length > 0) {
    const bounds = calculateBounds(places)
    setMapBounds(bounds)
  }
}, [places])

// 2. Movimiento mapa → actualizar resultados
const handleMapIdle = useCallback((map: google.maps.Map) => {
  const newBounds = map.getBounds()
  if (newBounds) {
    // Filtrar places que están dentro del viewport
    const visiblePlaces = places.filter(p => 
      newBounds.contains({ lat: p.location.lat, lng: p.location.lng })
    )
    // Si hay muy pocos resultados, buscar más en esa área
    if (visiblePlaces.length < 5) {
      fetchPlacesInBounds(newBounds, selectedCategory)
    }
  }
}, [places, selectedCategory])
```

**Dependencias**: `SearchHeader`, `SearchResults`, `SearchMap`

---

### 2. `src/components/search/SearchPage.tsx`

**Responsabilidad**: Container layout principal.

**Props**:
```typescript
interface SearchPageProps {
  tripId: string
  trip: Trip
  plan: GeneratedPlan | null
  thingsToDoPlaceIds: Set<string>
  // Search state
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: PlaceCategory | null
  onCategoryChange: (category: PlaceCategory | null) => void
  // Results state
  places: Place[]
  loading: boolean
  // Hover/Selection state (compartido)
  hoveredPlaceId: string | null
  onHoverPlace: (placeId: string | null) => void
  selectedPlaceId: string | null
  onSelectPlace: (placeId: string | null) => void
  // Map state
  mapCenter: Coordinates
  mapBounds: google.maps.LatLngBounds | null
  onMapBoundsChange: (bounds: google.maps.LatLngBounds | null) => void
  onMapIdle: (map: google.maps.Map) => void
  // Actions
  onAddToThingsToDo: (place: Place) => Promise<void>
  onAddToDay: (place: Place, dayNumber: number) => Promise<void>
}
```

**Estructura**:
```tsx
<div className="min-h-screen bg-background flex flex-col">
  <SearchHeader {...headerProps} />
  <div className="flex-1 flex">
    <SearchResults {...resultsProps} />
    <SearchMap {...mapProps} />
  </div>
</div>
```

**Dependencias**: `SearchHeader`, `SearchResults`, `SearchMap`

---

### 3. `src/components/search/SearchHeader.tsx`

**Responsabilidad**: Barra búsqueda + chips de categoría + botón volver.

**Props**:
```typescript
interface SearchHeaderProps {
  tripId: string
  destination: string
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: PlaceCategory | null
  onCategoryChange: (category: PlaceCategory | null) => void
}
```

**UI Elements**:
- Botón "← Volver al Canvas"
- Input de búsqueda (placeholder: "Buscar lugares en {destination}...")
- Chips de categoría (horizontal scroll en mobile):
  - "Restaurantes", "Cafés", "Atracciones", "Naturaleza", "Compras", "Vida Nocturna"
  - Estado activo/inactivo (toggle)
  - Click en activo lo deselecciona (permite search sin filtro)

**Comportamiento**:
- Debounce 300ms en búsqueda por texto
- Categoría y búsqueda son compatibles (AND logic)
- Limpiar búsqueda mantiene categoría activa

---

### 4. `src/components/search/SearchResults.tsx`

**Responsabilidad**: Grid de cards con scroll vertical.

**Props**:
```typescript
interface SearchResultsProps {
  places: Place[]
  loading: boolean
  hoveredPlaceId: string | null
  selectedPlaceId: string | null
  onHoverPlace: (placeId: string | null) => void
  onSelectPlace: (placeId: string | null) => void
  onAddToThingsToDo: (place: Place) => Promise<void>
  onAddToDay: (place: Place, dayNumber: number) => Promise<void>
  days: ItineraryDay[]
  thingsToDoPlaceIds: Set<string>
}
```

**Estructura**:
```tsx
<div className="w-[60%] overflow-y-auto p-6">
  {loading ? (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(8)].map(() => <SearchResultCardSkeleton />)}
    </div>
  ) : places.length === 0 ? (
    <EmptyState />
  ) : (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        {places.length} resultados
      </div>
      <div className="grid grid-cols-2 gap-4">
        {places.map((place, idx) => (
          <SearchResultCard
            key={place.id}
            place={place}
            index={idx}
            isHovered={hoveredPlaceId === place.id}
            isSelected={selectedPlaceId === place.id}
            isAdded={thingsToDoPlaceIds.has(place.id)}
            onHover={() => onHoverPlace(place.id)}
            onUnhover={() => onHoverPlace(null)}
            onClick={() => onSelectPlace(place.id)}
            onAddToThingsToDo={() => onAddToThingsToDo(place)}
            onAddToDay={(dayNum) => onAddToDay(place, dayNum)}
            days={days}
          />
        ))}
      </div>
    </>
  )}
</div>
```

**Dependencias**: `SearchResultCard`

---

### 5. `src/components/search/SearchResultCard.tsx`

**Responsabilidad**: Card individual con imagen, info, botón añadir.

**Props**:
```typescript
interface SearchResultCardProps {
  place: Place
  index: number // Para mostrar número (1-indexed)
  isHovered: boolean
  isSelected: boolean
  isAdded: boolean
  onHover: () => void
  onUnhover: () => void
  onClick: () => void
  onAddToThingsToDo: () => Promise<void>
  onAddToDay: (dayNumber: number) => Promise<void>
  days: ItineraryDay[]
}
```

**UI Structure**:
```tsx
<div 
  className={cn(
    "relative rounded-xl overflow-hidden bg-card border transition-all cursor-pointer",
    isHovered && "ring-2 ring-primary shadow-lg",
    isSelected && "ring-2 ring-primary"
  )}
  onMouseEnter={onHover}
  onMouseLeave={onUnhover}
  onClick={onClick}
>
  {/* Image */}
  <div className="relative aspect-[4/3]">
    <Image src={place.images[0]} fill ... />
    {/* Número badge top-left */}
    <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-sm font-bold">
      {index + 1}
    </div>
    {/* Botón + top-right con dropdown */}
    <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
      <DaySelectorDropdown
        days={days}
        onSelectDay={(day) => onAddToDay(day)}
        onAddToThingsToDo={onAddToThingsToDo}
        isLoading={false}
      />
    </div>
  </div>
  
  {/* Content */}
  <div className="p-3">
    <h3 className="font-semibold text-sm truncate">{place.name}</h3>
    <p className="text-xs text-muted-foreground truncate">{place.subcategory}</p>
    <div className="flex items-center gap-2 mt-1">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm">{place.rating?.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">
        ({place.reviewCount?.toLocaleString()})
      </span>
    </div>
  </div>
</div>
```

**Eventos de hover**:
- `onMouseEnter` → notify parent → resalta pin en mapa
- `onMouseLeave` → quita highlight

**Reutilización**: Puede reutilizar estilos de `PlaceCard.tsx` existente pero con ajustes para layout grid.

---

### 6. `src/components/search/SearchMap.tsx`

**Responsabilidad**: Mapa con pins, clustering, popups.

**Props**:
```typescript
interface SearchMapProps {
  places: Place[]
  center: Coordinates
  bounds: google.maps.LatLngBounds | null
  hoveredPlaceId: string | null
  selectedPlaceId: string | null
  onPlaceSelect: (placeId: string) => void
  onMapIdle: (map: google.maps.Map) => void
  className?: string
}
```

**Tecnología**:
- `@react-google-maps/api` (ya instalado)
- `MarkerClusterer` de `@googlemaps/markerclusterer` (nueva dependencia)

**Estructura**:
```tsx
<div className="w-[40%] sticky top-14 h-[calc(100vh-3.5rem)]">
  <GoogleMap
    mapContainerStyle={{ width: "100%", height: "100%" }}
    center={center}
    zoom={13}
    options={mapOptions}
    onIdle={() => onMapIdle(map)}
    onLoad={handleMapLoad}
  >
    <MarkerClusterer
      options={{
        minimumClusterSize: 5,
        maxZoom: 15,
        gridSize: 60,
      }}
    >
      {(clusterer) => (
        <>
          {places.map((place, idx) => (
            <MarkerF
              key={place.id}
              position={place.location}
              label={{
                text: String(idx + 1),
                color: "#fff",
                fontSize: isHighlighted ? "14px" : "12px",
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getPinColor(place, hoveredPlaceId, selectedPlaceId),
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
                scale: isHighlighted ? 18 : 14,
              }}
              onClick={() => handlePinClick(place.id)}
              clusterer={clusterer}
            />
          ))}
        </>
      )}
    </MarkerClusterer>
  </GoogleMap>
  
  {/* Popup Modal (fuera del mapa) */}
  {selectedPlaceId && (
    <SearchMapPopup
      place={places.find(p => p.id === selectedPlaceId)!}
      onClose={() => onPlaceSelect(null)}
      onAddToThingsToDo={...}
      onAddToDay={...}
      days={days}
    />
  )}
</div>
```

**Colores de pins**:
```typescript
function getPinColor(
  place: Place,
  hoveredId: string | null,
  selectedId: string | null
): string {
  if (selectedId === place.id) return "#0D9488" // primary
  if (hoveredId === place.id) return "#F97316" // orange
  return "#64748b" // slate-500 (default)
}
```

**Clustering**:
- Automático cuando hay >15 pins
- Cluster muestra número de lugares
- Click en cluster hace zoom

**Sync de bounds**:
```typescript
useEffect(() => {
  if (bounds && map) {
    map.fitBounds(bounds)
  }
}, [bounds, map])
```

**Dependencias**: `SearchMapPopup`, `@googlemaps/markerclusterer`

---

### 7. `src/components/search/SearchMapPopup.tsx`

**Responsabilidad**: Popup preview al hacer click en pin.

**Props**:
```typescript
interface SearchMapPopupProps {
  place: Place
  onClose: () => void
  onAddToThingsToDo: () => Promise<void>
  onAddToDay: (dayNumber: number) => Promise<void>
  days: ItineraryDay[]
  isAdded: boolean
}
```

**UI Structure**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
  <div 
    className="bg-background rounded-xl shadow-xl max-w-md w-full m-4"
    onClick={e => e.stopPropagation()}
  >
    {/* Image */}
    <div className="relative aspect-video">
      <Image src={place.images[0]} fill ... />
    </div>
    
    {/* Content */}
    <div className="p-4">
      <h3 className="font-semibold text-lg">{place.name}</h3>
      <p className="text-sm text-muted-foreground">{place.subcategory}</p>
      
      {/* Rating */}
      <div className="flex items-center gap-2 mt-2">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        <span>{place.rating?.toFixed(1)}</span>
        <span className="text-muted-foreground">({place.reviewCount})</span>
      </div>
      
      {/* Description */}
      {place.description && (
        <p className="text-sm mt-3 line-clamp-3">{place.description}</p>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cerrar
        </Button>
        <DaySelectorDropdown
          days={days}
          onSelectDay={onAddToDay}
          onAddToThingsToDo={onAddToThingsToDo}
          className="flex-1"
        />
      </div>
    </div>
  </div>
</div>
```

**Comportamiento**:
- Click fuera del popup lo cierra
- ESC key también cierra
- Usar `DaySelectorDropdown` existente

---

## Contratos

### API Endpoints

Reutilizar endpoint existente:

| Método | Ruta | Query Params | Response |
|--------|------|--------------|----------|
| GET | `/api/explore/places` | `destination`, `category?`, `query?`, `lat`, `lng`, `pageToken?` | `{ places: Place[], nextPageToken?: string }` |

**Notas**:
- Si `query` está presente, hace text search
- Si `category` está presente, filtra por categoría
- Si ambos están presentes, combina (text search + category filter client-side)

### Interfaces TypeScript

**Reutilizar tipos existentes** de `@/types/explore`:

```typescript
// Ya existen en el codebase
interface Place {
  id: string
  name: string
  category: PlaceCategory
  subcategory?: string
  description?: string
  location: Coordinates & {
    address?: string
    city: string
    country: string
  }
  rating?: number
  reviewCount?: number
  priceLevel?: 1 | 2 | 3 | 4
  images: string[]
  openNow?: boolean
  // ... otros campos
}

type PlaceCategory = 
  | 'restaurants' | 'attractions' | 'cafes' 
  | 'bars' | 'museums' | 'nature' 
  | 'landmarks' | 'beaches' | 'religious' 
  | 'markets' | 'viewpoints' | 'wellness'

interface Coordinates {
  lat: number
  lng: number
}
```

**Nuevos tipos para Search**:

```typescript
// src/types/search.ts
export interface SearchFilters {
  query: string
  category: PlaceCategory | null
  minRating?: number
  priceLevel?: (1 | 2 | 3 | 4)[]
}

export interface SearchState {
  filters: SearchFilters
  results: Place[]
  loading: boolean
  hoveredPlaceId: string | null
  selectedPlaceId: string | null
  mapCenter: Coordinates
  mapBounds: google.maps.LatLngBounds | null
}
```

---

## Hooks

### Hooks Existentes (Reutilizar)

- `usePlaceSearch()` - `/src/lib/explore/hooks.ts`
  - Búsqueda por texto con debounce
  - Cancelación de requests anteriores con AbortController
  
- `usePlaces()` - `/src/lib/explore/hooks.ts`
  - Búsqueda por categoría
  - Soporte de paginación

- `useAddToThingsToDo()` - `/src/hooks/useThingsToDo.ts`
  - Agregar lugar a Things To Do

### Nuevo Hook: `useSearchSync`

**Ubicación**: `src/hooks/useSearchSync.ts`

**Propósito**: Sincronizar estado de búsqueda con mapa (bidireccional).

```typescript
interface UseSearchSyncOptions {
  places: Place[]
  onBoundsChange: (bounds: google.maps.LatLngBounds) => void
}

export function useSearchSync({ places, onBoundsChange }: UseSearchSyncOptions) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  
  // 1. Actualizar bounds del mapa cuando cambien los resultados
  useEffect(() => {
    if (!map || places.length === 0) return
    
    const bounds = new google.maps.LatLngBounds()
    places.forEach(place => {
      bounds.extend({ lat: place.location.lat, lng: place.location.lng })
    })
    
    map.fitBounds(bounds, { padding: 50 })
  }, [places, map])
  
  // 2. Notificar cuando el usuario mueve/zoom el mapa
  const handleMapIdle = useCallback(() => {
    if (!map) return
    const newBounds = map.getBounds()
    if (newBounds) {
      onBoundsChange(newBounds)
    }
  }, [map, onBoundsChange])
  
  return {
    map,
    onMapLoad: setMap,
    onMapIdle: handleMapIdle,
  }
}
```

---

## Edge Cases

| Escenario | Comportamiento esperado |
|-----------|------------------------|
| Sin resultados | Mostrar empty state: "No encontramos lugares en {destination}" con sugerencia de cambiar filtros |
| Búsqueda sin coordenadas del destino | Usar coordenadas default del viaje (trip.destination) |
| Cluster con 1 solo lugar | No agrupar, mostrar pin individual |
| Hover en card mientras scroll en grid | Pin mantiene highlight, mapa no se mueve (no auto-pan) |
| Click en pin fuera del viewport del grid | Scroll automático en grid para mostrar card correspondiente |
| Usuario mueve mapa lejos de resultados | Mostrar mensaje overlay: "Buscar en esta área" con botón |
| API de Google Places retorna error | Toast error + mantener resultados anteriores + retry button |
| Lugar ya en Things To Do | Botón + muestra checkmark verde, dropdown deshabilitado |
| Sin días en itinerario | DaySelectorDropdown solo muestra opción "Agregar a lista general" |
| Búsqueda + categoría simultáneos | Combinar: text search en backend + filter por categoría en frontend |
| Mapa en mobile | Sticky top con altura reducida (h-64), grid debajo con scroll |

---

## Decisiones técnicas

| Decisión | Alternativas consideradas | Justificación |
|----------|--------------------------|---------------|
| **Ruta separada `/search`** | Modal sobre canvas, panel derecho expandido | Permite layout optimizado para búsqueda, no compite con canvas por espacio |
| **Grid 60% + Mapa 40%** | 50/50, Mapa arriba + Grid abajo | Patrón AirBnB probado, prioriza resultados pero mantiene contexto espacial |
| **Clustering automático** | Pins individuales siempre, Clustering manual | UX mejor con muchos resultados, evita sobrecargar el mapa |
| **Hover bidireccional** | Click para highlight, Highlight automático sin interacción | Feedback inmediato, ayuda a correlacionar card ↔ ubicación |
| **DaySelectorDropdown en cards** | Modal de añadir separado, Arrastrar al día | Consistencia con UI existente, acción rápida sin cambiar contexto |
| **Popup sobre modal full** | InfoWindow de Google Maps nativo | Más control sobre UI/UX, mejor integración con design system |
| **Text search + category OR** | Text search ignora categoría | Usuario puede querer "sushi" solo en "Restaurantes", no en todos lados |
| **@googlemaps/markerclusterer** | Custom clustering logic, supercluster | Librería oficial de Google, bien mantenida, integración directa con @react-google-maps/api |

---

## Riesgos y consideraciones

### Rendimiento

**Riesgo**: Render de muchos pins (100+) puede causar lag en hover.

**Mitigación**:
- Clustering reduce pins visibles
- Debounce de hover events (50ms)
- React.memo en SearchResultCard
- Virtualización de grid si >50 resultados (react-window)

### Rate Limits de Google Places API

**Riesgo**: Sincronización frecuente de mapa puede disparar muchos requests.

**Mitigación**:
- Debounce de 500ms en `onMapIdle`
- Cache de resultados por bounds en sessionStorage (5 min)
- Solo re-fetch si bounds cambió >20% del área anterior

### Sincronización de hover

**Riesgo**: Hover rápido en grid puede causar "flashing" de pins.

**Mitigación**:
- Debounce de 50ms en `onHoverPlace`
- Usar CSS transitions suaves (duration: 150ms)
- No aplicar bounce animation en hover (solo en click)

### Clustering oculta lugares cercanos

**Riesgo**: Usuario no ve lugar específico porque está en cluster.

**Mitigación**:
- Zoom automático al hacer click en cluster
- Tooltip en cluster muestra nombres de primeros 3 lugares
- Threshold de clustering en maxZoom: 15 (después de este nivel no agrupa)

### Mobile: Mapa sticky ocupa mucho espacio

**Riesgo**: Grid tiene poco espacio visible en mobile.

**Mitigación**:
- Altura fija reducida en mobile (h-64 = 256px)
- Opción de colapsar mapa con toggle button
- Swipe gesture para alternar entre vista mapa/grid

### Popup puede quedar fuera de viewport

**Riesgo**: Popup modal centrado puede quedar detrás del header o footer.

**Mitigación**:
- Usar `fixed` positioning con `inset-0` + `flex items-center justify-center`
- Padding de seguridad (m-4)
- Max-height con scroll interno si contenido muy largo

---

## Archivos a modificar/crear

### Crear (nuevos)

```
src/
├── app/trips/[id]/search/
│   └── page.tsx                    # Route handler principal
├── components/search/
│   ├── SearchPage.tsx              # Container layout
│   ├── SearchHeader.tsx            # Barra búsqueda + chips
│   ├── SearchResults.tsx           # Grid de cards
│   ├── SearchResultCard.tsx        # Card individual
│   ├── SearchMap.tsx               # Mapa con pins/clustering
│   └── SearchMapPopup.tsx          # Popup preview del pin
├── hooks/
│   └── useSearchSync.ts            # Hook sincronización bidireccional
└── types/
    └── search.ts                   # Tipos específicos de Search
```

### Modificar (existentes)

```
src/
├── components/canvas/CanvasHeader.tsx
│   # Agregar botón "Search" junto a "Explore"
│   + <Button variant="outline" size="sm" asChild>
│   +   <Link href={`/trips/${trip.id}/search`}>
│   +     <Search className="h-4 w-4" />
│   +     <span className="hidden sm:inline">Search</span>
│   +   </Link>
│   + </Button>
│
└── package.json
    # Agregar dependencia para clustering
    + "@googlemaps/markerclusterer": "^2.5.3"
```

---

## Plan de implementación (orden sugerido)

### Fase 1: Estructura base
1. Crear ruta `/trips/[id]/search/page.tsx` con data fetching
2. Crear `SearchPage.tsx` con layout dual (placeholders)
3. Agregar botón "Search" en `CanvasHeader.tsx`

### Fase 2: Grid de resultados
4. Crear `SearchHeader.tsx` con barra búsqueda + chips
5. Crear `SearchResultCard.tsx` reutilizando estilos de `PlaceCard`
6. Crear `SearchResults.tsx` con grid layout
7. Conectar `usePlaceSearch()` para búsqueda por texto

### Fase 3: Mapa interactivo
8. Instalar `@googlemaps/markerclusterer`
9. Crear `SearchMap.tsx` con pins básicos
10. Implementar clustering
11. Agregar lógica de colores de pins (hover/selected)

### Fase 4: Sincronización
12. Crear `useSearchSync.ts` hook
13. Implementar hover bidireccional (card ↔ pin)
14. Implementar ajuste de bounds al buscar
15. Implementar re-fetch al mover mapa

### Fase 5: Acciones
16. Crear `SearchMapPopup.tsx`
17. Integrar `DaySelectorDropdown` en cards
18. Conectar `useAddToThingsToDo()` y añadir a días
19. Manejar estado "ya agregado"

### Fase 6: Polish
20. Animaciones suaves (transitions)
21. Responsive mobile (mapa colapsable)
22. Empty states y loading skeletons
23. Error handling y retry logic
24. Testing manual con datos reales

---

## Testing checklist

- [ ] Búsqueda por texto retorna resultados relevantes
- [ ] Filtro por categoría funciona correctamente
- [ ] Búsqueda + categoría combina resultados (AND logic)
- [ ] Hover en card resalta pin en mapa
- [ ] Hover en pin resalta card en grid (con scroll automático)
- [ ] Click en pin abre popup con información correcta
- [ ] Clustering se activa con >15 pins
- [ ] Click en cluster hace zoom apropiado
- [ ] Mapa ajusta bounds al realizar búsqueda
- [ ] Mover mapa dispara re-fetch de lugares (con debounce)
- [ ] DaySelectorDropdown añade a día correcto
- [ ] "Agregar a lista general" guarda en Things To Do
- [ ] Botón + muestra checkmark si ya está agregado
- [ ] Empty state se muestra sin resultados
- [ ] Loading skeletons durante fetch
- [ ] Error toast si falla API de Google
- [ ] Botón "Volver" regresa al canvas
- [ ] Responsive en mobile (mapa sticky + grid scroll)
- [ ] Performance fluida con 50+ resultados
- [ ] No hay memory leaks (limpiar listeners)

---

## Notas de implementación

### Reutilización de código

**Máxima prioridad**: Reutilizar componentes y hooks existentes.

- `PlaceCard.tsx` → base para `SearchResultCard.tsx` (ajustar layout)
- `ExploreMap.tsx` → referencia para `SearchMap.tsx` (agregar clustering)
- `usePlaceSearch()` y `usePlaces()` → ya implementados, usar directamente
- `DaySelectorDropdown` → usar sin modificaciones

### Performance

- Usar `React.memo` en `SearchResultCard` y `SearchMapPopup`
- Debounce de hover/search ya está en los hooks
- Clustering reduce pins visibles (no necesita virtualización inicial)
- Cache de sessionStorage solo si se detectan problemas de rate limit

### Accesibilidad

- Todos los botones tienen `aria-label`
- Cards son focusables con keyboard
- Popup cierra con ESC
- Color contrast ratio >4.5:1
- Focus visible en todos los interactivos

### Google Maps API

- **API Key**: Usar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (ya configurada)
- **Librerías**: Solo cargar "places" y "marker" (no geometry ni drawing)
- **Styling**: Reutilizar `mapStyles` de `ExploreMap.tsx`

### Sincronización bidireccional

**Cuidado con loops infinitos**:
```typescript
// ✅ CORRECTO: Solo actualizar si hay cambio real
useEffect(() => {
  if (!areBoundsEqual(bounds, prevBounds)) {
    updateBounds(bounds)
  }
}, [bounds])

// ❌ INCORRECTO: Loop infinito
useEffect(() => {
  updateBounds(bounds) // Esto dispara re-render que cambia bounds
}, [bounds])
```

**Helper function**:
```typescript
function areBoundsEqual(
  a: google.maps.LatLngBounds | null,
  b: google.maps.LatLngBounds | null
): boolean {
  if (!a || !b) return a === b
  const ne1 = a.getNorthEast()
  const sw1 = a.getSouthWest()
  const ne2 = b.getNorthEast()
  const sw2 = b.getSouthWest()
  return (
    ne1.lat() === ne2.lat() &&
    ne1.lng() === ne2.lng() &&
    sw1.lat() === sw2.lat() &&
    sw1.lng() === sw2.lng()
  )
}
```

---

## Dependencias externas

### NPM Packages a instalar

```json
{
  "@googlemaps/markerclusterer": "^2.5.3"
}
```

### Ya instaladas (verificadas)

```json
{
  "@react-google-maps/api": "^2.20.7"
}
```

### Versiones de Node/Next.js

- **Next.js**: 14+ (App Router)
- **React**: 18+
- **Node.js**: 18+

---

## Referencia de patrones existentes

Para mantener consistencia, usar estos archivos como referencia:

| Aspecto | Archivo de referencia |
|---------|----------------------|
| Layout fullscreen | `src/app/trips/[id]/explore/page.tsx` |
| Mapa con pins | `src/components/explore/ExploreMap.tsx` |
| Card de lugar | `src/components/explore/PlaceCard.tsx` |
| Grid responsive | `src/components/explore/PlaceGrid.tsx` |
| Búsqueda con debounce | `src/lib/explore/hooks.ts` (usePlaceSearch) |
| Dropdown de días | `src/components/ai/DaySelectorDropdown.tsx` |
| API de Google Places | `src/lib/explore/google-places.ts` |
| Agregar a Things To Do | `src/hooks/useThingsToDo.ts` |

---

## Criterios de éxito

La implementación será exitosa si:

1. **Funcional**: Búsqueda retorna resultados relevantes en <2s
2. **UX**: Hover bidireccional responde en <100ms
3. **Performance**: Render fluido con 50+ pins (60fps)
4. **Mobile**: Layout responsive sin scroll horizontal
5. **Consistencia**: UI/UX alineado con design system existente
6. **Robustez**: Manejo de errores sin crashes
7. **Accesibilidad**: Navegable con keyboard, screen reader compatible

---

## Próximos pasos después de MVP

**No incluir en MVP inicial**, considerar para iteración 2:

- [ ] Filtros avanzados (precio, rating, abierto ahora)
- [ ] Ordenamiento (distancia, rating, popularidad)
- [ ] Vista de lista vs grid (toggle)
- [ ] Guardar búsquedas recientes
- [ ] Compartir búsqueda via URL
- [ ] Mapa fullscreen mode
- [ ] Integración con rutas/transporte
- [ ] Vista de calendario para lugares con horarios

---

## Diagrama de flujo de datos

```
┌─────────────────────────────────────────────────────────────┐
│                     SearchPage (Route)                       │
│  - Fetch trip/plan/thingsToDo                               │
│  - Manage search state (query, category, places)            │
│  - Manage hover/selection state (shared)                    │
│  - Manage map state (center, bounds)                        │
└────────────────┬────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ SearchHeader│     │  SearchMap  │
│ - Input     │     │  - Pins     │
│ - Chips     │     │  - Clusters │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ onSearchChange    │ onMapIdle
       │ onCategoryChange  │ onPlaceSelect
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│      SearchResults (Grid)        │
│  - Map over places               │
│  - Render SearchResultCard       │
│  - Pass hover/select handlers    │
└──────────┬──────────────────────┘
           │
           │ map(place => ...)
           │
           ▼
┌──────────────────────────┐
│   SearchResultCard       │
│   - onHover → highlight  │
│   - onClick → select     │
│   - DaySelectorDropdown  │
└──────────────────────────┘
           │
           │ onAddToDay / onAddToThingsToDo
           │
           ▼
┌──────────────────────────┐
│  useAddToThingsToDo()    │
│  - Insert into DB        │
│  - Toast success         │
└──────────────────────────┘
```

---

**Fin de la especificación técnica**
