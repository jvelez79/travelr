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

# AI Provider
AI_PROVIDER=claude-code  # claude-code | anthropic | openai

# Solo si usas APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Google Places (Server-side - NO exponer al cliente)
GOOGLE_PLACES_API_KEY=AIza...

# Google Maps (Client-side - restringido por dominio)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Opcional: Redis para cache de Places
REDIS_URL=redis://localhost:6379
```

---

## Comandos

```bash
# Desarrollo
npm run dev          # Inicia en localhost:3000

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
- Hooks en camelCase con 'use': `useCanvasStore.ts`
- Utils en camelCase: `formatTime.ts`
- Stores en kebab-case: `canvas-store.ts`

### Componentes
```typescript
// Preferir function components con types explícitos
interface ActivityCardProps {
  activity: Activity;
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
import { useCanvasStore } from '@/stores/...'; // 3. Stores
import { Button } from '@/components/ui/...';  // 4. UI components
import { ActivityCard } from '@/components/...'; // 5. Componentes
import { formatTime } from '@/lib/...';        // 6. Lib/utils
import type { Activity } from '@/types/...';   // 7. Types
```

### Naming
- Variables/funciones: `camelCase`
- Componentes/Types: `PascalCase`
- Constantes: `SCREAMING_SNAKE_CASE`
- Archivos de componente: `PascalCase.tsx`
- Archivos de store: `kebab-case.ts`
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
│   ├── Canvas.tsx         # Layout de 3 columnas
│   ├── Sidebar.tsx        # Panel izquierdo
│   ├── Timeline.tsx       # Panel central
│   ├── DaySection.tsx     # Sección de un día
│   ├── TimeBlock.tsx      # Bloque de tiempo (vacío/lleno)
│   ├── ActivityCard.tsx   # Card de actividad
│   └── ContextPanel/      # Panel derecho
│       ├── index.tsx
│       ├── EmptyState.tsx
│       ├── ActivityDetails.tsx
│       ├── SearchResults.tsx
│       └── AIRecommendations.tsx
│
├── trip/                  # Componentes de gestión de viaje
│   ├── TripCreator.tsx    # Formulario de crear viaje
│   ├── TripCard.tsx       # Card en lista de viajes
│   ├── TripList.tsx       # Lista de viajes
│   └── ModeToggle.tsx     # Toggle Asistido/Manual
│
├── places/                # Integración Google Places
│   ├── PlaceCard.tsx      # Card de lugar
│   ├── PlaceDetails.tsx   # Modal de detalles
│   ├── PlaceSearch.tsx    # Barra de búsqueda
│   └── PlaceMap.tsx       # Mapa embebido
│
├── ai/                    # Componentes de AI
│   ├── AILoadingState.tsx # Estado "AI pensando..."
│   ├── AIReasoningBadge.tsx # Badge "Sugerido por AI"
│   └── OptimizeModal.tsx  # Modal de optimización
│
└── layout/                # Layout components
    ├── Header.tsx
    ├── CanvasHeader.tsx   # Header específico del canvas
    └── ...
```

---

## State Management (Zustand)

### Canvas Store

El estado del canvas se maneja con Zustand para actualizaciones optimistas y reactivas.

```typescript
// stores/canvas-store.ts
import { create } from 'zustand';
import type { Activity, Destination, Trip, PanelState } from '@/types';

interface CanvasState {
  // Datos
  trip: Trip | null;
  destinations: Destination[];
  activities: Activity[];

  // UI State
  selectedActivity: Activity | null;
  selectedTimeBlock: TimeBlock | null;
  rightPanelState: PanelState;
  mode: 'assisted' | 'manual';

  // Actions
  setTrip: (trip: Trip) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  moveActivity: (id: string, newDate: string, newTime: string) => void;
  selectActivity: (activity: Activity | null) => void;
  setRightPanelState: (state: PanelState) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // Initial state
  trip: null,
  destinations: [],
  activities: [],
  selectedActivity: null,
  selectedTimeBlock: null,
  rightPanelState: { type: 'empty' },
  mode: 'assisted',

  // Actions con optimistic updates
  addActivity: (activity) =>
    set((state) => ({
      activities: [...state.activities, activity],
    })),

  moveActivity: (id, newDate, newTime) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, date: newDate, time_start: newTime } : a
      ),
    })),

  // ... más actions
}));
```

### Patrones de Uso

```typescript
// En componentes - usar selectores específicos
function ActivityCard({ activityId }: { activityId: string }) {
  // ✅ Bueno: selector específico, re-render solo cuando cambia esta actividad
  const activity = useCanvasStore(
    (state) => state.activities.find(a => a.id === activityId)
  );

  // ❌ Malo: suscribirse a todo el array
  const { activities } = useCanvasStore();
}

// Acciones fuera de componentes
function handleDragEnd(activityId: string, newDate: string, newTime: string) {
  // Acceder a actions directamente
  useCanvasStore.getState().moveActivity(activityId, newDate, newTime);
}
```

### Sincronización con Backend

```typescript
// Patrón: Optimistic update + sync
async function addActivityToTrip(activity: Omit<Activity, 'id'>) {
  const tempId = `temp-${Date.now()}`;

  // 1. Optimistic update
  useCanvasStore.getState().addActivity({ ...activity, id: tempId });

  try {
    // 2. Sync con backend
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;

    // 3. Reemplazar temp con real
    useCanvasStore.getState().updateActivity(tempId, { id: data.id });
  } catch (error) {
    // 4. Rollback on error
    useCanvasStore.getState().deleteActivity(tempId);
    throw error;
  }
}
```

---

## AI Agents Development

### Estructura de Agents

```
lib/
├── ai/
│   ├── provider.ts      # Abstracción del provider
│   ├── architect.ts     # Agent: genera estructura
│   ├── curator.ts       # Agent: sugiere actividades
│   └── optimizer.ts     # Agent: optimiza logística
```

### Implementar un Agent

```typescript
// lib/ai/curator.ts
import { getAIProvider } from './provider';
import { searchGooglePlaces } from '@/lib/google/places';
import type { CuratorInput, CuratorOutput } from '@/types';

