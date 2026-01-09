# Especificación Técnica: AI Travel Agent

## Resumen

Widget de chat conversacional flotante que actúa como orquestador inteligente de los 3 agentes especializados existentes (Architect, Curator, Optimizer). Permite al usuario ejecutar cambios en el itinerario mediante lenguaje natural, con persistencia de conversaciones en Supabase y streaming de respuestas para UX fluida.

**Approach técnico**: Chat widget React con estado en Zustand, API route orquestador que analiza intención y delega a agentes especializados, sistema de tools para ejecutar acciones en el canvas, y persistencia en tabla `agent_conversations`.

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────────┐
│                         Canvas Layout                              │
│  ┌──────────┐  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │          │  │                     │  │                      │  │
│  │ Left     │  │   Central Panel     │  │   Right Panel        │  │
│  │ Sidebar  │  │   (Timeline)        │  │   (Details/Search)   │  │
│  │          │  │                     │  │                      │  │
│  └──────────┘  └─────────────────────┘  └──────────────────────┘  │
│                                                                    │
│                                      ┌──────────────────────────┐ │
│                                      │  AI Chat Widget          │ │
│                                      │  (Floating Button +      │ │
│                                      │   Expandable Panel)      │ │
│                                      └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘

Flujo de Mensaje:
┌────────────┐
│ Usuario    │ "Agrega un restaurante para la cena del día 2"
└─────┬──────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ ChatWidget Component                                            │
│ - Captura input                                                 │
│ - Envía a /api/ai/travel-agent                                 │
│ - Renderiza respuesta con streaming                            │
└─────┬───────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ API Route: /api/ai/travel-agent/chat                           │
│ - Recibe mensaje + tripId + conversationId                     │
│ - Carga contexto del trip (plan actual)                        │
│ - Carga historial de conversación (últimos 10 mensajes)       │
│ - Invoca AI con tools disponibles                              │
└─────┬───────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI Orchestrator (Anthropic Messages API con Tools)             │
│                                                                 │
│ Tools disponibles:                                             │
│ ├─ add_activity_to_day(dayNumber, activity, time)             │
│ ├─ move_activity(activityId, newDayNumber, newTime)           │
│ ├─ remove_activity(activityId, requireConfirmation)           │
│ ├─ search_places(query, dayNumber, category)                  │
│ ├─ get_day_details(dayNumber)                                 │
│ └─ ask_for_clarification(question)                            │
│                                                                 │
│ El AI analiza intención y decide:                              │
│ - Ejecutar tool directamente                                   │
│ - Pedir clarificación                                          │
│ - Informar sobre limitación                                    │
└─────┬───────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Tool Execution Layer                                           │
│ - Ejecuta acciones via usePlan hook                           │
│ - Actualiza plan en Supabase                                  │
│ - Retorna confirmación al AI                                   │
└─────┬───────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response Streaming                                              │
│ - SSE stream de respuesta al frontend                          │
│ - Persiste mensaje en agent_conversations                      │
│ - Frontend actualiza UI + muestra confirmación                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes

### 1. ChatWidget (Frontend)
**Ubicación**: `src/components/ai/ChatWidget.tsx`

**Responsabilidad**: 
- Renderizar botón flotante que abre/cierra el chat
- Gestionar estado local del chat (mensajes, input, loading)
- Enviar mensajes a la API con streaming
- Mostrar respuestas con formato markdown
- Scroll automático al nuevo contenido

**Interface**:
```typescript
interface ChatWidgetProps {
  tripId: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  isStreaming?: boolean
}

interface ToolCall {
  toolName: string
  toolInput: Record<string, unknown>
  result?: string
}
```

**Dependencias**:
- `useChatConversation` hook para gestión de estado
- `useCanvasContext` para ejecutar acciones visuales
- `shadcn/ui`: Button, Sheet, ScrollArea, Input

**Estructura visual**:
```
┌─────────────────────────┐
│  🤖 Chat Assistant      │
├─────────────────────────┤
│ [Historial de mensajes] │
│                         │
│ Usuario: "Agrega..."    │
│ Assistant: "He agregado"│
│ [Confirmación visual]   │
│                         │
├─────────────────────────┤
│ [Input + Enviar]        │
└─────────────────────────┘
```

