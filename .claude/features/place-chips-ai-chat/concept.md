# Feature Concept: Place Chips Interactivos en AI Chat

## Resumen Ejecutivo

Transformar las referencias a lugares en el AI Chat de Travelr de texto plano a **chips interactivos inline** que muestran nombre y rating. Los chips permiten tres acciones principales: ver detalles en modal, agregar al itinerario mediante selector de día, y drag & drop directo al canvas. La implementación aprovecha el sistema existente de tool calling y Google Places API.

**Impacto esperado:** Reducir la fricción entre "el AI sugiere un lugar" y "el usuario lo agrega a su itinerario" de múltiples pasos manuales a una sola interacción.

## Problema

El AI Chat muestra lugares como texto plano sin interactividad. Los usuarios no pueden actuar directamente sobre las sugerencias del AI para agregarlas a su itinerario, creando fricción en el flujo de planificación.

## Usuarios

Usuarios de Travelr que interactúan con el AI Chat para descubrir lugares y agregarlos a su planificación de viaje.

## Propuesta de Valor

Convertir sugerencias de texto en elementos accionables que reducen fricción: de "el AI me sugirió X" a "agregué X a mi itinerario" en un click o drag. Experiencia fluida tanto en desktop como mobile.

## Decisiones Clave

| Aspecto | Decisión |
|---------|----------|
| **Contenido del chip** | Mínimo: nombre + rating (★ 4.2) |
| **Layout** | Inline en el texto del mensaje |
| **Interacciones desktop** | Click → modal, Hover → tooltip, Drag & drop al timeline |
| **Interacciones mobile** | Tap → modal con botón agregar |
| **Agregar a itinerario** | Dropdown selector de día |
| **Sin place_id** | Mostrar como texto normal |
| **Formato AI** | Tool calling con sintaxis `[[place:PLACE_ID]]` |

## User Stories

| ID | Historia | Criterios de Aceptación |
|----|----------|------------------------|
| US1 | Como usuario, cuando el AI me sugiere lugares, veo chips inline con nombre y rating | - Chip muestra nombre truncado (max ~25 chars) + rating (★ 4.2) - Chip aparece inline donde el AI menciona el lugar - Chip tiene estilo visual distintivo |
| US2 | Como usuario en desktop, puedo hacer click en un chip para ver detalles | - Click abre PlaceDetailsModal existente - Modal muestra info completa: fotos, descripción, horarios, reviews - Modal tiene botón "Agregar al itinerario" |
| US3 | Como usuario en desktop, al hacer hover veo preview rápido | - Hover muestra tooltip con: foto thumbnail, categoría, precio, dirección corta - Delay de 300ms antes de mostrar tooltip |
| US4 | Como usuario, puedo agregar un lugar seleccionando el día | - Botón/icono "+" visible en el chip - Click en "+" abre dropdown con lista de días del viaje - Seleccionar día agrega el lugar como actividad |
| US5 | Como usuario en desktop, puedo arrastrar chip al timeline | - Chip es draggable con @dnd-kit - Drop zones son los días del timeline - Drop exitoso agrega actividad |
| US6 | Como usuario en mobile, tap abre modal con agregar | - Tap en chip abre PlaceDetailsModal - Modal incluye botón "Agregar al itinerario" - Botón agregar abre selector de día |
| US7 | Como usuario, lugares no identificados aparecen como texto | - Si el AI menciona un lugar sin place_id, se muestra como texto normal |

## Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────────┐
│                     Flujo de Datos                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Usuario envía mensaje al AI Chat                            │
│  2. AI llama tool: search_places({ query, location, types })    │
│  3. Tool retorna array de lugares con place_id + metadata       │
│  4. AI genera respuesta con referencias: [[place:PLACE_ID]]     │
│  5. ChatContext almacena mapa: place_id → PlaceData             │
│  6. MessageRenderer parsea [[place:ID]] → <PlaceChip />         │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes a Crear/Modificar

| Componente | Acción | Descripción |
|------------|--------|-------------|
| `PlaceChip.tsx` | **Nuevo** | Chip compacto: nombre + rating, draggable |
| `PlaceChipTooltip.tsx` | **Nuevo** | Preview en hover con foto y detalles |
| `DaySelectorDropdown.tsx` | **Nuevo** | Selector de día para agregar |
| `MessageRenderer.tsx` | **Modificar** | Parser para detectar `[[place:ID]]` |
| `ChatContext.tsx` | **Modificar** | Almacenar mapa de place_id → datos del lugar |
| `search_places` tool | **Modificar** | Asegurar que retorna place_id estructurado |

## Diseño Visual

```
┌─ Chip Default ─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────┐                           │
│  │ 🏨 Hotel Ritz Mad... ★ 4.7 [+] │  ← bg-slate-100            │
│  └─────────────────────────────────┘    rounded-full, px-3 py-1│
└─────────────────────────────────────────────────────────────────┘

┌─ Mensaje con chips inline ─────────────────────────────────────┐
│  🤖 Encontré estas opciones para tu estancia en Madrid:        │
│                                                                 │
│  Para una experiencia de lujo, te recomiendo                   │
│  [🏨 Hotel Ritz Mad... ★ 4.7 +] que está justo en el          │
│  centro. Si prefieres algo más moderno,                        │
│  [🏨 VP Plaza Esp... ★ 4.3 +] tiene vistas increíbles.        │
└─────────────────────────────────────────────────────────────────┘
```

## Consideraciones UX

| Aspecto | Desktop | Mobile |
|---------|---------|--------|
| Click/Tap | Abre modal de detalles | Abre modal de detalles |
| Hover | Tooltip con preview (300ms) | N/A |
| Agregar | Dropdown desde botón "+" | Botón en modal |
| Drag & drop | Sí, a días del timeline | No disponible |

## Métricas de Éxito

- % de lugares sugeridos por AI que se agregan al itinerario
- Tiempo promedio desde sugerencia hasta agregar al itinerario
- Distribución de uso entre drag & drop vs botón agregar

## Fases de Implementación

1. **Fundamentos** - Backend + parsing de mensajes
2. **Componente Base** - PlaceChip con estados visuales
3. **Interacciones** - Tooltip + dropdown agregar
4. **Drag & Drop** - Integración con @dnd-kit
5. **Mobile + Polish** - Adaptación touch + refinamiento
