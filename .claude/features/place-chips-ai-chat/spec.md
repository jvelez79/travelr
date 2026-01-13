# Especificación Técnica: Place Chips Interactivos en AI Chat

## Resumen

Transformar las referencias a lugares en los mensajes del AI Chat de texto plano a chips interactivos inline que permiten ver detalles, agregar al itinerario y drag & drop. La implementación extiende el sistema existente de tool calling (search_places tools) y aprovecha la arquitectura de PlaceDetailsModal, AddToDropdown y @dnd-kit.

**Enfoque técnico:** Modificar el renderizado de mensajes del assistant para detectar referencias estructuradas `[[place:PLACE_ID]]`, renderizar componentes PlaceChip, y extender el contexto de chat para almacenar un mapa de place_id a datos del lugar.

---

## Arquitectura

### Flujo de Datos

```
1. Usuario envía mensaje → AI Chat API
2. AI ejecuta search_places_nearby o search_place_by_name tool
3. Tool retorna PlaceSearchResult[] con place_id + metadata
4. AI genera respuesta texto con referencias: [[place:PLACE_ID]]
5. Backend persiste mensaje + places_context JSON en agent_messages
6. Frontend: useChatConversation lee mensaje + places_context
7. ChatMessage parsea [[place:PLACE_ID]] → <PlaceChip placeId={...} />
8. PlaceChip busca datos en placesMap del contexto
9. Interacciones: click → modal, drag → timeline, + → dropdown
```

### Componentes Modificados

```
ChatMessage.tsx
  ├─ parsePlaceChips() → detecta [[place:ID]]
  ├─ renderiza array de [text | PlaceChip]
  └─ provee placesMap al PlaceChip

PlaceChip.tsx (NUEVO)
  ├─ Draggable (@dnd-kit)
  ├─ onClick → PlaceDetailsModal
  ├─ Tooltip en hover (desktop)
  └─ Botón "+" → DaySelectorDropdown

CanvasDndProvider
  └─ onDropPlaceChipOnDay handler (nuevo)

agent_messages table (schema change)
  └─ places_context: jsonb (nuevo campo)
```

---

## Componentes

### 1. PlaceChip (NUEVO)

**Ubicación:** `/Users/juanca/Projects/travelr/src/components/ai/PlaceChip.tsx`

**Responsabilidad:** Renderizar un chip inline draggable con nombre + rating del lugar.

**Interface:**

```typescript
interface PlaceChipProps {
  placeId: string
  placeData: PlaceChipData
  days: ItineraryDay[]
  onAddToDay?: (placeId: string, dayNumber: number) => Promise<void>
  onAddToThingsToDo?: (placeId: string) => Promise<void>
}

interface PlaceChipData {
  id: string
  name: string
  rating?: number
  reviewCount?: number
  category?: string
  priceLevel?: 1 | 2 | 3 | 4
  imageUrl?: string
  address?: string
  description?: string
  location: { lat: number; lng: number }
}
```

**Dependencias:**
- `@dnd-kit/core` (useDraggable)
- `PlaceDetailsModal` (para click)
- `PlaceChipTooltip` (para hover en desktop)
- `DaySelectorDropdown` (para botón +)
- `useCanvasContext` (para días del itinerario)

**Estados:**
- Hover (muestra tooltip)
- Dragging (aplica estilos)
- Modal open (abre PlaceDetailsModal)

**Layout:**

```
┌─────────────────────────────────┐
│ 🏨 Hotel Ritz Mad... ★ 4.7 [+] │
└─────────────────────────────────┘
  • bg-slate-100 dark:bg-slate-800
  • rounded-full px-3 py-1
  • inline-flex items-center gap-2
  • hover:bg-slate-200 transition
  • cursor-pointer (desktop) o cursor-default (mobile)
```

---

### 2. PlaceChipTooltip (NUEVO)

**Ubicación:** `/Users/juanca/Projects/travelr/src/components/ai/PlaceChipTooltip.tsx`

**Responsabilidad:** Preview rápido en hover (solo desktop, >=1024px).

**Interface:**

```typescript
interface PlaceChipTooltipProps {
  placeData: PlaceChipData
  isOpen: boolean
  anchorRef: React.RefObject<HTMLElement>
}
```

**Dependencias:**
- `@radix-ui/react-popover` o Tooltip de shadcn/ui
- `next/image` para thumbnail

**Layout:**

