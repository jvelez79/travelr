# Guía de Desarrollo

## Setup Inicial

### Prerrequisitos
- Node.js 18+
- npm o pnpm
- Cuenta de Supabase
- Cuenta de Google Cloud (para Places API)
- Claude Code instalado (para AI en dev)

### Instalación

```bash
# Clonar/navegar al proyecto
cd travelr

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar Supabase
# - Crear proyecto en supabase.com
# - Copiar URL y anon key a .env.local

# Configurar Google Places
# - Crear proyecto en Google Cloud Console
# - Habilitar Places API y Maps JavaScript API
# - Crear API keys (una restringida a server, otra a cliente)

# Correr migraciones
npx supabase db push

# Iniciar desarrollo
npm run dev
```

### Variables de Entorno

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Solo para server-side

# AI Provider
AI_PROVIDER=claude-code  # claude-code | anthropic | openai

# Solo si usas APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Google Places (Server-side - NO exponer al cliente)
GOOGLE_PLACES_API_KEY=AIza...

# Google Maps (Client-side - restringido por dominio)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# SerpAPI (Hoteles)
SERPAPI_API_KEY=...

# Skyscanner (Vuelos)
SKYSCANNER_API_KEY=...
SKYSCANNER_API_HOST=...
```

---

## Comandos

```bash
# Desarrollo
npm run dev          # Inicia en localhost:3333

# Build
npm run build        # Build de producción
npm run start        # Inicia build de producción

# Linting
npm run lint         # ESLint
npm run lint:fix     # ESLint con auto-fix

# Types
npm run typecheck    # Verifica tipos TypeScript

# Tests
npm test             # Corre tests
npm run test:watch   # Tests en modo watch
npm run test:ai      # Tests de AI agents (mock)
```

---

## Convenciones de Código

### Estructura de Archivos
- Componentes en PascalCase: `ActivityCard.tsx`
- Hooks en camelCase con 'use': `usePlan.ts`
- Utils en camelCase: `formatTime.ts`
- Contexts en PascalCase: `CanvasContext.tsx`

### Componentes
```typescript
// Preferir function components con types explícitos
interface ActivityCardProps {
  activity: TimelineEntry;
  onSelect?: (id: string) => void;
  isDragging?: boolean;
}

export function ActivityCard({ activity, onSelect, isDragging }: ActivityCardProps) {
  return (...)
}
```

### Imports
```typescript
// Orden de imports
import { useState } from 'react';              // 1. React
import { useRouter } from 'next/navigation';   // 2. Next.js
import { useCanvas } from '@/contexts/...';    // 3. Contexts
import { Button } from '@/components/ui/...';  // 4. UI components
import { ActivityCard } from '@/components/...'; // 5. Componentes
import { formatTime } from '@/lib/...';        // 6. Lib/utils
import type { TimelineEntry } from '@/types/...'; // 7. Types
```

### Naming
- Variables/funciones: `camelCase`
- Componentes/Types: `PascalCase`
- Constantes: `SCREAMING_SNAKE_CASE`
- Archivos de componente: `PascalCase.tsx`
- Archivos de context: `PascalCase.tsx`
- Otros archivos: `kebab-case.ts`

---

## Estructura de Componentes

```
components/
├── ui/                    # shadcn/ui (no modificar directamente)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
│
├── canvas/                # ⭐ Componentes del canvas principal
│   ├── CanvasLayout.tsx   # Layout de 3 columnas
│   ├── CanvasContext.tsx  # Context para UI state
│   ├── CanvasDndContext.tsx # Drag & Drop
│   ├── CanvasHeader.tsx
│   ├── LeftSidebar/
│   │   ├── index.tsx
│   │   └── ThingsToDoSection.tsx  # Ideas guardadas
│   ├── CentralPanel.tsx
│   └── RightPanel/
│       ├── index.tsx
│       ├── PlaceSearch.tsx
│       └── AIPanel.tsx
│
├── explore/               # Modal de exploración
│   ├── ExploreModal.tsx
│   ├── PlaceDetailPanel.tsx
│   ├── PlaceGrid.tsx
│   └── CuratedDiscoveryView.tsx
│
├── planning/              # Componentes de planificación
│   ├── DayCard.tsx
│   ├── TimelineEntry.tsx
│   └── editor/
│
├── ai/                    # Componentes de AI
│   ├── PlaceChip.tsx
│   ├── ChatPanel.tsx
│   └── DaySelectorDropdown.tsx
│
└── layout/                # Layout components
    ├── Header.tsx
    └── ...
```

---

## State Management (Context API)

### Canvas Context

El estado UI del canvas se maneja con React Context.

```typescript
// contexts/CanvasContext.tsx
interface CanvasContextType {
  // UI state
  rightPanelState: RightPanelState;
  exploreModalState: ExploreModalState;
  isSidebarOpen: boolean;

  // Actions
  selectActivity: (activityId: string) => void;
  openSearch: (query?: string) => void;
  openAIPanel: () => void;
  openExploreModal: (category?: string) => void;
  closeExploreModal: () => void;
}

type RightPanelState =
  | { type: 'empty' }
  | { type: 'activity'; activityId: string }
  | { type: 'search'; query: string }
  | { type: 'ai' }
  | { type: 'customActivity' }
  | { type: 'accommodation' };
