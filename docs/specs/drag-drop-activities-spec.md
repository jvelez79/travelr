# Spec: Drag & Drop de Actividades en el Canvas

**Fecha:** 2026-01-12
**Status:** Ready for Development
**Alcance:** Feature

---

## Resumen

Sistema de drag and drop avanzado para el Canvas de Travelr que permite:
1. Mover actividades entre días del timeline
2. Arrastrar ideas guardadas (Things To Do) hacia días del Canvas
3. Mover actividades del Canvas hacia Ideas Guardadas (solo con Google Place ID)

**Restricción de plataforma:** Solo funciona en desktop. En móvil se usa el botón "Agregar a día" existente.

---

## Problema

Actualmente el usuario puede hacer drag de lugares desde búsqueda hacia días, pero no puede:
- Mover actividades desde Ideas Guardadas hacia días mediante drag
- Mover actividades del Canvas hacia Ideas Guardadas para "postergarlas"

Esto limita la flexibilidad para reorganizar el itinerario de forma fluida e intuitiva.

---

## User Stories

### US1: Mover actividad entre días
**Como** usuario planificando un viaje
**Quiero** arrastrar una actividad de un día a otro
**Para** reorganizar mi itinerario sin usar menús

**Criterios de aceptación:**
- [ ] Puedo hacer drag de cualquier actividad del timeline
- [ ] Al soltar en otro día, la actividad se mueve
- [ ] La actividad original se elimina del día origen
- [ ] El horario se mantiene si no hay conflicto, sino va al final
- [ ] La actividad se inserta en posición cronológica según su hora

### US2: Agregar idea guardada a un día
**Como** usuario con ideas guardadas
**Quiero** arrastrar una idea directamente a un día específico
**Para** agregarla al itinerario sin pasar por modales

**Criterios de aceptación:**
- [ ] Puedo hacer drag de items en la sección "Things To Do"
- [ ] Al soltar en un día, se crea una nueva actividad
- [ ] La idea se elimina automáticamente de Ideas Guardadas
- [ ] La actividad se inserta al final del día (sin hora predefinida)

### US3: Mover actividad a Ideas Guardadas
**Como** usuario que quiere postergar una actividad
**Quiero** arrastrar una actividad del Canvas hacia Ideas Guardadas
**Para** guardarla sin eliminarla completamente

**Criterios de aceptación:**
- [ ] Solo actividades con Google Place ID pueden moverse a Ideas Guardadas
- [ ] Actividades sin Place ID muestran zona de drop deshabilitada (gris)
- [ ] Al soltar, la actividad se elimina del día y aparece en Ideas Guardadas
- [ ] Se preserva la información del lugar (nombre, rating, imágenes, etc.)

### US4: Feedback visual durante drag
**Como** usuario
**Quiero** ver claramente dónde puedo soltar elementos
**Para** saber qué acciones son válidas

**Criterios de aceptación:**
- [ ] Las zonas de drop válidas se resaltan al arrastrar
- [ ] Las zonas inválidas (ej: Ideas Guardadas para actividad sin Place ID) se muestran grises/deshabilitadas
- [ ] El elemento arrastrado tiene un preview visual (ya implementado)

---

## Especificación Técnica

### Tipos de Drag Existentes

```typescript
type DragItemType = "place" | "timeline-activity"
```

### Nuevos Tipos de Drag

```typescript
type DragItemType = "place" | "timeline-activity" | "saved-idea"

interface SavedIdeaDragData {
  type: "saved-idea"
  savedPlace: SavedPlace  // From src/types/plan.ts
}
```

### Nuevas Zonas de Drop

| Zona | Acepta | Comportamiento |
|------|--------|----------------|
| `day-drop-zone` (existente) | place, timeline-activity, saved-idea | Agrega/mueve al día |
| `ideas-drop-zone` (nuevo) | timeline-activity (solo con placeId) | Mueve a Ideas Guardadas |

### Lógica de Horarios

```typescript
function calculateNewTime(
  activity: TimelineEntry,
  targetDay: ItineraryDay
): string | null {
  const originalTime = activity.time // "10:00 AM"

  // Si la actividad no tiene hora (viene de Ideas), retornar null (al final)
  if (!originalTime) return null

  // Verificar si hay conflicto en el día destino
  const hasConflict = targetDay.timeline.some(entry =>
    entry.time === originalTime
  )

  // Si no hay conflicto, mantener hora original
  if (!hasConflict) return originalTime

  // Si hay conflicto, retornar null para insertar al final
  return null
}
```

### Lógica de Inserción

```typescript
function getInsertionIndex(
  timeline: TimelineEntry[],
  newTime: string | null
): number {
  // Si no hay hora, insertar al final
  if (!newTime) return timeline.length

  // Insertar en posición cronológica
  const timeToMinutes = (time: string) => {
    // Convertir "10:00 AM" a minutos desde medianoche
    // ... implementación
  }

  const newMinutes = timeToMinutes(newTime)

  for (let i = 0; i < timeline.length; i++) {
    if (timeToMinutes(timeline[i].time) > newMinutes) {
      return i
    }
  }

  return timeline.length
}
```

### Validación para Ideas Guardadas

```typescript
function canDropToIdeas(activity: TimelineEntry): boolean {
  // Solo permitir si tiene Google Place ID
  return !!activity.placeId
}
```

### Conversión Activity → SavedPlace

