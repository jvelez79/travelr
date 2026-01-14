# Tasks: Search - Atracciones Default + Infinite Scroll

## Task List

### Task 1: Reordenar categorías (Atracciones primero)
**File:** `src/types/search.ts`
**Complexity:** Simple
**Action:** Mover el objeto con `id: "attractions"` al inicio del array `SEARCH_CATEGORY_CHIPS`

### Task 2: Establecer Atracciones como categoría default
**File:** `src/app/trips/[id]/search/page.tsx`
**Complexity:** Simple
**Action:** Cambiar inicialización de `selectedCategory` de `null` a `"attractions"`

### Task 3: Actualizar tipo de selectedCategory
**File:** `src/app/trips/[id]/search/page.tsx`
**Complexity:** Simple
**Action:** Actualizar el tipo de estado y ajustar condición `enabled` en `usePlaces`

### Task 4: Extraer props de paginación del hook usePlaces
**File:** `src/app/trips/[id]/search/page.tsx`
**Complexity:** Medium
**Action:** Extraer `loadMore`, `hasMore`, `isLoadingMore` y pasarlos a SearchPage

### Task 5: Agregar props de paginación a SearchPage
**File:** `src/components/search/SearchPage.tsx`
**Complexity:** Simple
**Action:** Agregar interface props y pasar a SearchResults

### Task 6: Implementar infinite scroll en SearchResults
**File:** `src/components/search/SearchResults.tsx`
**Complexity:** Medium
**Action:**
- Agregar props de paginación
- Implementar IntersectionObserver
- Agregar elemento sentinel
- Mostrar skeleton de loading more
- Mensaje de "no más resultados"

### Task 7: Build y verificación
**Complexity:** Simple
**Action:** Ejecutar `npm run build` y verificar que no hay errores

---

## Execution Order

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
```

## Estimated Effort
- Tasks 1-3: ~5 minutos (cambios simples)
- Tasks 4-6: ~15 minutos (implementación principal)
- Task 7: ~2 minutos (verificación)

**Total: ~20-25 minutos**
