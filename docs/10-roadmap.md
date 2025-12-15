# Roadmap de Implementación

## Visión General

El desarrollo de Travelr sigue un enfoque iterativo, priorizando un MVP funcional y luego agregando features avanzadas.

```
Fase 1: MVP
  ↓
Fase 2: Pulido & Performance
  ↓
Fase 3: Features Avanzadas
  ↓
Fase 4: Integración Tours
  ↓
Fase 5: Colaboración
  ↓
Fase 6: Mobile App
```

---

## Fase 1: MVP (Core Experience)

**Objetivo**: Canvas funcional con Google Places + AI básico

### Deliverables

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Crear viaje | Formulario de 5 campos + 2 CTAs | ⬜ Pendiente |
| Canvas principal | Layout 3 columnas responsive | ⬜ Pendiente |
| Google Places search | Búsqueda y resultados en panel derecho | ⬜ Pendiente |
| AI Agent: Architect | Generar estructura de viaje | ⬜ Pendiente |
| AI Agent: Curator | Sugerencias básicas para bloques | ⬜ Pendiente |
| Drag & Drop | Mover actividades entre bloques | ⬜ Pendiente |
| Exportar PDF | PDF simple del itinerario | ⬜ Pendiente |
| Modo toggle | Switch Asistido/Manual | ⬜ Pendiente |

### Componentes Clave

```
components/
├── trip/
│   └── TripCreator.tsx
├── canvas/
│   ├── Canvas.tsx
│   ├── Sidebar.tsx
│   ├── Timeline.tsx
│   ├── DaySection.tsx
│   ├── TimeBlock.tsx
│   ├── ActivityCard.tsx
│   └── ContextPanel/
├── places/
│   ├── PlaceSearch.tsx
│   └── PlaceCard.tsx
└── ai/
    └── AILoadingState.tsx
```

### API Routes

```
/api/
├── trips/
│   ├── route.ts          # GET/POST
│   └── [id]/route.ts     # GET/PUT/DELETE
├── ai-agents/
│   ├── architect/route.ts
│   └── curator/route.ts
└── places/
    ├── search/route.ts
    └── details/route.ts
```

### No Incluye (para fases futuras)

- Compartir con grupo
- Colaboración real-time
- Integración Viator/GetYourGuide
- Mobile optimizado
- Historial de viajes

---

## Fase 2: Pulido & Performance

**Objetivo**: Experiencia fluida, rápida, responsive

### Deliverables

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Loading states | Skeletons y spinners optimizados | ⬜ Pendiente |
| Caching | Redis para Google Places (1h TTL) | ⬜ Pendiente |
| Mobile responsive | Sidebar collapse, drawer modal | ⬜ Pendiente |
| Image optimization | Next/Image, lazy loading, blur placeholders | ⬜ Pendiente |
| Error handling | Errores graceful, retry logic | ⬜ Pendiente |
| Tests | Unit + Integration tests | ⬜ Pendiente |

### Targets de Performance

| Métrica | Target | Medición |
|---------|--------|----------|
| AI Architect | <2s | Tiempo de respuesta |
| AI Curator | <5s | Incluye Google Places |
| Google Places search | <1s | Con cache hit |
| Canvas initial load | <3s | TTI (Time to Interactive) |
| Lighthouse score | >90 | Performance audit |

### Optimizaciones

1. **Server Components**: Usar RSC para sidebar y datos estáticos
2. **Client Components**: Solo para interactividad (canvas, drag & drop)
3. **Streaming**: AI responses con streaming cuando sea posible
4. **Field Masks**: Solo pedir campos necesarios de Google Places

---

## Fase 3: Features Avanzadas

**Objetivo**: Más poder, más automatización

### Deliverables

| Feature | Descripción | Estado |
|---------|-------------|--------|
| AI Agent: Optimizer | Detectar conflictos, optimizar tiempos | ⬜ Pendiente |
| Saved Places | Biblioteca personal de lugares | ⬜ Pendiente |
| Historial de viajes | Ver viajes anteriores | ⬜ Pendiente |
| Sugerencias async | Sugerir mientras usuario edita | ⬜ Pendiente |
| Multi-export | PDF, iCal, CSV | ⬜ Pendiente |
| Share link | Link read-only del itinerario | ⬜ Pendiente |