```typescript
function activityToSavedPlace(activity: TimelineEntry): SavedPlace {
  return {
    id: crypto.randomUUID(),
    name: activity.activity,
    category: activity.placeData?.category,
    location: activity.placeData?.coordinates ? {
      lat: activity.placeData.coordinates.lat,
      lng: activity.placeData.coordinates.lng,
      address: activity.placeData.address,
    } : undefined,
    rating: activity.placeData?.rating,
    reviewCount: activity.placeData?.reviewCount,
    priceLevel: activity.placeData?.priceLevel,
    images: activity.placeData?.images,
    phone: activity.placeData?.phone,
    website: activity.placeData?.website,
    openingHours: activity.placeData?.openingHours,
    sourceInfo: {
      source: 'google',
      sourceId: activity.placeId,
      googleMapsUrl: activity.placeData?.googleMapsUrl,
    },
    addedAt: new Date().toISOString(),
    notes: activity.notes,
  }
}
```

---

## Cambios en Componentes

### CanvasDndContext.tsx
- Agregar tipo `saved-idea` a `DragItemType`
- Agregar handler para drop en `ideas-drop-zone`
- Agregar nuevo callback: `onMoveActivityToIdeas`
- Agregar nuevo callback: `onDropIdeaOnDay`

### ThingsToDoSection.tsx (o equivalente)
- Hacer items draggables con `useDraggable` de @dnd-kit
- Configurar `data` con tipo `saved-idea`
- Agregar zona de drop con `useDroppable`
- Mostrar estado visual cuando se arrastra sobre ella
- Mostrar zona deshabilitada si el item arrastrado no tiene Place ID

### Timeline/DayColumn (o equivalente)
- Ya es zona de drop, verificar que acepta `saved-idea`

### Responsive
- Detectar si es móvil (`useMediaQuery` o similar)
- Deshabilitar drag en móvil
- Mostrar solo botón "Agregar a día" en móvil

---

## UI/UX

### Estados Visuales de Drop Zone

| Estado | Apariencia |
|--------|------------|
| **Inactivo** | Normal, sin highlight |
| **Hover válido** | Borde primary, fondo con opacity, texto "Soltar aquí" |
| **Hover inválido** | Borde gris, fondo gris claro, texto "No disponible" o icono de prohibido |
| **Recibiendo** | Animación de "absorber" el elemento |

### Drag Overlay (existente, mantener)
- Preview compacto del elemento arrastrado
- Sigue el cursor
- Sombra para indicar que está "flotando"

### Botón "Agregar a día" (mejorar)
- Mantener funcionalidad actual
- Mejorar diseño visual (pendiente de definir)
- Es la única opción en móvil

---

## Flujo de Datos

### Mover entre días

```
1. User drag activity from Day 1
2. CanvasDndContext.onDragStart → setActiveItem
3. User drops on Day 3
4. CanvasDndContext.onDragEnd:
   - Calcular newTime (mantener o al final)
   - Calcular insertionIndex
   - Llamar onMoveActivity(activityId, fromDay=1, toDay=3, newTime)
5. Parent component:
   - Actualizar estado local (optimistic)
   - Persistir en Supabase
```

### Mover de Ideas a Día

```
1. User drag from ThingsToDoSection
2. CanvasDndContext.onDragStart → setActiveItem (type: saved-idea)
3. User drops on Day 2
4. CanvasDndContext.onDragEnd:
   - Llamar onDropIdeaOnDay(savedPlace, dayNumber=2)
5. Parent component:
   - Convertir SavedPlace → TimelineEntry
   - Agregar al día (al final, sin hora)
   - Eliminar de savedPlaces
   - Persistir en Supabase
```

### Mover de Día a Ideas

```
1. User drag activity from Day 2
2. CanvasDndContext.onDragStart → setActiveItem (type: timeline-activity)
3. User drops on ThingsToDoSection (ideas-drop-zone)
4. Validar: activity.placeId existe?
   - Si no existe: cancelar drop (zona ya estaba gris)
   - Si existe: continuar
5. CanvasDndContext.onDragEnd:
   - Llamar onMoveActivityToIdeas(activity, fromDay=2)
6. Parent component:
   - Convertir TimelineEntry → SavedPlace
   - Agregar a savedPlaces
   - Eliminar del día
   - Persistir en Supabase
```

---

## Restricciones

1. **Solo desktop:** Drag and drop deshabilitado en pantallas < 1024px
2. **Solo con Place ID:** Actividades sin Google Place ID no pueden ir a Ideas Guardadas
3. **Eliminación automática:** Al mover de Ideas → Día, se elimina de Ideas
4. **Sin duplicados:** Una actividad no puede estar en Ideas Y en el timeline simultáneamente

---

## Out of Scope (Futuro)

- [ ] Reordenar actividades dentro del mismo día (sortable)
- [ ] Drag múltiple (seleccionar varias actividades)
- [ ] Undo/Redo de operaciones de drag
- [ ] Drag desde búsqueda de Google Places al sidebar de Ideas
- [ ] Animaciones elaboradas de transición

---

## Métricas de Éxito

- **Adopción:** 60%+ de reorganizaciones de itinerario vía drag (vs botones/modales)
- **Uso móvil:** El botón "Agregar a día" mantiene su uso en móvil
- **Errores:** < 1% de operaciones de drag fallidas

---

## Checklist de Implementación

- [ ] Extender CanvasDndContext con nuevos tipos y handlers
- [ ] Hacer ThingsToDoSection items draggables
- [ ] Agregar drop zone en ThingsToDoSection
- [ ] Implementar lógica de horarios (mantener/al final)
- [ ] Implementar lógica de inserción cronológica
- [ ] Agregar validación de Place ID para Ideas
- [ ] Implementar conversión Activity ↔ SavedPlace
- [ ] Agregar estados visuales de drop zones
- [ ] Deshabilitar en móvil
- [ ] Mejorar botón "Agregar a día"
- [ ] Tests unitarios de lógica de horarios
- [ ] Tests de integración de drag operations
- [ ] Persistencia en Supabase
