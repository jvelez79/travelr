# Sistema AI

## Arquitectura General

El sistema AI de Travelr utiliza un enfoque multi-endpoint con diferentes roles:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sistema AI                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Generación     │  │   Enriquecimiento │  │   Travel     │  │
│  │   de Planes      │  │   y Contenido     │  │   Agent      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│  • generate-plan     • enrich-itinerary    • chat (tools)      │
│  • generate-day      • generate-tips       • modificaciones    │
│  • prefetch-places   • generate-warnings   • en tiempo real    │
│  • contextual-q      • generate-documents                      │
│                      • generate-packing                         │
│                      • curated-discovery                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │       AI Provider             │
              ├───────────────────────────────┤
              │  • Claude CLI (desarrollo)    │
              │  • Anthropic API (producción) │
              │  • OpenAI API (fallback)      │
              └───────────────────────────────┘
```

---

## Proveedores AI

### Abstracción de Provider

```typescript
// lib/ai/providers/

interface AIProvider {
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  stream?(prompt: string): AsyncIterable<string>;
}

// Selección según AI_PROVIDER env var
function getAIProvider(): AIProvider {
  switch (process.env.AI_PROVIDER) {
    case 'claude-code':
      return new ClaudeCLIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      return new AnthropicProvider();
  }
}
```

### Proveedores Disponibles

| Provider | Uso | Configuración |
|----------|-----|---------------|
| `claude-code` | Desarrollo local | Usa CLI de Claude Code |
| `anthropic` | Producción | `ANTHROPIC_API_KEY` |
| `openai` | Fallback | `OPENAI_API_KEY` |

---

## Endpoints de Generación

### 1. Generación de Planes

#### `POST /api/ai/generate-plan`
Genera un plan completo de viaje.

```typescript
// Input
interface GeneratePlanInput {
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  travelers: number;
  preferences: TravelPreferences;
}

// Output
interface GeneratedPlan {
  id: string;
  trip: TripInfo;
  preferences: TravelPreferences;
  itinerary: ItineraryDay[];
  // ...secciones opcionales
}
```

#### `POST /api/ai/generate-plan-stream`
Streaming de generación completa.

#### `POST /api/ai/generate-plan-summary`
Genera solo el resumen inicial (títulos de días, estructura básica).

#### `POST /api/ai/generate-day`
Genera un día específico del itinerario.

```typescript
// Input
interface GenerateDayInput {
  tripId: string;
  dayNumber: number;
  summary: PlanSummary;
  placesContext: PlaceContext[];
  preferences: TravelPreferences;
}
```

#### `POST /api/ai/generate-day-stream`
Streaming de generación por día (usado en la UI de progreso).

#### `POST /api/ai/regenerate-day`
Regenera un día específico con nuevo contexto.

---

### 2. Pre-fetch y Contexto

#### `POST /api/ai/prefetch-places`
Pre-carga lugares de Google Places para dar contexto al AI.

```typescript
// Input
interface PrefetchInput {
  destination: string;
  categories: PlaceCategory[];
  tripId: string;
}

// Output
interface PrefetchOutput {
  places: PlaceContext[];
  categoryCounts: Record<PlaceCategory, number>;
}
```

#### `POST /api/ai/contextual-questions`
Genera preguntas dinámicas basadas en el destino.

```typescript
// Output
interface ContextualQuestion {
  id: string;
  question: string;
  options: string[];
  category: 'interests' | 'style' | 'budget' | 'activities';
}
```

---

### 3. Contenido Suplementario

#### `POST /api/ai/generate-tips`
Genera tips de viaje para el destino.

```typescript
// Output
interface TipsOutput {
  tips: string[];
  categories: Record<string, string[]>;
}
```

#### `POST /api/ai/generate-warnings`
Genera advertencias de seguridad y salud.

```typescript
// Output
interface WarningsOutput {
  warnings: Warning[];
  severityLevels: Record<string, 'low' | 'medium' | 'high'>;
}
```

#### `POST /api/ai/generate-documents`
Genera checklist de documentos necesarios.

```typescript
// Output
interface DocumentsOutput {
  documents: DocumentItem[];
  byCategory: Record<string, DocumentItem[]>;
}
```

#### `POST /api/ai/generate-packing`
Genera lista de empaque personalizada.

```typescript
// Output
interface PackingOutput {
  items: PackingItem[];
  byCategory: Record<string, PackingItem[]>;
}
```

---

### 4. Enriquecimiento

#### `POST /api/ai/enrich-itinerary`
Enriquece el itinerario con detalles adicionales.

#### `POST /api/ai/enrich-accommodations`
Enriquece sugerencias de alojamiento.

---

### 5. Descubrimiento

#### `POST /api/ai/curated-discovery`
Descubrimiento personalizado de lugares.

```typescript
// Input
interface CuratedDiscoveryInput {
  destination: string;
  category: PlaceCategory;
  preferences: TravelPreferences;
  existingPlaces?: string[]; // IDs ya agregados
}