---

### 2. useChatConversation (Hook)
**Ubicación**: `src/hooks/useChatConversation.ts`

**Responsabilidad**:
- Cargar historial de conversación desde Supabase
- Enviar mensajes a la API con SSE streaming
- Actualizar lista de mensajes en tiempo real
- Gestionar estados: loading, streaming, error

**Interface**:
```typescript
interface UseChatConversationOptions {
  tripId: string
  conversationId?: string | null
}

interface UseChatConversationReturn {
  messages: ChatMessage[]
  loading: boolean
  isStreaming: boolean
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  clearHistory: () => Promise<void>
  conversationId: string | null
}

export function useChatConversation(options: UseChatConversationOptions): UseChatConversationReturn
```

**Dependencias**:
- `@supabase/supabase-js` para queries
- `fetch` con SSE para streaming

---

### 3. ChatMessage Component
**Ubicación**: `src/components/ai/ChatMessage.tsx`

**Responsabilidad**:
- Renderizar un mensaje individual (usuario o asistente)
- Mostrar avatares diferenciados
- Aplicar formato markdown al contenido
- Mostrar tool calls si existen (debugging opcional)

**Interface**:
```typescript
interface ChatMessageProps {
  message: ChatMessage
  isLatest: boolean
}
```

**Dependencias**:
- `react-markdown` para renderizado markdown
- `shadcn/ui`: Avatar, Card

---

### 4. API Route: /api/ai/travel-agent/chat
**Ubicación**: `src/app/api/ai/travel-agent/chat/route.ts`

**Responsabilidad**:
- Endpoint POST para recibir mensajes del usuario
- Cargar contexto del trip (plan actual + trip basics)
- Cargar historial de conversación
- Invocar Anthropic Messages API con tools
- Procesar tool calls y ejecutar acciones
- Retornar respuesta en formato SSE

**Interface**:
```typescript
interface ChatRequest {
  tripId: string
  conversationId?: string | null
  message: string
}

interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'done' | 'error'
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  toolResult?: string
  error?: string
}

// Response: SSE stream
```

**Dependencias**:
- `@anthropic-ai/sdk` para Messages API
- `@/lib/supabase/server` para queries de DB
- `@/lib/ai/travel-agent-tools` para tool execution

---

### 5. Travel Agent Tools (Server-side)
**Ubicación**: `src/lib/ai/travel-agent-tools.ts`

**Responsabilidad**:
- Definir tools disponibles para el AI (schemas JSON)
- Ejecutar acciones en el plan (add/move/remove activities)
- Integrar con Google Places para búsquedas
- Retornar resultados estructurados al AI

**Interface**:
```typescript
// Tool definitions for Anthropic API
export const TRAVEL_AGENT_TOOLS = [
  {
    name: 'add_activity_to_day',
    description: 'Adds a new activity to a specific day in the itinerary',
    input_schema: {
      type: 'object',
      properties: {
        dayNumber: { type: 'number', description: 'Day number (1-based)' },
        activity: {
          type: 'object',
          properties: {
            time: { type: 'string', description: 'Start time in HH:MM format' },
            activity: { type: 'string', description: 'Activity name' },
            location: { type: 'string', description: 'Location name' },
            icon: { type: 'string', description: 'Emoji icon' },
            notes: { type: 'string', description: 'Optional notes' }
          },
          required: ['time', 'activity', 'location']
        }
      },
      required: ['dayNumber', 'activity']
    }
  },
  // ... más tools
]

// Tool execution functions
export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string>

interface ToolExecutionContext {
  tripId: string
  userId: string
  plan: GeneratedPlan
  supabase: SupabaseClient
}
```

**Dependencias**:
- `@/lib/supabase/server` para mutations
- `@/lib/plan/addPlaceToItinerary` (patrón existente)
- `@/lib/explore/google-places` para búsquedas

---

### 6. Prompt Engineering Module
**Ubicación**: `src/lib/ai/travel-agent-prompts.ts`

**Responsabilidad**:
- Construir system prompt para el AI Travel Agent
- Incluir contexto del trip en cada mensaje
- Formatear historial de conversación
- Definir personalidad y reglas del agente

