# AI Provider y Agentes

## Concepto

Travelr utiliza una arquitectura de **3 agentes especializados**, cada uno con una función específica en el proceso de planificación. Estos agentes operan sobre una capa de abstracción que permite cambiar entre diferentes proveedores de AI (Claude, OpenAI, etc.) sin modificar el código.

---

## Los 3 AI Agents

```
┌─────────────────────────────────────────────────────────────┐
│                     USUARIO INTERACTÚA                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ARCHITECT AGENT                                             │
│  ├─ Crear estructura de viaje                                │
│  ├─ Dividir en destinos/bloques de tiempo                   │
│  └─ Proponer duración y temas por día                       │
│                                                              │
│  CURATOR AGENT                                               │
│  ├─ Buscar en Google Places                                  │
│  ├─ Priorizar por perfil del usuario                        │
│  └─ Devolver 3–5 opciones curadas con reasoning             │
│                                                              │
│  OPTIMIZER AGENT                                             │
│  ├─ Analizar horarios y tiempos de traslado                 │
│  ├─ Detectar conflictos                                      │
│  └─ Proponer reorganización                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent 1: Architect (Estructura de Viaje)

### Cuándo se llama
- Al crear un viaje con "Generar borrador"
- Al cambiar modo a "Asistido" (regenerar estructura)

### Input

```typescript
interface ArchitectInput {
  destination: string;
  dates: { start: string; end: string };
  travelers: number;
  style: 'relax' | 'balanced' | 'adventure';
  budget: 'budget' | 'mid' | 'premium';
  interests?: string[];  // opcional, progressive profiling
}
```

### Output

```typescript
interface ArchitectOutput {
  days: Array<{
    day_number: number;
    title: string;
    location: string;
    themes: string[];
    time_blocks: Array<{
      start: string;  // "09:00"
      end: string;    // "12:00"
      label: string;  // "Vuelo", "Hotel check-in", "Libre"
    }>;
  }>;
  summary: string;
}
```

### Prompt Conceptual

```
Eres un experto planificador de viajes. Basándote en:
- Destino: [destino]
- Duración: [X días]
- Viajeros: [N personas]
- Estilo: [relax/balanceado/aventura]
- Intereses: [lista]

Genera una estructura de viaje que:
1. Divida los días en bloques temáticos
2. Incluya actividades ancla (vuelo, hotel, comidas)
3. Deje tiempos libres (NO llene cada hora)
4. Sea realista en logística
5. Adapte ritmo al estilo

Devuelve JSON con estructura de días, títulos, temas, y bloques de tiempo.
```

### Performance Target
- **<2 segundos** para respuesta completa

---

## Agent 2: Curator (Sugerencias de Actividades)

### Cuándo se llama
- Usuario toca "Pedir ideas a la AI" en un bloque vacío
- Usuario hace búsqueda y AI refina/ordena resultados

### Input

```typescript
interface CuratorInput {
  query?: string;  // "museos", "pizza" (puede ser vacío)
  block: {
    day: number;
    time_start: string;
    time_end: string;
    duration_hours: number;
    location: { lat: number; lng: number };
  };
  user_profile: {
    style: 'relax' | 'balanced' | 'adventure';
    interests: string[];
    budget: 'budget' | 'mid' | 'premium';
    previous_activities: string[];  // historial del viaje
  };
}
```

### Output

```typescript
interface CuratorOutput {
  recommendations: Array<{
    rank: number;
    place_id: string;  // Google Places ID
    name: string;
    category: string;
    rating: number;
    reviews: number;
    duration: string;
    cost: string;
    distance_km: number;
    reason: string;     // "Imprescindible, aunque concurrido"
    fit_score: number;  // 0-1, qué tan bien encaja
  }>;
  other_nearby_options: Array<{
    name: string;
    category: string;
  }>;
}
```

### Prompt Conceptual

```
Eres un curador de viajes. Basándote en:
- Tiempo disponible: [X horas]
- Ubicación: [lat/lng]
- Estilo: [relax/balanceado/aventura]
- Intereses: [lista]
- Presupuesto: [bajo/medio/alto]
- Ya visitado: [lugares anteriores]

Aquí hay [N] actividades de Google Places: [lista]

Sugiere 3–5 actividades que:
1. Encajen en el time block disponible
2. Estén ordenadas por relevancia para ESTE usuario
3. Tengan diversidad (no todas museos)
4. Consideren tiempos de traslado
5. Agreguen contexto personal ("menos concurrida", etc.)