```
┌──────────────────────────────────┐
│ [Thumbnail 80x80]                │
│                                  │
│ Hotel Ritz Madrid                │
│ ★ 4.7 (1,234) • $$$              │
│ Gran Vía, Madrid                 │
│                                  │
│ Click para más detalles          │
└──────────────────────────────────┘
  • width: 280px
  • bg-popover, shadow-lg, rounded-lg
  • delay: 300ms antes de mostrar
```

---

### 3. DaySelectorDropdown (NUEVO)

**Ubicación:** `/Users/juanca/Projects/travelr/src/components/ai/DaySelectorDropdown.tsx`

**Responsabilidad:** Selector de día para agregar el lugar al itinerario.

**Interface:**

```typescript
interface DaySelectorDropdownProps {
  days: ItineraryDay[]
  onSelectDay: (dayNumber: number) => Promise<void>
  onAddToThingsToDo: () => Promise<void>
  isLoading?: boolean
}
```

**Dependencias:**
- `@radix-ui/react-dropdown-menu` (shadcn/ui Dropdown)
- Similar lógica a `AddToDropdown` existente pero simplificado

**Items:**

```
┌───────────────────────────────────┐
│ Agregar a lista general           │ ← Things To Do
├───────────────────────────────────┤
│ Día 1 - San José (2 actividades)  │
│ Día 2 - La Fortuna (5 actividades)│
│ Día 3 - Arenal (3 actividades)    │
└───────────────────────────────────┘
```

---

### 4. ChatMessage (MODIFICAR)

**Ubicación:** `/Users/juanca/Projects/travelr/src/components/ai/ChatMessage.tsx`

**Cambios:**

```typescript
// Añadir prop
interface ChatMessageProps {
  message: ChatMessageType
  isLatest: boolean
  onSendMessage?: (message: string) => void
  currentDayNumber?: number
  placesMap?: Record<string, PlaceChipData> // NUEVO
  days?: ItineraryDay[] // NUEVO para chips
}

// Nueva función de parsing
function parsePlaceChips(content: string): Array<{ type: 'text' | 'chip', content: string, placeId?: string }> {
  const chipRegex = /\[\[place:([^\]]+)\]\]/g
  const parts: Array<{ type: 'text' | 'chip', content: string, placeId?: string }> = []
  
  let lastIndex = 0
  let match: RegExpExecArray | null
  
  while ((match = chipRegex.exec(content)) !== null) {
    // Agregar texto antes del chip
    if (match.index > lastIndex) {
      parts.push({ 
        type: 'text', 
        content: content.slice(lastIndex, match.index) 
      })
    }
    
    // Agregar chip
    parts.push({ 
      type: 'chip', 
      content: '',
      placeId: match[1] 
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Agregar texto restante
  if (lastIndex < content.length) {
    parts.push({ 
      type: 'text', 
      content: content.slice(lastIndex) 
    })
  }
  
  return parts
}

// Nuevo rendering en el return
{isAssistant ? (
  <div className="prose prose-sm max-w-none dark:prose-invert">
    {parsePlaceChips(textContent).map((part, idx) => {
      if (part.type === 'text') {
        return <ReactMarkdown key={idx}>{part.content}</ReactMarkdown>
      } else if (part.type === 'chip' && part.placeId && placesMap?.[part.placeId]) {
        return <PlaceChip key={idx} placeId={part.placeId} placeData={placesMap[part.placeId]} days={days || []} />
      }
      return null
    })}
  </div>
) : (
  // ... código existente para user messages
)}
```

**Dependencias:**
- `PlaceChip` (nuevo componente)
- `ItineraryDay[]` (del contexto del canvas)

---

### 5. useChatConversation (MODIFICAR)

**Ubicación:** `/Users/juanca/Projects/travelr/src/hooks/useChatConversation.ts`

**Cambios:**

```typescript
interface UseChatConversationReturn {
  messages: ChatMessage[]
  loading: boolean
  isStreaming: boolean
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  clearHistory: () => Promise<void>
  conversationId: string | null
  canContinue: boolean
  continueConversation: () => Promise<void>
  placesMap: Record<string, PlaceChipData> // NUEVO
}

// En loadHistory():
const chatMessages: ChatMessage[] = (data || []).map((msg) => ({
  id: msg.id,
  role: msg.role as 'user' | 'assistant' | 'system',
  content: msg.content,
  timestamp: msg.created_at,
  toolCalls: msg.tool_calls ? (msg.tool_calls as unknown as ToolCall[]) : undefined,
  isStreaming: false,
}))

// NUEVO: Agregar lógica para parsear places_context
const placesContext: Record<string, PlaceChipData> = {}
data.forEach(msg => {
  if (msg.places_context) {
    Object.assign(placesContext, msg.places_context)
  }
})

setMessages(chatMessages)
setPlacesMap(placesContext) // Nuevo estado
```

