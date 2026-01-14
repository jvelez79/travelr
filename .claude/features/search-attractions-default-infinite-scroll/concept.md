# Concept: Search - Atracciones Default + Infinite Scroll

## Resumen Ejecutivo

Dos mejoras a la pantalla de búsqueda de lugares (`/trips/[id]/search`):

1. **Categoría Atracciones como default**: Reordenar los chips de categorías para que "Atracciones" aparezca primero (izquierda) y sea la categoría seleccionada por defecto al abrir la pantalla.

2. **Infinite Scroll en resultados**: Implementar carga automática de más lugares mientras el usuario hace scroll, eliminando la necesidad de botones "Cargar más".

---

## Cambio 1: Atracciones como Categoría Default

### Estado Actual
- Orden de categorías: Restaurantes, Cafés, Atracciones, Naturaleza, Compras, Vida Nocturna
- Categoría default al abrir: Restaurantes

### Estado Deseado
- Orden de categorías: **Atracciones**, Restaurantes, Cafés, Naturaleza, Compras, Vida Nocturna
- Categoría default al abrir: **Atracciones**

### Comportamiento Esperado
1. Usuario navega a `/trips/[id]/search`
2. El chip "Atracciones" aparece primero (más a la izquierda)
3. El chip "Atracciones" está visualmente seleccionado (estilo activo)
4. El grid muestra resultados de atracciones turísticas del destino
5. El mapa muestra pins de las atracciones cargadas

---

## Cambio 2: Infinite Scroll / Lazy Loading

### Estado Actual
- Se cargan 20 resultados iniciales
- No hay mecanismo para cargar más resultados
- Usuario no sabe si hay más lugares disponibles

### Estado Deseado
- Se cargan 20 resultados iniciales
- Al hacer scroll cerca del final de la lista, se cargan automáticamente 20 más
- Se muestra indicador de carga mientras se obtienen nuevos resultados
- El proceso continúa hasta que no hay más resultados disponibles

### Comportamiento Esperado

#### Carga Inicial
1. Usuario abre la pantalla de búsqueda
2. Se cargan los primeros 20 resultados de la categoría default (Atracciones)
3. Grid muestra las 20 cards de lugares

#### Lazy Loading
1. Usuario hace scroll hacia abajo en el grid de resultados
2. Cuando el usuario está cerca del final (ej: últimos 3-4 items visibles), se detecta con IntersectionObserver
3. Se muestra un skeleton/spinner al final de la lista
4. Se hace request a Google Places API con el `next_page_token` para obtener los siguientes 20 resultados
5. Los nuevos resultados se agregan al final del grid (sin reemplazar los existentes)
6. Los nuevos pins se agregan al mapa
7. El proceso se repite mientras haya más resultados

#### Fin de Resultados
1. Cuando Google Places no retorna `next_page_token`, significa que no hay más resultados
2. Se deja de mostrar el indicador de carga
3. Opcionalmente: mostrar mensaje sutil "No hay más resultados"

### Consideraciones Técnicas

#### Google Places API Pagination
- La API de Google Places retorna un `next_page_token` cuando hay más resultados
- Este token se debe usar en el siguiente request para obtener la siguiente página
- Hay un delay de ~2 segundos antes de que el token sea válido (documentado por Google)

#### IntersectionObserver
- Usar un elemento "sentinel" al final de la lista
- Cuando el sentinel es visible, disparar la carga de más resultados
- Configurar threshold apropiado (ej: 0.1 para cargar antes de que el usuario llegue al final)

#### Estado
- Mantener en estado: `results[]`, `nextPageToken`, `isLoadingMore`, `hasMore`
- Cuando cambia la categoría, resetear todo el estado y cargar desde cero

---

## Criterios de Aceptación

### Cambio 1: Atracciones Default
- [ ] El chip "Atracciones" aparece en primera posición (izquierda)
- [ ] Al abrir `/trips/[id]/search`, "Atracciones" está seleccionada visualmente
- [ ] Al abrir la pantalla, se cargan y muestran atracciones (no restaurantes)
- [ ] Los demás chips mantienen su funcionalidad (click cambia categoría)

### Cambio 2: Infinite Scroll
- [ ] Al hacer scroll hacia abajo, se cargan automáticamente más resultados
- [ ] Se muestra indicador de carga mientras se obtienen nuevos resultados
- [ ] Los nuevos resultados se agregan al final (no reemplazan los existentes)
- [ ] Los nuevos pins aparecen en el mapa
- [ ] Cuando no hay más resultados, deja de intentar cargar
- [ ] Al cambiar de categoría, se resetea la lista y carga desde cero
- [ ] No hay duplicados en la lista de resultados
- [ ] El scroll es fluido (no hay "jumps" al cargar más items)

---

## Fuera de Alcance
- Modificar el diseño visual de las cards
- Cambiar el layout del mapa
- Agregar nuevas categorías
- Filtros adicionales dentro de cada categoría