// Output
interface CuratedDiscoveryOutput {
  places: CuratedPlace[];
  reasoning: string;
}
```

---

## Travel Agent (Chat)

### Descripción

El Travel Agent es un chatbot especializado que puede modificar el itinerario en tiempo real usando herramientas (tools).

### Endpoints

#### `POST /api/ai/travel-agent/chat`
Chat principal con el agente.

```typescript
// Input
interface ChatInput {
  tripId: string;
  conversationId?: string;
  message: string;
}

// Output (streaming)
interface ChatOutput {
  content: string;
  toolCalls?: ToolCall[];
}
```

#### `GET /api/ai/travel-agent/conversations/trip/[tripId]`
Obtener conversaciones de un viaje.

#### `GET /api/ai/travel-agent/conversations/[conversationId]`
Obtener mensajes de una conversación.

---

### Tools del Travel Agent

El agente tiene acceso a 15+ herramientas para modificar el itinerario:

```typescript
// lib/ai/travel-agent-tools.ts

const TRAVEL_AGENT_TOOLS = [
  // Consulta
  {
    name: 'get_itinerary_day',
    description: 'Obtiene el itinerario de un día específico',
    parameters: { dayNumber: number }
  },
  {
    name: 'search_places',
    description: 'Busca lugares en Google Places',
    parameters: { query: string, category?: string }
  },

  // Modificación
  {
    name: 'add_activity',
    description: 'Agrega una actividad al día',
    parameters: { dayNumber: number, activity: Activity }
  },
  {
    name: 'remove_activity',
    description: 'Elimina una actividad',
    parameters: { dayNumber: number, activityId: string }
  },
  {
    name: 'move_activity',
    description: 'Mueve una actividad a otro día/hora',
    parameters: { activityId: string, targetDay: number, targetTime: string }
  },
  {
    name: 'update_activity_time',
    description: 'Cambia el horario de una actividad',
    parameters: { activityId: string, newTime: string }
  },

  // Reordenamiento
  {
    name: 'reorder_day',
    description: 'Reordena las actividades del día',
    parameters: { dayNumber: number, newOrder: string[] }
  },
  {
    name: 'swap_days',
    description: 'Intercambia dos días completos',
    parameters: { day1: number, day2: number }
  },

  // Metadatos
  {
    name: 'update_day_title',
    description: 'Actualiza el título del día',
    parameters: { dayNumber: number, title: string }
  },
  {
    name: 'add_note',
    description: 'Agrega una nota importante',
    parameters: { dayNumber: number, note: ImportantNote }
  },

  // Lugares
  {
    name: 'save_to_ideas',
    description: 'Guarda un lugar en Ideas',
    parameters: { placeId: string, placeData: object }
  },
  {
    name: 'get_place_details',
    description: 'Obtiene detalles de un lugar',
    parameters: { placeId: string }
  }
];
```

---

### Flujo del Chat

```
Usuario escribe mensaje
       ↓
POST /api/ai/travel-agent/chat
       ↓
AI analiza intent + contexto del plan
       ↓