### AI Agent: Optimizer

```typescript
// Input: día con actividades
// Output: issues + suggestions + timeline optimizado

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
  }>;
  optimized_timeline: Activity[];
}
```

### Saved Places

```typescript
// Tabla saved_places
{
  id: uuid,
  user_id: uuid,
  google_place_id: string,
  google_data: jsonb,
  notes: string,
  tags: string[],
  created_at: timestamp
}
```

---

## Fase 4: Integración Tours Providers

**Objetivo**: Tours guiados dentro del canvas

### Deliverables

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Viator API | Integración Partner API | ⬜ Pendiente |
| GetYourGuide API | Integración Partner API | ⬜ Pendiente |
| Tours search | Búsqueda de tours en panel derecho | ⬜ Pendiente |
| Source fusion | Mostrar Google Places + Tours juntos | ⬜ Pendiente |
| Booking flow | Redirigir a booking (si es partner) | ⬜ Pendiente |

### Modelo de Datos Extendido

```typescript
interface Activity {
  // ... campos existentes
  source: 'google_places' | 'ai_suggestion' | 'manual' | 'viator' | 'getyourguide';
  booking_url?: string;
  provider_data?: {
    provider: 'viator' | 'getyourguide';
    product_id: string;
    price: number;
    currency: string;
  };
}
```

---

## Fase 5: Colaboración

**Objetivo**: Itinerarios compartidos en tiempo real

### Deliverables

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Share link | Generar link compartible | ⬜ Pendiente |
| Invite collaborators | Invitar por email | ⬜ Pendiente |
| Real-time editing | WebSockets para sync | ⬜ Pendiente |
| Version history | Historial de cambios | ⬜ Pendiente |
| Comments | Comentarios en actividades | ⬜ Pendiente |

### Arquitectura Real-time

```
Supabase Realtime
├── trips channel
│   └── Broadcast: activity_updated, activity_added, activity_deleted
├── presence
│   └── Quién está viendo/editando
└── comments channel
    └── Nuevos comentarios
```

### Modelo de Permisos

```typescript
type TripRole = 'owner' | 'editor' | 'viewer';

interface TripCollaborator {
  trip_id: string;
  user_id: string;
  role: TripRole;
  invited_at: timestamp;
  accepted_at?: timestamp;
}
```

---

## Fase 6: Mobile App

**Objetivo**: PWA + Native apps

### Deliverables

| Feature | Descripción | Estado |
|---------|-------------|--------|
| PWA | Service worker, offline cache | ⬜ Pendiente |
| Push notifications | Recordatorios de actividades | ⬜ Pendiente |
| Geolocation | "¿Dónde estoy ahora?" | ⬜ Pendiente |
| QR codes | Compartir viaje via QR | ⬜ Pendiente |
| Native app | React Native o Flutter | ⬜ Pendiente |

### PWA Features

```json
// manifest.json
{
  "name": "Travelr",
  "short_name": "Travelr",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFBF5",
  "theme_color": "#B45309"
}
```

### Offline Strategy

```typescript
// Cache estratégico
const CACHE_STRATEGIES = {
  // Viaje actual: cache first, network fallback
  trips: 'cache-first',
  // Google Places: network first, cache fallback
  places: 'network-first',
  // Fotos: cache only después de descarga
  photos: 'cache-only',
  // AI: network only (no cachear respuestas AI)
  ai: 'network-only'
};
```

---

## Criterios de Éxito por Fase

### Fase 1 (MVP)
- [ ] Usuario puede crear viaje y ver canvas
- [ ] Google Places funciona
- [ ] AI genera estructura básica
- [ ] Puede exportar PDF

### Fase 2 (Performance)
- [ ] Lighthouse >90
- [ ] Mobile usable
- [ ] <5s para cualquier operación