**Nuevo estado:**

```typescript
const [placesMap, setPlacesMap] = useState<Record<string, PlaceChipData>>({})
```

---

### 6. ChatWidget (MODIFICAR)

**Ubicación:** `/Users/juanca/Projects/travelr/src/components/ai/ChatWidget.tsx`

**Cambios:**

```typescript
const {
  messages,
  loading,
  isStreaming,
  error,
  sendMessage,
  canContinue,
  continueConversation,
  placesMap, // NUEVO
} = useChatConversation({ tripId })

// Obtener días del itinerario (necesario para los chips)
const { data: plan } = useTrip(tripId)
const days = plan?.data?.itinerary || []

// Pasar a ChatMessage
<ChatMessage
  key={message.id}
  message={message}
  isLatest={index === messages.length - 1}
  onSendMessage={sendMessage}
  currentDayNumber={1}
  placesMap={placesMap} // NUEVO
  days={days} // NUEVO
/>
```

---

### 7. CanvasDndProvider (MODIFICAR)

**Ubicación:** `/Users/juanca/Projects/travelr/src/components/canvas/CanvasDndContext.tsx`

**Cambios:**

```typescript
// Nuevo tipo de drag data
interface PlaceChipDragData {
  type: "place-chip"
  placeId: string
  placeData: PlaceChipData
}

type DragData = PlaceDragData | TimelineActivityDragData | SavedIdeaDragData | PlaceChipDragData

// Nuevo prop
interface CanvasDndProviderProps {
  children: ReactNode
  onDropPlaceOnDay?: (place: Place, dayNumber: number, dropY?: number) => void
  onDropPlaceChipOnDay?: (placeId: string, placeData: PlaceChipData, dayNumber: number) => void // NUEVO
  onMoveActivity?: (activityId: string, fromDay: number, toDay: number, newTime?: string, insertionIndex?: number) => void
  onDropIdeaOnDay?: (item: ThingsToDoItem, dayNumber: number) => void
  onMoveActivityToIdeas?: (activity: TimelineEntry, fromDay: number) => void
  itinerary?: ItineraryDay[]
}

// En handleDragEnd:
if (activeItem.type === "place-chip" && overData?.type === "day-drop-zone") {
  const dayNumber = overData.dayNumber
  if (dayNumber && onDropPlaceChipOnDay) {
    onDropPlaceChipOnDay(activeItem.placeId, activeItem.placeData, dayNumber)
  }
}

// Nuevo preview component
function PlaceChipDragPreview({ placeData }: { placeData: PlaceChipData }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-primary rounded-full shadow-xl">
      <span className="text-sm font-medium truncate max-w-[180px]">{placeData.name}</span>
      {placeData.rating && (
        <span className="text-xs">★ {placeData.rating.toFixed(1)}</span>
      )}
    </div>
  )
}

// En DragOverlay:
{activeItem?.type === "place-chip" && (
  <PlaceChipDragPreview placeData={activeItem.placeData} />
)}
```

---

### 8. Agent Messages Schema (MODIFICAR)

**Ubicación:** Database migration

**Cambio:**

```sql
-- Migration: add places_context to agent_messages
ALTER TABLE agent_messages 
ADD COLUMN places_context jsonb;

-- Index para búsquedas eficientes
CREATE INDEX idx_agent_messages_places_context 
ON agent_messages USING gin (places_context);

-- Comentario
COMMENT ON COLUMN agent_messages.places_context IS 
'Map of place_id to PlaceChipData for rendering chips in message content';
```

---

### 9. API Route: /api/ai/travel-agent/chat (MODIFICAR)

**Ubicación:** `/Users/juanca/Projects/travelr/src/app/api/ai/travel-agent/chat/route.ts`

**Cambios:**

