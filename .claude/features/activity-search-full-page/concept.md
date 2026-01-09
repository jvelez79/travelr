# Feature Concept: Explore Full Page

## Resumen Ejecutivo

**Problema:** Actualmente la busqueda de actividades usa un modal full-screen (`ExploreModal`) que, aunque funcional, rompe el flujo de navegacion al sentirse "superpuesto" sobre el canvas. El usuario no puede usar el back button del navegador ni tiene la percepcion de haber cambiado de contexto.

**Solucion propuesta:** Transformar el ExploreModal en una pagina completa (`/trips/[id]/search`) siguiendo el patron ya establecido por la Explore Page (`/trips/[id]/explore`). Cuando el usuario quiera agregar o buscar una actividad, navega a una pagina dedicada en lugar de abrir un modal.

**Beneficio principal:** Experiencia de navegacion mas natural con soporte de browser history (back button), mejor rendimiento al no tener overlay sobre el canvas, y consistencia con el patron de Explore Page existente.

---

## Casos de Uso Principales

### CU-1: Agregar actividad a un dia

**Actor:** Usuario en el canvas de planificacion
**Trigger:** Click en "Agregar actividad" en un dia del itinerario
**Flujo actual (modal):**
1. Usuario hace click en "+ Agregar actividad" en un dia
2. Se abre ExploreModal sobre el canvas
3. Usuario busca y selecciona lugar
4. Modal se cierra, actividad agregada

**Flujo propuesto (pagina):**
1. Usuario hace click en "+ Agregar actividad" en un dia
2. Navegacion a `/trips/[id]/search?day=3&location=Antigua+Guatemala&mode=add`
3. Usuario busca y selecciona lugar
4. Click en back o "Volver al canvas" regresa a `/trips/[id]/planning`
5. Actividad ya esta agregada al plan

### CU-2: Reemplazar actividad existente (Buscar opciones)

**Actor:** Usuario viendo detalles de una actividad placeholder
**Trigger:** Click en "Buscar [restaurantes/atracciones/etc.]"
**Flujo actual:**
1. Usuario ve actividad tipo "Almuerzo en restaurante local"
2. Click en "Buscar Restaurantes"
3. ExploreModal abre con categoria preseleccionada
4. Usuario selecciona lugar real
5. Actividad placeholder se reemplaza

**Flujo propuesto:**
1. Usuario ve actividad tipo "Almuerzo en restaurante local"
2. Click en "Buscar Restaurantes"
3. Navegacion a `/trips/[id]/search?day=2&mode=replace&activityId=xyz&category=restaurants&name=Almuerzo`
4. Usuario selecciona lugar real
5. Back navega a canvas con actividad ya reemplazada

### CU-3: Cambiar de dia durante la busqueda

**Actor:** Usuario en la pagina de busqueda
**Contexto:** Usuario esta buscando para el dia 3 pero quiere agregar al dia 5
**Flujo propuesto:**
1. Usuario esta en `/trips/[id]/search?day=3...`
2. Usa selector de dia en header para cambiar a dia 5
3. URL se actualiza a `?day=5...` (shallow navigation)
4. Al agregar actividad, se agrega al dia 5

---

## Requisitos Funcionales Clave

### RF-1: Nueva ruta de busqueda
- Crear pagina `/trips/[id]/search/page.tsx`
- Soportar query params: `day`, `location`, `mode`, `activityId`, `category`, `name`
- Mantener estado en URL para shareability y browser history

### RF-2: Preservar funcionalidad completa del ExploreModal
La nueva pagina debe mantener todas las capacidades actuales:
- Busqueda por texto (Google Places Text Search)
- Categorias: Atracciones, Restaurantes, Cafes, Naturaleza, Bares, Museos
- Discovery Chips (Hidden Gems, Top Rated, etc.)
- Filtros: Rating minimo, Abierto ahora
- Vista split: Lista + Mapa (desktop) / Toggle (mobile)
- Panel de detalles de lugar
- Infinite scroll para categoria
- Selector de dia destino

### RF-3: Integracion con el plan
- Al agregar lugar, actualizar plan via API/Zustand
- El lugar debe aparecer inmediatamente al volver al canvas
- Soportar ambos modos: `add` (nueva actividad) y `replace` (reemplazar existente)

### RF-4: Navegacion coherente
- Header con back button que regresa a `/trips/[id]/planning`
- Titulo contextual: "Explorar en [Location]" o "Buscar: [Activity Name]"
- Browser back button debe funcionar correctamente

