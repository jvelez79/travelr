# Technical Specification: Search - Atracciones Default + Infinite Scroll

## Overview

Implementar dos mejoras en la pantalla de búsqueda:
1. Reordenar categorías con "Atracciones" primero y como default
2. Agregar infinite scroll automático para cargar más resultados

## Architecture Analysis

### Current State

**Archivos relevantes:**
- `src/types/search.ts` - Define `SEARCH_CATEGORY_CHIPS` (orden actual)
- `src/app/trips/[id]/search/page.tsx` - Route principal, maneja estado
- `src/components/search/SearchPage.tsx` - Container del layout
- `src/components/search/SearchHeader.tsx` - Chips de categorías
- `src/components/search/SearchResults.tsx` - Grid de resultados
- `src/lib/explore/hooks.ts` - `usePlaces` hook con soporte de paginación

**Estado actual del hook `usePlaces`:**
- Ya soporta paginación con `nextPageToken`
- Tiene `loadMore()` y `hasMore` disponibles
- Retorna `isLoadingMore` para indicador de carga

**Problema identificado:**
- El page.tsx usa `usePlaces` pero NO expone `loadMore`, `hasMore`, ni `isLoadingMore`
- `selectedCategory` inicializa como `null`, debería ser `"attractions"`
- El orden de chips está hardcodeado en `SEARCH_CATEGORY_CHIPS`

---

## Change 1: Atracciones como Default

### Files to Modify

#### 1. `src/types/search.ts`

**Cambio:** Reordenar el array `SEARCH_CATEGORY_CHIPS`

```typescript
// ANTES
export const SEARCH_CATEGORY_CHIPS: SearchCategoryChip[] = [
  { id: "restaurants", label: "Restaurantes", icon: "utensils" },
  { id: "cafes", label: "Cafés", icon: "coffee" },
  { id: "attractions", label: "Atracciones", icon: "landmark" },
  ...
]

// DESPUÉS
export const SEARCH_CATEGORY_CHIPS: SearchCategoryChip[] = [
  { id: "attractions", label: "Atracciones", icon: "landmark" },
  { id: "restaurants", label: "Restaurantes", icon: "utensils" },
  { id: "cafes", label: "Cafés", icon: "coffee" },
  ...
]
```

#### 2. `src/app/trips/[id]/search/page.tsx`

**Cambio:** Inicializar `selectedCategory` con `"attractions"` en lugar de `null`

```typescript
// ANTES
const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | null>(null)

// DESPUÉS
const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>("attractions")
```

**Cambio adicional:** Ajustar el hook `usePlaces` ya que category no puede ser null:

```typescript
// ANTES
const {
  places: categoryPlaces,
  isLoading: categoryLoading,
} = usePlaces({
  ...
  category: selectedCategory || "restaurants",
  enabled: !!trip && !!selectedCategory && !searchQuery,
})

// DESPUÉS
const {
  places: categoryPlaces,
  isLoading: categoryLoading,
  isLoadingMore: categoryLoadingMore,
  hasMore,
  loadMore,
} = usePlaces({
  ...
  category: selectedCategory,
  enabled: !!trip && !searchQuery,
})
```

---

## Change 2: Infinite Scroll

### Architecture Decision

Usar **IntersectionObserver** con un elemento "sentinel" al final de la lista. Cuando el sentinel es visible, llamar a `loadMore()`.

### Files to Modify

#### 1. `src/app/trips/[id]/search/page.tsx`

**Cambios:**
- Extraer `loadMore`, `hasMore`, `isLoadingMore` del hook `usePlaces`
- Pasar estas props a `SearchPage`

```typescript
const {
  places: categoryPlaces,
  isLoading: categoryLoading,
  isLoadingMore: categoryLoadingMore,
  hasMore: categoryHasMore,
  loadMore: categoryLoadMore,
} = usePlaces({...})

// Determinar valores según contexto (search vs category)
const isLoadingMore = searchQuery ? false : categoryLoadingMore
const hasMore = searchQuery ? false : categoryHasMore
const loadMore = searchQuery ? () => {} : categoryLoadMore

return (
  <SearchPage
    ...
    isLoadingMore={isLoadingMore}
    hasMore={hasMore}
    onLoadMore={loadMore}
  />
)
```

#### 2. `src/components/search/SearchPage.tsx`

**Cambios:**
- Agregar props: `isLoadingMore`, `hasMore`, `onLoadMore`
- Pasar a `SearchResults`

```typescript
interface SearchPageProps {
  ...
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
}
```

#### 3. `src/components/search/SearchResults.tsx`

**Cambios:**
- Agregar props: `isLoadingMore`, `hasMore`, `onLoadMore`
- Implementar IntersectionObserver
- Agregar elemento sentinel
- Mostrar skeleton de "loading more" al final

```typescript
import { useRef, useEffect } from "react"

interface SearchResultsProps {
  ...
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export function SearchResults({
  ...
  isLoadingMore,
  hasMore,
  onLoadMore,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver para infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, onLoadMore])

  return (
    <div className="...">
      {/* Grid de resultados */}
      <div className="grid ...">
        {places.map(...)}
      </div>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="grid grid-cols-4 gap-3 mt-3">
          {[...Array(4)].map((_, i) => (
            <SearchResultCardSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      {hasMore && !isLoadingMore && (
        <div ref={sentinelRef} className="h-10" />
      )}

      {/* End of results message */}
      {!hasMore && places.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No hay más resultados
        </p>
      )}
    </div>
  )
}
```

---

## Data Flow

```
User scrolls → Sentinel visible → IntersectionObserver triggers
    ↓
onLoadMore() called in SearchResults
    ↓
loadMore() in page.tsx (from usePlaces hook)
    ↓
usePlaces.fetchPlaces(nextPageToken)
    ↓
API: /api/explore/places?pageToken=...
    ↓
New places appended to state
    ↓
SearchResults re-renders with more items
    ↓
Map updates with new pins
```

---

## Edge Cases

1. **Cambio de categoría**: `usePlaces` ya resetea el estado automáticamente
2. **Búsqueda de texto activa**: Infinite scroll deshabilitado (solo categorías)
3. **Error en loadMore**: El hook ya maneja errores, no afecta items existentes
4. **API delay de Google**: Token válido después de ~2s, el hook ya maneja esto

---

## Testing Checklist

### Cambio 1: Atracciones Default
- [ ] Chip "Atracciones" aparece primero (izquierda)
- [ ] Al abrir la página, "Atracciones" está seleccionada
- [ ] Se cargan atracciones inicialmente (no restaurantes)

### Cambio 2: Infinite Scroll
- [ ] Scroll hacia abajo carga más resultados automáticamente
- [ ] Skeleton aparece mientras carga
- [ ] Nuevos items se agregan al final (no reemplazan)
- [ ] Pins del mapa se actualizan con nuevos lugares
- [ ] Al cambiar categoría, la lista se resetea
- [ ] Mensaje "No hay más resultados" aparece al final
- [ ] Sin duplicados en la lista

---

## Files Summary

| File | Changes |
|------|---------|
| `src/types/search.ts` | Reordenar `SEARCH_CATEGORY_CHIPS` |
| `src/app/trips/[id]/search/page.tsx` | Default category + expose pagination props |
| `src/components/search/SearchPage.tsx` | Add pagination props |
| `src/components/search/SearchResults.tsx` | IntersectionObserver + sentinel + loading state |
