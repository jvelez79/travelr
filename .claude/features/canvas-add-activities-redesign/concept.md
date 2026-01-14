# Feature: Pantalla Search Fullscreen

## Resumen
Nueva pantalla fullscreen 'Search' para búsqueda de lugares, independiente de Explore. Accesible desde el header del canvas. Incluye mapa interactivo estilo AirBnB con sincronización bidireccional, grid de resultados en columnas, barra de búsqueda y filtros por categoría.

## Problema
El panel derecho actual es demasiado pequeño para mostrar resultados de búsqueda de forma efectiva. El usuario necesita ver múltiples opciones simultáneamente en un layout de grid, con un mapa que ayude a visualizar ubicaciones y permita exploración geográfica.

## Usuarios
Viajeros planificando su itinerario que quieren buscar lugares específicos para añadir a sus días.

## Propuesta de Valor
Experiencia de búsqueda dedicada estilo AirBnB que permite:
1. Buscar lugares específicos por texto
2. Filtrar por categoría con chips
3. Ver resultados en grid con hover bidireccional al mapa
4. Explorar geográficamente con clustering inteligente
5. Preview rápido desde pins con acción de añadir

## Decisiones de Diseño

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| Tipo de pantalla | Fullscreen separada de Explore | Necesita espacio para mapa + grid |
| Ruta | `/trips/[id]/search` | Consistente con `/trips/[id]/explore` |
| Acceso | Botón en Header (junto a Explore) | Mismo nivel jerárquico, siempre visible |
| Layout | Grid (~60%) + Mapa (~40%) | Patrón AirBnB probado |
| Mapa | Pins + clustering + popup preview | Best practice AirBnB |
| Interacción | Hover bidireccional grid ↔ mapa | UX fluida de exploración |
| Sincronización | Bidireccional | Buscar → ajusta mapa, mover mapa → actualiza resultados |
| Filtros | Búsqueda + chips de categoría | Flexibilidad texto libre + filtrado rápido |
| Añadir lugar | DaySelectorDropdown | Reutiliza componente existente |

## Alcance MVP

1. Nueva ruta: `/trips/[id]/search`
2. Layout: Grid de resultados (izquierda ~60%) + Mapa (derecha ~40%)
3. Header con barra de búsqueda prominente + chips de categoría
4. Mapa interactivo con:
   - Pins por resultado
   - Clustering automático en zonas densas
   - Popup preview al click (foto, nombre, rating, botón añadir)
   - Hover bidireccional con grid
5. Sincronización bidireccional: buscar ajusta mapa, mover mapa actualiza resultados
6. Cada card del grid tiene botón '+' que abre DaySelectorDropdown
7. Popup del mapa también tiene botón 'Añadir' con mismo dropdown
8. Botón 'Search' en header del canvas (junto a Explore)

## User Stories

1. Usuario en canvas → click botón 'Search' en header → navega a pantalla fullscreen
2. Ve barra de búsqueda vacía, mapa centrado en destino del viaje, chips de categoría
3. Escribe 'sushi' → resultados en grid + pins en mapa ajustado
4. Hover en card → pin correspondiente se resalta en mapa
5. Hover en pin → card correspondiente se resalta en grid
6. Click en pin → popup preview con foto, nombre, rating, botón 'Añadir'
7. Zoom out en mapa → resultados se actualizan a nueva área visible
8. Click en chip 'Restaurantes' → filtra solo restaurantes
9. Click '+' en card o 'Añadir' en popup → DaySelectorDropdown → elige día
10. Click 'Volver' → regresa al canvas con lugar añadido

## Requerimientos No Funcionales

- Rendimiento fluido al mover/zoom mapa (debounce ~300ms)
- Clustering dinámico cuando hay >15 pins
- Hover bidireccional sin lag
- Carga progresiva de resultados (20-30 iniciales)
- Responsive: grid+mapa side by side en desktop

## Categorías de Filtros (chips)

- Restaurantes
- Cafés
- Atracciones
- Naturaleza
- Compras
- Vida Nocturna

## Componentes a Crear

```
src/
├── app/trips/[id]/search/
│   └── page.tsx                    # Nueva ruta
├── components/search/
│   ├── SearchPage.tsx              # Container principal
│   ├── SearchHeader.tsx            # Barra búsqueda + chips
│   ├── SearchResults.tsx           # Grid de cards
│   ├── SearchResultCard.tsx        # Card con hover state
│   ├── SearchMap.tsx               # Mapa con pins/clustering
│   └── SearchMapPopup.tsx          # Popup preview del pin
```

## Riesgos

- Dependencia de Google Places API para búsqueda
- Rate limits de Google Maps/Places con sincronización frecuente
- Performance con muchos resultados simultáneos