```typescript
// Al ejecutar search_places tools, capturar resultados
const placesContext: Record<string, PlaceChipData> = {}

// En executeToolCall para search_place_by_name y search_places_nearby:
if (toolName === 'search_place_by_name' || toolName === 'search_places_nearby') {
  const results = await executeSearchTool(toolInput, context)
  
  // Convertir resultados a PlaceChipData y almacenar en placesContext
  results.forEach((place: PlaceSearchResult) => {
    placesContext[place.id] = {
      id: place.id,
      name: place.name,
      rating: place.rating,
      reviewCount: place.reviewCount,
      category: place.category,
      priceLevel: place.priceLevel,
      imageUrl: place.imageUrl,
      address: place.address,
      description: place.description,
      location: place.location,
    }
  })
  
  // Instruir al AI a usar [[place:ID]] en respuesta
  toolResult += `\n\nIMPORTANT: When mentioning these places in your response, use the format [[place:PLACE_ID]] to create interactive chips. Example: "I recommend [[place:${results[0].id}]] for dinner."`
}

// Al persistir el mensaje del assistant en Supabase:
await supabase
  .from('agent_messages')
  .insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: assistantMessage,
    tool_calls: toolCallsForStorage,
    places_context: placesContext, // NUEVO
    created_at: new Date().toISOString(),
  })
```

---

## Contratos

### API Endpoints

No se crean nuevos endpoints. Se modifica `/api/ai/travel-agent/chat` para:
1. Capturar resultados de search_places tools
2. Construir `placesContext` map
3. Instruir al AI a usar sintaxis `[[place:ID]]`
4. Persistir `places_context` en `agent_messages`

### Schemas de DB

#### agent_messages (MODIFICAR)

```sql
CREATE TABLE agent_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tool_calls jsonb,
  places_context jsonb, -- NUEVO: { [place_id]: PlaceChipData }
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) 
    REFERENCES agent_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_messages_places_context 
ON agent_messages USING gin (places_context);
```

### Interfaces TypeScript

#### PlaceChipData

```typescript
export interface PlaceChipData {
  id: string                    // Google Place ID
  name: string                  // Nombre del lugar
  rating?: number               // 0-5
  reviewCount?: number          // Cantidad de reviews
  category?: string             // 'restaurant', 'attraction', etc.
  priceLevel?: 1 | 2 | 3 | 4   // $ a $$$$
  imageUrl?: string             // Primera imagen
  address?: string              // Dirección completa
  description?: string          // Descripción breve
  location: {                   // Coordenadas para Google Maps
    lat: number
    lng: number
  }
}
```

#### ChatMessage (EXTENDER)

```typescript
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  isStreaming?: boolean
  requiresConfirmation?: boolean
  confirmationMessage?: string
  placesContext?: Record<string, PlaceChipData> // NUEVO
}
```

---

## Edge Cases

| Escenario | Comportamiento esperado |
|-----------|------------------------|
| place_id no existe en placesMap | Renderizar como texto plano: "[place:ID]" (no chip) |
| Sintaxis incorrecta `[place:ID]` (un bracket) | Renderizar como texto normal |
| PlaceChipData sin rating | Mostrar solo nombre (sin estrella) |
| PlaceChipData sin imagen | No mostrar thumbnail en tooltip |
| Drag & drop en mobile | Disabled (isDesktop check en CanvasDndProvider) |
| Click en chip sin modal handler | No hacer nada (defensive) |
| Chip muy largo (>30 chars) | Truncar nombre con ellipsis `...` |
| Múltiples chips en un mensaje | Renderizar todos inline correctamente |
| Chip al inicio/final de mensaje | Manejar sin espacios extra |
| Usuario cierra modal durante loading | Cancelar operación de agregado |

---

## Decisiones Técnicas

| Decisión | Alternativas consideradas | Justificación |
|----------|--------------------------|---------------|
| **Sintaxis `[[place:ID]]`** | Markdown link `[name](place:ID)`, custom tag `<place id="...">` | Fácil de parsear con regex, no conflictúa con markdown existente, simple para el AI |
| **Almacenar en `places_context` DB** | Fetch on-demand desde Google Places, almacenar en localStorage | Garantiza consistencia histórica, funciona offline, no re-fetching innecesario |
| **Chip inline en texto** | Card separado debajo del mensaje, lista aparte | Mantiene contexto del mensaje, flujo natural de lectura |
| **Reusar PlaceDetailsModal** | Crear modal específico | Aprovecha lógica existente, consistencia UI, menos código |
| **useDraggable de @dnd-kit** | HTML5 drag & drop nativo | Ya integrado en el proyecto, soporte touch, API consistente |
| **DaySelectorDropdown nuevo** | Reusar AddToDropdown completo | AddToDropdown tiene lógica específica de Explore, simplificar para chat |
| **Tooltip solo desktop** | Tooltip en mobile también | Evita conflictos touch, mobile usa tap → modal directo |
| **PlaceChipData en context** | State local en ChatMessage | Necesario para múltiples componentes (chip, tooltip, modal) |