```

### Uso en Componentes

```typescript
// En componentes
function ActivityCard({ activityId }: { activityId: string }) {
  const { selectActivity, rightPanelState } = useCanvas();

  const isSelected =
    rightPanelState.type === 'activity' &&
    rightPanelState.activityId === activityId;

  return (
    <div
      onClick={() => selectActivity(activityId)}
      className={cn(isSelected && 'ring-2 ring-primary')}
    >
      ...
    </div>
  );
}
```

### Plan Data (Hooks)

Los datos del plan se manejan con custom hooks que interactúan con Supabase:

```typescript
// hooks/usePlan.ts
function usePlan(tripId: string) {
  return {
    plan: GeneratedPlan | null,
    isLoading: boolean,
    error: Error | null,
    updateDay: (dayIndex: number, data: ItineraryDay) => Promise<void>,
    addActivity: (dayIndex: number, activity: TimelineEntry) => Promise<void>,
    removeActivity: (dayIndex: number, activityId: string) => Promise<void>,
  };
}
```

---

## Custom Hooks

### Hooks Principales

```typescript
// hooks/usePlan.ts - Plan completo
const { plan, updateDay, addActivity } = usePlan(tripId);

// hooks/useTrips.ts - Lista de viajes
const { trips, createTrip, deleteTrip } = useTrips();

// hooks/useThingsToDo.ts - Ideas guardadas
const { items, addItem, removeItem } = useThingsToDo(tripId);

// hooks/useDayGeneration.ts - Generación de días
const { generateDay, isGenerating, progress } = useDayGeneration(tripId);

// hooks/useChatConversation.ts - Chat con Travel Agent
const { messages, sendMessage, isStreaming } = useChatConversation(tripId);

// hooks/useCuratedDiscovery.ts - Descubrimiento de lugares
const { places, isLoading, refresh } = useCuratedDiscovery(destination, category);
```

### Patrón de Hook

```typescript
// Estructura típica de un hook
export function useThingsToDo(tripId: string | null) {
  const [items, setItems] = useState<ThingsToDoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  // Fetch inicial
  const fetchItems = useCallback(async () => {
    if (!user || !tripId) return;
    // ... fetch logic
  }, [user, tripId, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Actions
  const addItem = useCallback(async (input: AddInput) => {
    // ... add logic
  }, [user, supabase]);

  return { items, loading, error, addItem, refetch: fetchItems };
}
```

---

## API Routes Pattern

### Estructura de Endpoint

```typescript
// app/api/ai/generate-day/route.ts

import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/providers';

export async function POST(request: Request) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Parse input
  const input = await request.json();

  // 3. Validate
  if (!input.tripId || !input.dayNumber) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 4. Business logic
  try {
    const ai = getAIProvider();
    const result = await ai.complete(buildPrompt(input));

    // 5. Save to DB if needed
    await supabase
      .from('plans')
      .update({ /* ... */ })
      .eq('trip_id', input.tripId);

    return Response.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

### Streaming Pattern

```typescript
// Para respuestas de AI largas
export async function POST(request: Request) {
  // ... setup

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of ai.stream(prompt)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/hooks/useThingsToDo.test.ts
import { renderHook, act } from '@testing-library/react';
import { useThingsToDo } from '@/hooks/useThingsToDo';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ data: [], error: null }) }),
    }),
  }),
}));

describe('useThingsToDo', () => {
  it('fetches items on mount', async () => {
    const { result } = renderHook(() => useThingsToDo('trip-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### API Route Tests

```typescript
// __tests__/api/generate-day.test.ts
import { POST } from '@/app/api/ai/generate-day/route';

jest.mock('@/lib/ai/providers', () => ({
  getAIProvider: () => ({
    complete: jest.fn().mockResolvedValue('Generated content'),
  }),
}));

describe('POST /api/ai/generate-day', () => {
  it('returns generated day', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ tripId: '1', dayNumber: 1 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

---

## Git Workflow

### Branches
- `main` - Producción (deploy automático)
- `develop` - Desarrollo (opcional)
- `feature/xxx` - Features nuevos
- `fix/xxx` - Bug fixes

### Commits
```
feat: add activity drag and drop
fix: correct time block overlap detection
docs: update API documentation
refactor: simplify canvas state management
style: improve activity card spacing
chore: update dependencies
```

### Feature Flow
```bash
# 1. Crear branch desde main
git checkout main
git pull
git checkout -b feature/optimize-day-modal

# 2. Desarrollar con commits frecuentes
git add .
git commit -m "feat: add optimize modal UI"

# 3. Push y PR
git push -u origin feature/optimize-day-modal
# Crear PR en GitHub

# 4. Merge después de review
```

---

## Debugging

### Canvas Context
```typescript
// Ver estado del canvas
const canvasState = useCanvas();
console.log('Canvas state:', canvasState);
```

### AI Requests
```typescript
// Ver logs en /admin/ai-logs
// O en consola del servidor
console.log('AI Request:', { endpoint, input, output });
```

### Supabase Queries
```typescript
// Ver queries
const { data, error } = await supabase
  .from('plans')
  .select('*')
  .eq('trip_id', tripId);

console.log('Query result:', { data, error });

// Dashboard: supabase.com > Logs > API logs
```

### React DevTools
- Instalar extensión de Chrome
- Inspeccionar Context providers
- Ver árbol de componentes

---

## Deployment

### Vercel (Recomendado)
1. Conectar repo a Vercel
2. Configurar variables de entorno
3. Deploy automático en push a main

### Variables en Producción
```env
# Cambiar provider a API
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Places (restringir por IP en producción)
GOOGLE_PLACES_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Supabase producción
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# APIs externas
SERPAPI_API_KEY=...
SKYSCANNER_API_KEY=...
```

### Checklist Pre-Deploy
- [ ] Variables de entorno configuradas
- [ ] Google API keys restringidas por dominio
- [ ] RLS policies verificadas en Supabase
- [ ] Tests pasando
- [ ] Build local exitoso (`npm run build`)
- [ ] TypeScript sin errores (`npm run typecheck`)

---

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [@dnd-kit](https://dndkit.com/)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