export async function getActivityRecommendations(
  input: CuratorInput
): Promise<CuratorOutput> {
  // 1. Obtener datos de Google Places
  const places = await searchGooglePlaces({
    query: input.query,
    location: input.block.location,
    radius: 5000,
  });

  // 2. Construir prompt con contexto
  const prompt = buildCuratorPrompt(input, places);

  // 3. Llamar al AI provider
  const ai = getAIProvider();
  const result = await ai.askJSON<CuratorOutput>(prompt);

  // 4. Enriquecer con datos de Places
  return enrichWithPlaceData(result, places);
}

function buildCuratorPrompt(input: CuratorInput, places: Place[]): string {
  return `
Eres un curador de viajes. Basándote en:
- Tiempo disponible: ${input.block.duration_hours} horas
- Estilo: ${input.user_profile.style}
- Intereses: ${input.user_profile.interests.join(', ')}
- Presupuesto: ${input.user_profile.budget}

Aquí hay ${places.length} actividades de Google Places:
${JSON.stringify(places, null, 2)}

Sugiere 3-5 actividades ordenadas por relevancia.
Devuelve JSON con estructura CuratorOutput.
  `.trim();
}
```

### Testing AI Agents

```typescript
// __tests__/ai/curator.test.ts
import { getActivityRecommendations } from '@/lib/ai/curator';

// Mock del provider
jest.mock('@/lib/ai/provider', () => ({
  getAIProvider: () => ({
    askJSON: jest.fn().mockResolvedValue({
      recommendations: [
        { rank: 1, name: 'Test Place', reason: 'Test reason' }
      ]
    })
  })
}));

// Mock de Google Places
jest.mock('@/lib/google/places', () => ({
  searchGooglePlaces: jest.fn().mockResolvedValue([
    { place_id: 'test', name: 'Test Place' }
  ])
}));

describe('Curator Agent', () => {
  it('returns recommendations based on user profile', async () => {
    const input: CuratorInput = {
      block: { day: 1, time_start: '09:00', duration_hours: 3 },
      user_profile: { style: 'balanced', interests: ['museums'] }
    };

    const result = await getActivityRecommendations(input);

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].name).toBe('Test Place');
  });
});
```

### Debugging AI

```typescript
// Habilitar logging de prompts/respuestas
// En .env.local
AI_DEBUG=true

// En provider.ts
if (process.env.AI_DEBUG === 'true') {
  console.log('AI Prompt:', prompt);
  console.log('AI Response:', response);
}
```

---

## Google Places Integration

### Búsqueda de Lugares

```typescript
// lib/google/places.ts
export async function searchGooglePlaces(params: {
  query?: string;
  location: { lat: number; lng: number };
  radius: number;
  type?: string;
}): Promise<Place[]> {
  const response = await fetch('/api/places/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!response.ok) throw new Error('Places search failed');
  return response.json();
}
```

### Caching

```typescript
// Los resultados de Google Places se cachean para:
// 1. Reducir costos de API
// 2. Mejorar performance

// En el API route
const cacheKey = `places:${lat}:${lng}:${query}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return Response.json(JSON.parse(cached));
}

const results = await googlePlaces.search(params);
await redis.set(cacheKey, JSON.stringify(results), 'EX', 3600); // 1 hora

return Response.json(results);
```

---

## Git Workflow

### Branches
- `main` - Producción
- `develop` - Desarrollo
- `feature/xxx` - Features nuevos
- `fix/xxx` - Bug fixes

### Commits
```
feat: add activity drag and drop
fix: correct time block overlap detection
docs: update API documentation
refactor: simplify canvas state management
style: improve activity card spacing
```

### Feature Flow
```bash
# 1. Crear branch desde develop
git checkout develop
git pull
git checkout -b feature/optimize-day-modal

# 2. Desarrollar
# ... commits ...

# 3. Push y PR
git push -u origin feature/optimize-day-modal
# Crear PR en GitHub

# 4. Merge después de review
```

---

## Debugging

### Canvas State
```typescript
// Ver estado completo del canvas
console.log(useCanvasStore.getState());

// Suscribirse a cambios específicos
useCanvasStore.subscribe(
  (state) => state.activities,
  (activities) => console.log('Activities changed:', activities)
);
```

### AI Provider
```typescript
// Para ver qué provider está activo
console.log('AI Provider:', process.env.AI_PROVIDER);

// Para probar manualmente
const ai = getAIProvider();
const response = await ai.ask('Test prompt');
console.log(response);
```

### Google Places
```typescript
// Ver requests en Network tab
// Los requests van a /api/places/* (proxy)

// Ver errores de API
// Google Cloud Console > APIs & Services > Credentials > Ver errores
```

### Supabase
```typescript
// Ver queries en desarrollo
// Supabase dashboard > Logs > API logs

// Debug RLS policies
// Supabase dashboard > Authentication > Policies
```

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

# Redis producción (Upstash recomendado)
REDIS_URL=redis://...
```

### Checklist Pre-Deploy
- [ ] Variables de entorno configuradas
- [ ] Google API keys restringidas por dominio
- [ ] RLS policies verificadas en Supabase
- [ ] Tests pasando
- [ ] Build local exitoso

---

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [@dnd-kit](https://dndkit.com/)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