**Interface**:
```typescript
export function buildTravelAgentSystemPrompt(trip: TripContext): string

export function buildConversationMessages(
  history: ChatMessage[],
  newMessage: string
): AnthropicMessage[]

interface TripContext {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
  currentDayCount: number
}
```

---

## Contratos

### API Endpoints

| Método | Ruta | Request Body | Response | Notas |
|--------|------|--------------|----------|-------|
| POST | `/api/ai/travel-agent/chat` | `{ tripId: string, conversationId?: string, message: string }` | SSE stream de `ChatStreamEvent` | Streaming de respuesta |
| GET | `/api/ai/travel-agent/conversations/:tripId` | - | `{ conversations: Conversation[] }` | Listar conversaciones de un trip |
| DELETE | `/api/ai/travel-agent/conversations/:conversationId` | - | `{ success: boolean }` | Eliminar conversación |

### Schemas de DB

#### Tabla: `agent_conversations`
```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT, -- Auto-generado del primer mensaje
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para búsqueda rápida
CREATE INDEX idx_agent_conversations_trip ON agent_conversations(trip_id);
CREATE INDEX idx_agent_conversations_user ON agent_conversations(user_id);
```

#### Tabla: `agent_messages`
```sql
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB, -- Array de { toolName, toolInput, result }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para orden cronológico
CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id, created_at);
```

### Interfaces TypeScript

```typescript
// src/types/ai-agent.ts

export interface Conversation {
  id: string
  trip_id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tool_calls: ToolCall[] | null
  created_at: string
}

export interface ToolCall {
  toolName: string
  toolInput: Record<string, unknown>
  result?: string
}

// Streaming events
export type ChatStreamEventType = 'text' | 'tool_call' | 'tool_result' | 'done' | 'error'

export interface ChatStreamEvent {
  type: ChatStreamEventType
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  toolResult?: string
  error?: string
}

// Tool definitions
export interface TravelAgentTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}
```

---

## Edge Cases

| Escenario | Comportamiento Esperado |
|-----------|------------------------|
| Usuario pide eliminar todas las actividades | AI responde pidiendo confirmación explícita antes de ejecutar |
| Usuario pide agregar actividad a día que no existe | AI informa que el día no existe y pregunta si quiere agregarlo a otro día |
| Usuario pide mover actividad pero hay conflicto de horario | AI detecta conflicto, informa al usuario y sugiere horarios alternativos |
| Usuario hace pregunta informativa (ej: "qué ver en X") | AI responde informativamente SIN ejecutar acciones, solo sugiere |
| API de Anthropic falla durante streaming | Capturar error, mostrar mensaje amigable, permitir retry |
| Usuario envía mensaje mientras otro está en streaming | Deshabilitar input hasta que termine el stream actual |
| Usuario cierra chat mientras AI está respondiendo | Cancelar stream, persistir mensaje parcial como error |
| Usuario pide algo fuera de scope (ej: reservar vuelo) | AI responde honestamente: "No puedo hacer eso, pero puedo ayudarte con..." |
| Usuario hace referencia a mensaje anterior | AI usa historial de conversación para contexto |
| Conversación llega a 50+ mensajes | Limitar historial enviado al AI a últimos 20 mensajes (context window) |

---

## Decisiones Técnicas

| Decisión | Alternativas Consideradas | Justificación |
|----------|--------------------------|---------------|
| **Anthropic Messages API con Tools** | OpenAI Function Calling, Custom routing logic | Messages API tiene mejor soporte para tool calling nativo y streaming simultáneo. Permite al AI decidir qué tool usar sin lógica adicional. |
| **SSE para streaming** | WebSockets, Long polling | SSE es más simple para unidireccional, mejor compatibilidad con Next.js API routes, menos overhead. |
| **Tabla separada para conversaciones** | Almacenar en `plans.data` como JSON | Separar permite queries eficientes, historial persistente incluso si se regenera plan, y mejor escalabilidad. |
| **Widget flotante vs panel fijo** | Panel integrado en Right Panel | Flotante permite acceso desde cualquier pantalla sin afectar layout existente, mejor para mobile. |
| **Tool execution en server-side** | Retornar acciones al frontend para ejecutar | Ejecutar en server garantiza consistencia, seguridad (validación de permisos), y simplifica frontend. |
| **Limitar historial a últimos 20 mensajes** | Enviar todo el historial, usar embeddings para contexto | 20 mensajes balance entre contexto útil y límites de tokens. Embeddings agregan complejidad sin valor claro en MVP. |
| **Auto-generar título de conversación** | Usuario debe nombrar conversación | UX más fluida, reduce fricción. Se genera del primer mensaje del usuario. |