Devuelve JSON con lista ordenada y reasoning.
```

### Performance Target
- **<5 segundos** (incluye llamadas a Google Places)

---

## Agent 3: Optimizer (Logística)

### Cuándo se llama
- Usuario toca "Optimizar este día"
- AI detecta conflictos automáticamente

### Input

```typescript
interface OptimizerInput {
  day: number;
  activities: Array<{
    name: string;
    start: string;
    end: string;
    location: { lat: number; lng: number };
  }>;
  free_time_blocks: Array<{
    start: string;
    end: string;
  }>;
}
```

### Output

```typescript
interface OptimizerOutput {
  issues: Array<{
    type: 'conflict' | 'travel_time' | 'opening_hours' | 'gap';
    description: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  suggestions: Array<{
    suggestion: string;
    impact: string;
    action: 'apply_change' | 'suggest_activities';
    options?: Array<{ name: string; fit_score: number }>;
  }>;
  optimized_timeline: Array<{
    name: string;
    start: string;
    end: string;
  }>;
}
```

### Prompt Conceptual

```
Eres un experto en logística de viajes. Analiza este itinerario:

[Lista de actividades con horarios y ubicaciones]

Detecta:
1. Conflictos de horarios (solapamiento)
2. Traslados imposibles (distancia > tiempo)
3. Gaps sin aprovechar (>2h libres)

Para cada problema, propón soluciones sin aplicarlas.
El usuario decide qué aceptar.

Devuelve JSON con issues, suggestions, y timeline optimizado.
```

### Performance Target
- **<3 segundos**

---

## Proveedores Soportados

| Provider | Uso | Costo |
|----------|-----|-------|
| Claude Code CLI | Desarrollo local | Gratis (usa suscripción Max) |
| Anthropic API | Producción | Por tokens |
| OpenAI API | Alternativa/fallback | Por tokens |

---

## Arquitectura de Abstracción

```
┌─────────────────────────────────────────────────────────────┐
│                      Aplicación                              │
│                                                              │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│   │  Architect   │ │   Curator    │ │  Optimizer   │       │
│   │    Agent     │ │    Agent     │ │    Agent     │       │
│   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘       │
│          │                │                │                │
│          └────────────────┼────────────────┘                │
│                           │                                  │
│                           ▼                                  │
│            ┌─────────────────────────────┐                  │
│            │       AI Provider           │                  │
│            │                             │                  │
│            │  interface AIProvider {     │                  │
│            │    ask(prompt): string      │                  │
│            │    askJSON<T>(prompt): T    │                  │
│            │  }                          │                  │
│            └─────────────────────────────┘                  │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│   │ Claude   │     │ Anthropic│     │ OpenAI   │           │
│   │ Code CLI │     │   API    │     │   API    │           │
│   └──────────┘     └──────────┘     └──────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## Interfaces TypeScript

### Base Provider

```typescript
interface AIProvider {
  name: string;
  ask(prompt: string, context?: string): Promise<string>;
  askJSON<T>(prompt: string, schema?: string): Promise<T>;
  stream?(prompt: string): AsyncIterable<string>;
}
```

### Agent Services

```typescript
// services/ai/architect.ts
export async function generateTripStructure(
  input: ArchitectInput
): Promise<ArchitectOutput> {
  const ai = getAIProvider();
  const prompt = buildArchitectPrompt(input);
  return ai.askJSON<ArchitectOutput>(prompt);
}

// services/ai/curator.ts
export async function getActivityRecommendations(
  input: CuratorInput
): Promise<CuratorOutput> {
  const ai = getAIProvider();
  const places = await searchGooglePlaces(input.block.location, input.query);
  const prompt = buildCuratorPrompt(input, places);
  return ai.askJSON<CuratorOutput>(prompt);
}

// services/ai/optimizer.ts
export async function optimizeDay(
  input: OptimizerInput
): Promise<OptimizerOutput> {
  const ai = getAIProvider();
  const travelTimes = await getTravelTimes(input.activities);
  const prompt = buildOptimizerPrompt(input, travelTimes);
  return ai.askJSON<OptimizerOutput>(prompt);
}
```

---

## Configuración

```env
# .env.local
AI_PROVIDER=claude-code  # o 'anthropic' o 'openai'

# Solo si usas APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Google Places (requerido para Curator)
GOOGLE_PLACES_API_KEY=...
```

---

## API Routes

```
/api/ai-agents/
├── architect/
│   └── POST - Genera estructura de viaje
├── curator/
│   └── POST - Sugiere actividades para un bloque
└── optimizer/
    └── POST - Analiza y optimiza un día
```

### Ejemplo: Architect Endpoint

```typescript
// app/api/ai-agents/architect/route.ts
export async function POST(req: Request) {
  const input: ArchitectInput = await req.json();

  // Validar input
  if (!input.destination || !input.dates) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const result = await generateTripStructure(input);
  return Response.json(result);
}
```

---

## Integración con Google Places

El **Curator Agent** es el único que interactúa directamente con Google Places:

```
Usuario pide ideas
      ↓
Curator recibe: ubicación, tiempo disponible, preferencias
      ↓
Curator llama Google Places API:
  - searchNearby() para actividades cercanas
  - getPlaceDetails() para info completa
      ↓
AI ordena y prioriza resultados
      ↓
Devuelve top 3-5 con reasoning
```

Ver [09-google-places.md](09-google-places.md) para detalles de la integración.

---

## Cuándo Usar Cada Provider

| Escenario | Provider |
|-----------|----------|
| Desarrollo local | Claude Code CLI |
| CI/CD Tests | Mock Provider |
| Staging | Anthropic API (límites bajos) |
| Producción | Anthropic API |
| Fallback si Anthropic cae | OpenAI API |

---

## Performance Targets

| Agent | Target | Razón |
|-------|--------|-------|
| Architect | <2s | Usuario espera estructura rápida |
| Curator | <5s | Incluye Google Places calls |
| Optimizer | <3s | Análisis complejo pero local |

---

## Limitaciones Claude Code CLI

- Solo funciona donde esté instalado Claude Code
- Más lento que API directa (~3-5s vs ~1-2s)
- No soporta streaming fácilmente
- Solo para desarrollo/local
- Requiere suscripción Max activa