---

## Riesgos y Consideraciones

### Riesgo: AI no usa sintaxis correcta

**Mitigación:** 
- Incluir instrucciones explícitas en system prompt
- Incluir ejemplos en tool results
- Validar en backend y advertir si falta sintaxis
- Fallback: detectar place_id en tool_calls y auto-insertar

### Riesgo: places_context crece mucho (>1MB)

**Mitigación:**
- Limitar a max 20 lugares por mensaje
- Solo almacenar campos esenciales (no full Place object)
- JSONB compression automática en PostgreSQL

### Riesgo: Drag & drop confunde actividades vs chips

**Mitigación:**
- Drag preview distinto (rounded-full vs rounded-lg)
- Color distintivo (bg-slate vs bg-background)
- Drop handler separado (onDropPlaceChipOnDay)

### Riesgo: Múltiples re-renders por parsing

**Mitigación:**
- Memoizar resultado de parsePlaceChips
- useMemo para placesMap lookup
- React.memo en PlaceChip

### Consideración: Mobile UX

- No drag & drop (isDesktop check)
- Tap chip → PlaceDetailsModal directo
- Modal tiene botón "Agregar" con DaySelectorDropdown
- Tooltip disabled en mobile

### Consideración: Backwards compatibility

- Mensajes antiguos sin `places_context`: no mostrar chips (fallback a texto)
- Migración gradual: no es breaking change

---

## Archivos a Modificar/Crear

### Crear (6 archivos)

- `/Users/juanca/Projects/travelr/src/components/ai/PlaceChip.tsx`
  - Componente chip principal con drag & drop
  - ~150 líneas

- `/Users/juanca/Projects/travelr/src/components/ai/PlaceChipTooltip.tsx`
  - Tooltip hover para desktop
  - ~80 líneas

- `/Users/juanca/Projects/travelr/src/components/ai/DaySelectorDropdown.tsx`
  - Dropdown para seleccionar día
  - ~120 líneas (similar a AddToDropdown pero simplificado)

- `/Users/juanca/Projects/travelr/src/types/ai-agent.ts` (extender)
  - Añadir `PlaceChipData` interface
  - ~20 líneas nuevas

- `/Users/juanca/Projects/travelr/supabase/migrations/YYYYMMDDHHMMSS_add_places_context_to_agent_messages.sql`
  - Migration para agregar columna
  - ~10 líneas

- `/Users/juanca/Projects/travelr/.claude/features/place-chips-ai-chat/implementation.md`
  - Guía de implementación paso a paso
  - ~100 líneas

### Modificar (5 archivos)

- `/Users/juanca/Projects/travelr/src/components/ai/ChatMessage.tsx`
  - Añadir `parsePlaceChips()` función
  - Modificar rendering para incluir chips
  - Añadir props `placesMap` y `days`
  - ~50 líneas modificadas

- `/Users/juanca/Projects/travelr/src/hooks/useChatConversation.ts`
  - Añadir estado `placesMap`
  - Parsear `places_context` de DB en loadHistory
  - Retornar `placesMap` en interface
  - ~30 líneas modificadas

- `/Users/juanca/Projects/travelr/src/components/ai/ChatWidget.tsx`
  - Obtener días del itinerario
  - Pasar `placesMap` y `days` a ChatMessage
  - ~10 líneas modificadas

- `/Users/juanca/Projects/travelr/src/components/canvas/CanvasDndContext.tsx`
  - Añadir tipo `PlaceChipDragData`
  - Añadir handler `onDropPlaceChipOnDay`
  - Añadir preview component `PlaceChipDragPreview`
  - ~40 líneas modificadas

- `/Users/juanca/Projects/travelr/src/app/api/ai/travel-agent/chat/route.ts`
  - Capturar resultados de search_places tools
  - Construir `placesContext` map
  - Añadir instrucción en tool result para AI
  - Persistir `places_context` en DB insert
  - ~60 líneas modificadas

---

## Testing Strategy

### Unit Tests

1. **parsePlaceChips()** - ChatMessage.tsx
   - Input: `"Visit [[place:123]] and [[place:456]]"`
   - Expected: `[{type: 'text', ...}, {type: 'chip', placeId: '123'}, ...]`
   - Edge: Texto sin chips, chips al inicio/final, sintaxis incorrecta

2. **PlaceChip rendering** - PlaceChip.tsx
   - Render con rating vs sin rating
   - Render con imagen vs sin imagen
   - Click handler ejecuta
   - Drag state aplica clases correctas