---

## Riesgos y Consideraciones

### Riesgo 1: Ambigüedad en peticiones del usuario
**Impacto**: AI ejecuta acción incorrecta  
**Mitigación**: 
- Tool `ask_for_clarification` para preguntar cuando hay duda
- Confirmar acciones destructivas (eliminar múltiples items)
- Mostrar preview de cambios antes de aplicar (futuro)

### Riesgo 2: Conflictos de state durante edición manual + AI
**Impacto**: Usuario edita manualmente mientras AI también ejecuta cambios  
**Mitigación**:
- Optimistic updates en frontend con rollback en error
- Timestamp de última modificación en plan
- Mostrar warning si plan cambió mientras AI procesaba
- Futuro: Bloqueo optimista durante ejecución de AI

### Riesgo 3: Costos de API de Anthropic
**Impacto**: Factura alta con uso intensivo  
**Mitigación**:
- Limitar longitud de contexto (20 mensajes últimos)
- Cache de system prompt (Anthropic Prompt Caching)
- Rate limiting por usuario (5 mensajes/minuto en MVP)
- Monitoreo de costos con `ai_request_logs`

### Riesgo 4: Latencia en respuestas (>5 segundos)
**Impacto**: UX frustrante, usuario abandona  
**Mitigación**:
- Streaming inmediato (mostrar texto a medida que llega)
- Indicador de "pensando..." con animación
- Timeout de 30 segundos con mensaje de error amigable
- Tool execution asíncrono (no bloquea respuesta)

### Riesgo 5: AI inventa datos (hallucinations)
**Impacto**: Usuario confía en información incorrecta  
**Mitigación**:
- Tools solo trabajan con datos reales del plan
- Búsquedas de lugares siempre via Google Places API
- Disclaimer visible: "Verifica información crítica"
- Logging de todas las acciones ejecutadas

### Riesgo 6: Usuario espera features no implementados
**Impacto**: Frustración al descubrir limitaciones  
**Mitigación**:
- System prompt define scope claramente
- AI responde honestamente cuando algo está fuera de scope
- UI muestra ejemplos de lo que SÍ puede hacer
- Documento de limitaciones en onboarding

---

## Archivos a Modificar/Crear

### Nuevos Archivos

#### Frontend Components
- `src/components/ai/ChatWidget.tsx` - Widget principal flotante
- `src/components/ai/ChatMessage.tsx` - Componente de mensaje individual
- `src/components/ai/ChatInput.tsx` - Input con textarea expandible
- `src/components/ai/TypingIndicator.tsx` - Indicador de "AI escribiendo..."
- `src/components/ai/ToolCallBadge.tsx` - Badge visual de tool ejecutado

#### Hooks
- `src/hooks/useChatConversation.ts` - Hook para gestión de conversación
- `src/hooks/useChatStreaming.ts` - Hook para procesar SSE streams

#### API Routes
- `src/app/api/ai/travel-agent/chat/route.ts` - Endpoint principal de chat
- `src/app/api/ai/travel-agent/conversations/[tripId]/route.ts` - Listar conversaciones
- `src/app/api/ai/travel-agent/conversations/[conversationId]/route.ts` - Eliminar conversación

#### AI Logic
- `src/lib/ai/travel-agent-tools.ts` - Definición y ejecución de tools
- `src/lib/ai/travel-agent-prompts.ts` - Prompt engineering
- `src/lib/ai/travel-agent-orchestrator.ts` - Lógica de orquestación

#### Types
- `src/types/ai-agent.ts` - Interfaces TypeScript del feature

#### Database
- `supabase/migrations/YYYYMMDDHHMMSS_create_agent_conversations.sql` - Schema de DB

### Archivos Existentes a Modificar

#### Canvas Layout Integration
- `src/app/trips/[id]/page.tsx`
  - Importar y renderizar `<ChatWidget tripId={tripId} />`
  - Agregar contexto necesario si falta