### Fase 3 (Avanzado)
- [ ] Optimizer detecta conflictos
- [ ] Usuario puede guardar lugares
- [ ] Historial funciona

### Fase 4 (Tours)
- [ ] Tours de Viator aparecen
- [ ] Booking redirect funciona

### Fase 5 (Colaboración)
- [ ] 2+ usuarios pueden editar
- [ ] Cambios sync en real-time

### Fase 6 (Mobile)
- [ ] PWA instalable
- [ ] Funciona offline (lectura)

---

## Priorización

```
MUST HAVE (Fase 1)
├── Canvas 3 columnas
├── Google Places search
├── AI Architect
└── Exportar básico

SHOULD HAVE (Fase 2-3)
├── Mobile responsive
├── Caching
├── AI Optimizer
└── Saved places

COULD HAVE (Fase 4-5)
├── Tours providers
├── Real-time collab
└── Comments

WON'T HAVE (por ahora)
├── Booking directo
├── Pagos
└── Social features
```

---

## Dependencias Técnicas

### Fase 1
- Next.js 14+
- Supabase (Auth, DB)
- Google Places API
- AI Provider (Claude/OpenAI)
- @dnd-kit/core

### Fase 2
- Redis (Upstash)
- next/image optimization
- Jest + Testing Library

### Fase 3
- Distance Matrix API
- iCal generation library

### Fase 4
- Viator Partner API credentials
- GetYourGuide Partner API credentials

### Fase 5
- Supabase Realtime
- WebSocket handling

### Fase 6
- next-pwa
- React Native / Flutter (decisión pendiente)

---

## Features Pendientes de Elaborar

Features identificados para implementar. Se detallarán y asignarán a una fase cuando se trabaje en ellos.

| Feature | Descripción | Fase Sugerida |
|---------|-------------|---------------|
| Búsqueda de Vuelos | Sistema para buscar y comparar vuelos. Integración con APIs (Amadeus, Skyscanner, Kiwi) | Fase 3 |
| Presupuesto (Budget) | Gestión del presupuesto del viaje. Tracking de gastos, límites, distribución por categoría | Fase 3 |
| Equipaje | Gestión de listas de equipaje. Checklist de qué llevar, sugerencias según destino/clima | Fase 3 |
| Documentos | Gestión de documentos de viaje (pasaportes, visas, reservaciones, seguros) | Fase 3 |

---

## Feature Implementado: Gestión de Alojamientos

**Estado:** Implementado (2025-12-14)

### Funcionalidades

1. **Tab "Reservaciones"** en el canvas principal
   - Vista de todas las reservaciones confirmadas
   - Vista de sugerencias de AI
   - Acceso desde `[Timeline] [Mapa] [Reservaciones]`

2. **Upload de recibo (PDF/imagen)**
   - Drag & drop o selección de archivo
   - Extracción automática con Claude Vision
   - Confirmación/edición de datos extraídos

3. **Forward de email** (requiere configuración Resend)
   - Dirección única por viaje: `trip-{id}@inbound.travelr.app`
   - Webhook para procesar emails entrantes
   - Extracción automática de confirmaciones

### Datos extraídos
- Nombre del hotel
- Tipo (hotel, airbnb, hostel, resort, etc.)
- Dirección, ciudad, país
- Fechas check-in/check-out y horarios
- Precio total y por noche
- Número de confirmación
- Plataforma de booking
- Nombres de los huéspedes

### API Routes
- `POST /api/accommodations/extract` - Extraer datos de PDF/imagen
- `POST /api/accommodations/inbound` - Webhook para emails (Resend)

### Componentes
- `AccommodationsView` - Vista principal
- `AccommodationCard` - Card de reservación
- `AddAccommodationModal` - Modal para agregar
- `ReceiptUploader` - Upload de archivos
- `ExtractedDataConfirmation` - Confirmar datos
- `EmailForwardInstructions` - Instrucciones de email

### Configuración requerida (para email forward)
```env
RESEND_API_KEY=re_xxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxx
RESEND_INBOUND_DOMAIN=inbound.travelr.app
```

*Última actualización: 2025-12-14*