3. **DaySelectorDropdown** - DaySelectorDropdown.tsx
   - Renderiza lista de días correctamente
   - onSelectDay llama callback con dayNumber correcto
   - Loading state desactiva items

### Integration Tests

1. **Chat con chips**
   - Enviar mensaje que trigger search_places
   - Verificar respuesta contiene `[[place:ID]]`
   - Verificar chips renderizan en UI
   - Click chip abre modal con datos correctos

2. **Drag & Drop**
   - Drag chip desde chat
   - Drop en día del timeline
   - Verificar actividad se agrega con placeData correcta

3. **Mobile**
   - Tap chip → modal abre
   - Botón "Agregar" → selector día funciona
   - Drag disabled (no listeners activos)

### Manual QA Checklist

- [ ] Mensaje con 1 chip renderiza correctamente
- [ ] Mensaje con múltiples chips (inline)
- [ ] Chip sin rating (solo nombre)
- [ ] Chip con nombre largo (trunca)
- [ ] Hover chip → tooltip aparece (desktop)
- [ ] Click chip → modal abre con datos completos
- [ ] Click "+" chip → dropdown abre
- [ ] Seleccionar día → actividad se agrega
- [ ] Drag chip → drop en día funciona
- [ ] Drag chip → preview correcto
- [ ] Mobile: tap chip → modal (no drag)
- [ ] Mensaje antiguo sin places_context → texto plano
- [ ] AI responde sin sintaxis → texto plano (no rompe)

---

## Fases de Implementación (sugeridas)

### Fase 1: Backend + Parsing (2-3 horas)
1. Migration: agregar `places_context` columna
2. Modificar API route para capturar search_places results
3. Persistir `places_context` en DB
4. Modificar useChatConversation para leer `places_context`
5. Implementar `parsePlaceChips()` en ChatMessage

### Fase 2: Componente Base (2-3 horas)
1. Crear PlaceChip component (sin drag, sin tooltip)
2. Styling básico (rounded-full, nombre + rating)
3. Click → PlaceDetailsModal integration
4. Testing visual en Storybook o directamente en chat

### Fase 3: Interacciones (3-4 horas)
1. PlaceChipTooltip component
2. DaySelectorDropdown component
3. Botón "+" en chip → dropdown
4. onAddToDay handler (agregar a timeline)
5. Testing manual de flujo completo

### Fase 4: Drag & Drop (2-3 horas)
1. Añadir useDraggable al PlaceChip
2. PlaceChipDragData type en CanvasDndContext
3. onDropPlaceChipOnDay handler
4. PlaceChipDragPreview component
5. Testing drag desde chat → timeline

### Fase 5: Mobile + Polish (1-2 horas)
1. Deshabilitar drag en mobile (isDesktop check)
2. Testing touch: tap chip → modal
3. Ajustes visuales (truncate, spacing)
4. Testing edge cases (sin datos, sin rating, etc.)

**Total estimado:** 10-15 horas

---

## Notas Adicionales

### System Prompt Update

Añadir al system prompt del AI Travel Agent:

```
When you search for places using search_place_by_name or search_places_nearby tools,
ALWAYS reference them in your response using the format [[place:PLACE_ID]].

Example:
"I found a great restaurant for dinner: [[place:ChIJN1t_tDeuEmsRUsoyG83frY4]]"

This creates an interactive chip that users can click, drag to their timeline, or add directly.

IMPORTANT:
- Use the exact place_id returned by the search tool
- You can mention multiple places: [[place:ID1]] and [[place:ID2]]
- The syntax must be exact: double brackets, "place:", then the ID
- If you mention a place without searching first, users won't see the interactive chip
```

### Accessibility

- PlaceChip: `role="button"`, `aria-label="Add [place name] to itinerary"`
- Tooltip: `aria-describedby` link al chip
- Keyboard navigation: Enter/Space activa click, Tab navega entre chips
- Screen reader: anuncia "Interactive place chip: [name], rating [X] stars"

### Performance

- Memoizar `parsePlaceChips()` con useMemo
- Lazy load PlaceDetailsModal (React.lazy)
- Virtualize mensaje list si >100 mensajes (react-window)
- Debounce hover tooltip (300ms)

### Analytics (future)

- Track: chip click, chip drag, chip add via dropdown
- Metric: % de lugares sugeridos que se agregan
- Metric: tiempo promedio desde sugerencia hasta agregar
- A/B test: chips vs texto plano (conversion rate)