### RF-5: Estado persistente durante la sesion
- Si el usuario navega "atras" y luego "adelante", la busqueda debe preservarse
- Considerar usar URL state vs React state

---

## Consideraciones Tecnicas y Riesgos

### R-1: Perdida de estado del canvas (ALTO)
**Riesgo:** Al navegar fuera del canvas, el estado de React (selecciones, scroll position, panel abierto) se pierde.

**Mitigacion propuesta:**
- El estado del plan ya se persiste en Supabase/API
- Scroll position puede guardarse en sessionStorage antes de navegar
- Al regresar, restaurar scroll al dia que se estaba editando

### R-2: Latencia percibida (MEDIO)
**Riesgo:** Navegacion entre paginas puede sentirse mas lenta que abrir un modal.

**Mitigacion propuesta:**
- Usar `next/link` con prefetch para precarga
- Skeleton loading mientras se carga la pagina de busqueda
- Considerar `router.push` con shallow routing donde sea posible

### R-3: Duplicacion de codigo (MEDIO)
**Riesgo:** Mucha logica del ExploreModal es reutilizable pero esta acoplada al Dialog.

**Mitigacion propuesta:**
- Extraer la logica core a un hook `useExploreSearch`
- Extraer el layout interno a un componente `ExploreContent`
- Reutilizar componentes existentes: `PlaceCard`, `ExploreMap`, `PlaceDetailPanel`, `DiscoveryChips`

### R-4: Actualizacion del plan desde pagina externa (MEDIO)
**Riesgo:** Actualmente `onAddPlace` pasa por props desde el canvas. En pagina separada necesitamos otra estrategia.

**Mitigacion propuesta:**
- Usar mutation hook existente (`usePlanUpdate` o similar)
- Alternativamente, llamar API directamente y invalidar cache
- El hook de `useTrip` o `usePlan` ya maneja revalidacion

### R-5: Limpieza del CanvasContext (BAJO)
**Riesgo:** El `CanvasContext` expone `openExploreModal` y `exploreModalState` que dejarian de usarse.

**Mitigacion propuesta:**
- Deprecar gradualmente, no eliminar inmediatamente
- Actualizar llamadas a `openExploreModal` por `router.push`
- Remover codigo muerto en fase posterior

---

## Estructura Propuesta de Alto Nivel

```
src/
├── app/
│   └── trips/
│       └── [id]/
│           ├── planning/         # Canvas existente
│           ├── explore/          # Things To Do (existente)
│           └── search/           # NUEVA pagina de busqueda
│               └── page.tsx
│
├── components/
│   └── explore/
│       ├── ExploreModal.tsx      # DEPRECAR gradualmente
│       ├── ExploreContent.tsx    # NUEVO: contenido extraido
│       ├── PlaceCard.tsx         # Reutilizar
│       ├── ExploreMap.tsx        # Reutilizar
│       ├── PlaceDetailPanel.tsx  # Reutilizar
│       └── DiscoveryChips.tsx    # Reutilizar
│
└── hooks/
    └── explore/
        └── useExploreSearch.ts   # NUEVO: logica extraida
```

---

## Puntos de Invocacion a Modificar

| Archivo | Linea | Accion Actual | Accion Nueva |
|---------|-------|---------------|--------------|
| `CentralPanel.tsx` | 58 | `openExploreModal(...)` | `router.push(/trips/${id}/search?...)` |
| `ActivityDetails.tsx` | 282 | `openExploreModal(...)` | `router.push(/trips/${id}/search?...)` |
| `CanvasContext.tsx` | - | Expone `openExploreModal` | Deprecar o redirigir |

---

## Criterios de Exito

1. **Funcional:** Usuario puede agregar y reemplazar actividades igual que antes
2. **Navegacion:** Back button funciona correctamente
3. **Performance:** Tiempo de carga de pagina < 500ms con skeleton
4. **Consistencia:** UI sigue el mismo patron que Explore Page
5. **Mobile:** Funciona correctamente en mobile con toggle lista/mapa

---

## Fuera de Alcance (MVP)

- Persistencia de busqueda entre sesiones (solo sesion actual)
- Deep linking a un lugar especifico en busqueda
- Comparacion de lugares lado a lado
- Guardar busquedas favoritas

---

## Siguiente Paso

Una vez aprobado este concepto, el Feature Architect debe producir una especificacion tecnica detallada con:
- Schema de query params
- Contratos de API
- Estructura de componentes
- Plan de migracion del modal