#### Plan Management
- `src/hooks/usePlan.ts`
  - Considerar agregar listener para updates desde AI (opcional, ya existe refetch)

#### Supabase Types
- `src/types/database.ts`
  - Agregar types generados para `agent_conversations` y `agent_messages`

---

## Flujo de Implementación (Orden Recomendado)

### Fase 1: Database y Types (1-2 horas)
1. Crear migración de Supabase para tablas
2. Ejecutar migración en local y staging
3. Regenerar types de database (`npm run generate-types`)
4. Crear `src/types/ai-agent.ts`

### Fase 2: API Foundation (3-4 horas)
1. Implementar `travel-agent-prompts.ts` (system prompt)
2. Implementar `travel-agent-tools.ts` (tool definitions + stubs)
3. Implementar `/api/ai/travel-agent/chat` básico (sin tools, solo echo)
4. Testear streaming con curl o Postman

### Fase 3: Tool Execution (4-5 horas)
1. Implementar `add_activity_to_day` tool completo
2. Implementar `move_activity` tool
3. Implementar `remove_activity` tool con confirmación
4. Implementar `get_day_details` tool (read-only)
5. Testear cada tool individualmente con Anthropic Messages API

### Fase 4: Frontend Components (4-5 horas)
1. Implementar `ChatWidget.tsx` básico (botón + modal)
2. Implementar `ChatMessage.tsx` (sin markdown aún)
3. Implementar `ChatInput.tsx`
4. Conectar con API sin streaming (fetch simple)
5. Testear flujo completo: enviar mensaje → recibir respuesta

### Fase 5: Streaming y Persistencia (3-4 horas)
1. Implementar `useChatStreaming` hook para SSE
2. Actualizar API para retornar SSE stream
3. Integrar streaming en `ChatWidget`
4. Implementar persistencia de mensajes en DB
5. Implementar carga de historial al abrir chat

### Fase 6: Polish y Edge Cases (2-3 horas)
1. Agregar markdown rendering en mensajes
2. Implementar confirmaciones para acciones destructivas
3. Agregar rate limiting en API
4. Agregar error boundaries y retry logic
5. Agregar loading states y animaciones

### Fase 7: Testing y Refinamiento (2-3 horas)
1. Testing manual de todos los flujos
2. Testing de edge cases identificados
3. Ajustes de prompts basados en comportamiento
4. Documentación de uso para usuario

**Total Estimado**: 19-26 horas

---

## Métricas de Éxito

### Performance
- **Tiempo hasta primera palabra**: <2 segundos
- **Tiempo de respuesta completa**: <10 segundos (promedio)
- **Tool execution time**: <3 segundos

### Calidad
- **Tasa de éxito de tool calls**: >90% (tool correcto elegido)
- **Tasa de confirmación de cambios**: >80% (usuario acepta cambio sugerido)
- **Tasa de error de API**: <5%

### Engagement
- **% de usuarios que usan chat**: Target 30% en primera semana
- **Mensajes promedio por conversación**: Target 5-10
- **Tasa de retención en conversación**: >70% (completan intención)

---

## Próximos Pasos Post-MVP

1. **Search places tool completo**: Integrar Google Places para búsquedas contextuales
2. **Multi-day operations**: Agregar/modificar múltiples días en una sola petición
3. **Undo/Redo**: Permitir deshacer cambios ejecutados por AI
4. **Sugerencias proactivas**: AI detecta problemas y ofrece fixes automáticamente
5. **Voice input**: Agregar soporte para mensajes de voz
6. **Context-aware suggestions**: Usar embeddings de preferencias del usuario
7. **Collaborative editing**: Múltiples usuarios conversando sobre el mismo trip
8. **Export conversation**: Descargar conversación como PDF/markdown

---

## Referencias

- [Anthropic Messages API Docs](https://docs.anthropic.com/claude/reference/messages_post)
- [Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)
- [SSE with Next.js](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
- Existing patterns:
  - `src/hooks/useBackgroundGeneration.ts` - Realtime subscriptions
  - `src/lib/ai/agent.ts` - AI integration patterns
  - `src/app/api/generation/start/route.ts` - API route structure