┌─────────────────────────────┐
│  ¿Requiere tool call?       │
├──────────┬──────────────────┤
│   Sí     │       No         │
│    ↓     │        ↓         │
│ Ejecutar │   Responder      │
│  tool    │   directamente   │
│    ↓     │                  │
│ Retornar │                  │
│ resultado│                  │
└──────────┴──────────────────┘
       ↓
Streaming de respuesta al frontend
       ↓
UI actualiza plan si hubo cambios
```

---

## Hooks de Frontend

### useDayGeneration

```typescript
// hooks/useDayGeneration.ts

function useDayGeneration(tripId: string) {
  return {
    generateDay: (dayNumber: number) => Promise<ItineraryDay>,
    isGenerating: boolean,
    progress: { current: number, total: number },
    error: Error | null,
    retry: () => void
  };
}
```

### useChatConversation

```typescript
// hooks/useChatConversation.ts

function useChatConversation(tripId: string) {
  return {
    messages: Message[],
    sendMessage: (content: string) => Promise<void>,
    isLoading: boolean,
    streamingContent: string | null
  };
}
```

### useBackgroundGeneration

```typescript
// hooks/useBackgroundGeneration.ts

function useBackgroundGeneration() {
  return {
    startGeneration: (tripId: string) => void,
    status: 'idle' | 'generating' | 'completed' | 'failed',
    completedDays: number[],
    failedDays: { dayNumber: number, error: string }[]
  };
}
```

---

## Prompts

### Ubicación

Los prompts del sistema están en:
- `lib/ai/travel-agent-prompts.ts` - Prompts del Travel Agent
- Inline en cada endpoint para prompts específicos

### Gestión de Prompts (Admin)

Tabla `ai_prompts` permite gestionar prompts desde el admin panel:

```sql
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  prompt TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

Admin UI en `/admin/prompts`.

---

## Logging

### ai_request_logs

Todas las llamadas AI se logean:

```typescript
interface AIRequestLog {
  request_id: string;
  trip_id?: string;
  user_id?: string;
  endpoint: string;      // '/api/ai/generate-day'
  provider: string;      // 'anthropic'
  model: string;         // 'claude-3-5-sonnet'
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
  duration_ms: number;
  status: 'success' | 'error';
  error_message?: string;
}
```

Admin UI en `/admin/ai-logs`.

---

## Configuración

### Variables de Entorno

```env
# Provider selection
AI_PROVIDER=anthropic          # claude-code | anthropic | openai

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Modelo (opcional, usa default si no se especifica)
AI_MODEL=claude-3-5-sonnet-20241022
```

### Costos Aproximados

| Operación | Tokens (aprox) | Costo (Claude) |
|-----------|----------------|----------------|
| Plan completo | 10-15k | ~$0.30 |
| Día individual | 2-3k | ~$0.06 |
| Chat message | 1-2k | ~$0.04 |
| Tips/Warnings | 500-1k | ~$0.02 |

---

## Mejores Prácticas

### 1. Streaming para UX

Siempre usar streaming para operaciones largas:

```typescript
// En el frontend
const response = await fetch('/api/ai/generate-day-stream', {
  method: 'POST',
  body: JSON.stringify(input)
});

const reader = response.body.getReader();
// Procesar chunks...
```

### 2. Retry Logic

```typescript
// El hook useDayGeneration maneja reintentos
const MAX_RETRIES = 3;

async function generateWithRetry(dayNumber: number) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await generateDay(dayNumber);
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await delay(1000 * (attempt + 1)); // Backoff
    }
  }
}
```

### 3. Contexto del Plan

Siempre pasar contexto relevante al AI:

```typescript
const context = {
  destination: plan.trip.destination,
  dates: { start: plan.trip.startDate, end: plan.trip.endDate },
  preferences: plan.preferences,
  existingDays: plan.itinerary.map(d => ({ day: d.day, title: d.title })),
  placesContext: await getPlacesContext(tripId)
};
```

### 4. Validación de Tool Calls

```typescript
// Validar que el tool call sea seguro antes de ejecutar
function validateToolCall(toolCall: ToolCall): boolean {
  // Verificar que el día existe
  // Verificar que la actividad existe
  // Verificar permisos del usuario
  return true;
}
```
