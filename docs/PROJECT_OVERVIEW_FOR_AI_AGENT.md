# Travelr - Documento de Contexto Completo para AI Agent

> **Propósito:** Este documento proporciona todo el contexto necesario para que un AI Agent pueda ayudar con decisiones de diseño, features de monetización, y desarrollo de nuevas funcionalidades.

---

## 1. RESUMEN EJECUTIVO

### Qué es Travelr
Travelr es una **aplicación web de planificación de viajes** que combina:
- **Canvas interactivo de 3 columnas** (el usuario ve todo su viaje de una vez)
- **3 AI Agents especializados** (no un mega-bot, sino agentes con roles específicos)
- **Google Places como motor de datos** (cero entrada manual para lugares)
- **Modo dual** (Asistido con AI o Manual con control total)

### Problema que Resuelve
Los viajeros actualmente:
- Pasan semanas investigando en múltiples sitios web
- Ingresan manualmente direcciones, horarios, precios
- Tienen dificultad para visualizar el viaje completo
- No consideran tiempos reales de traslado
- Fragmentan información entre apps, notas, screenshots

### Diferenciador Principal
| Aspecto | Wanderlog/TripIt/Otros | Travelr |
|---------|------------------------|---------|
| AI | Solo consulta | Agentes que generan |
| Entrada de datos | Manual | Auto-llenado desde Google Places |
| UX | Wizard tradicional | Canvas flexible (ver todo, editar cualquier parte) |
| Tiempo real | No | Tiempos de traslado + conflictos |

### Usuarios Target
- Viajeros independientes que planifican sus propios itinerarios
- Personas organizadas que quieren control visual
- Grupos/familias coordinando viajes
- Viajeros frecuentes que reutilizan patrones

---

## 2. STACK TECNOLÓGICO

```
Frontend:       Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend:        Supabase (Auth, PostgreSQL, Storage)
AI:             Claude Code CLI (dev) / Anthropic API / OpenAI API (prod)
Maps & Places:  Google Places API (New) + Google Maps JavaScript API
State:          Zustand (estado del canvas en cliente)
Drag & Drop:    @dnd-kit/core
```

### Variables de Entorno Clave
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
AI_PROVIDER=claude-code  # o 'anthropic' o 'openai'
GOOGLE_PLACES_API_KEY=...
GOOGLE_MAPS_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## 3. ARQUITECTURA DEL CANVAS (Core UI)

### Layout de 3 Columnas
```
┌─────────────────────────────────────────────────────────────────┐
│                         Header (fijo)                            │
├─────────────┬───────────────────────────────┬───────────────────┤
│   Sidebar   │      Panel Central            │   Panel Derecho   │
│   Izquierdo │      (Timeline)               │   (Contextual)    │
│   200-250px │      flex-1 (600-700px)       │   280-350px       │
│             │                               │                   │
│   - Resumen │      - Días con bloques       │   - Vacío         │
│   - Destinos│      - Actividades            │   - Detalles      │
│   - Modo    │      - Drag & Drop            │   - Búsqueda      │
│   - Controles│                              │   - AI Ideas      │
└─────────────┴───────────────────────────────┴───────────────────┘
```

### Responsividad
- **Desktop (>1024px):** 3 columnas visibles
- **Tablet (768-1024px):** Sidebar colapsable, 2 columnas
- **Mobile (<768px):** 1 columna, sidebar en drawer, panel derecho en modal

### Estados del Panel Derecho
1. **Vacío:** Resumen del viaje, lugares guardados
2. **Actividad seleccionada:** Detalles completos de Google Places
3. **Bloque vacío clickeado:** Búsqueda + botón "Pedir ideas al AI"
4. **Resultados de búsqueda:** Cards de Google Places
5. **Recomendaciones AI:** 3-5 opciones curadas con explicación

---

## 4. SISTEMA DE 3 AI AGENTS

### Filosofía
No usamos un "mega-agent" que hace todo. Tenemos 3 agentes especializados, cada uno optimizado para una tarea:

### Agent 1: ARCHITECT (Estructura del Viaje)
**Cuándo se llama:** Al crear viaje con "Generar borrador" o al activar modo Asistido

**Input:**
```typescript
{
  destination: "Roma, Italia"
  dates: {start: "2024-06-15", end: "2024-06-20"}
  travelers: 2
  style: 'balanced'  // 'relax' | 'balanced' | 'adventure'
  budget: 'mid'      // 'budget' | 'mid' | 'premium'
  interests?: ["museums", "food", "history"]
}
```

**Output:**
```typescript
{
  days: [{
    day_number: 1,
    title: "Llegada y exploración inicial",
    location: "Centro de Roma",
    themes: ["arrival", "walk", "local food"],
    time_blocks: [
      {start: "09:00", end: "11:30", label: "Vuelo"},
      {start: "14:00", end: "17:00", label: "Coliseo"},
      {start: "20:00", end: "22:00", label: "Cena en Trastevere"}
    ]
  }],
  summary: "5 días explorando Roma con balance entre..."
}
```

**Target de rendimiento:** <2 segundos

### Agent 2: CURATOR (Sugerencias de Actividades)
**Cuándo se llama:** Usuario hace click en "Pedir ideas al AI" en bloque vacío

**Input:**
```typescript
{
  query?: "museos",  // opcional, si el usuario buscó algo
  block: {
    day: 2,
    time_start: "10:00",
    time_end: "13:00",
    location: {lat: 41.9028, lng: 12.4964}
  },
  user_profile: {
    style: "balanced",
    interests: ["art", "history"],
    budget: "mid",
    previous_activities: ["Coliseo", "Foro Romano"]  // evitar repetidos
  }
}
```

**Output:**
```typescript
{
  recommendations: [{
    rank: 1,
    place_id: "ChIJrTLr-GyuEmsRBfy61i59si0",
    name: "Musei Vaticani",
    rating: 4.8,
    reviews: 125000,
    duration: "3h",
    cost: "€20",
    distance_km: 1.2,
    reason: "Imprescindible en Roma. Reservar con anticipación.",
    fit_score: 0.95  // qué tan bien encaja en el bloque
  }]
}
```

**Target de rendimiento:** <5 segundos (incluye llamadas a Google Places)

### Agent 3: OPTIMIZER (Logística)
**Cuándo se llama:** Usuario hace click en "Optimizar este día" o AI detecta conflictos

**Input:**
```typescript
{
  day: 2,
  activities: [
    {name: "Coliseo", start: "09:00", end: "12:00", location: {...}},
    {name: "Vaticano", start: "11:30", end: "14:30", location: {...}}  // conflicto!
  ]
}
```

**Output:**
```typescript
{
  issues: [{
    type: 'conflict',  // 'conflict' | 'travel_time' | 'opening_hours' | 'gap'
    description: "Coliseo y Vaticano se superponen 30 minutos",
    severity: 'error'  // 'error' | 'warning' | 'info'
  }],
  suggestions: [{
    suggestion: "Mover Vaticano a las 13:00",
    impact: "Evita conflicto y da tiempo para almorzar",
    action: 'apply_change'
  }],
  optimized_timeline: [
    {name: "Coliseo", start: "09:00", end: "12:00"},
    {name: "Almuerzo", start: "12:30", end: "13:30"},
    {name: "Vaticano", start: "14:00", end: "17:00"}
  ]
}
```

**Target de rendimiento:** <3 segundos

---

## 5. MODELO DE DATOS

### Tablas Principales (PostgreSQL via Supabase)

**trips** - Viajes del usuario
```sql
- id, user_id
- title, origin
- start_date, end_date
- travelers: number
- mode: 'assisted' | 'manual'
- style: 'relax' | 'balanced' | 'adventure'
- budget_level: 'budget' | 'mid' | 'premium'
- status: 'draft' | 'planning' | 'ready' | 'completed' | 'archived'
```

**destinations** - Soporte multi-destino
```sql
- id, trip_id
- name, location (lat/lng)
- google_place_id
- days_start, days_end (qué días del viaje)
- order_index
```

**activities** - Items del timeline (core del canvas)
```sql
- id, trip_id, destination_id
- title
- type: 'flight' | 'hotel' | 'restaurant' | 'attraction' | 'tour' | 'transport' | 'entertainment' | 'nature' | 'photo_spot' | 'custom' | 'free_time'
- date, time_start, time_end
- address, location (lat/lng)
- google_place_id
- google_data: JSONB (toda la data de Google Places)
- status: 'confirmed' | 'pending' | 'conflict'
- source: 'google_places' | 'ai_suggestion' | 'manual'
- ai_reasoning, ai_fit_score
- cost_estimate
- notes, booking_url, booking_confirmation
- order_index
```

**saved_places** - Biblioteca personal del usuario
```sql
- id, user_id
- google_place_id
- google_data: JSONB
- name (puede diferir del nombre Google)
- notes, tags
```

---

## 6. DESIGN SYSTEM

### Paleta de Colores
**Color principal:** Teal (#0D9488)
- Primary: #0D9488 (acciones principales, logo)
- Accent: #CCFBF1 (teal suave)
- Background: #F8FAFC (slate claro)
- Card: #FFFFFF

**Colores funcionales (fijos):**
- Verde (#10B981): Confirmado
- Ámbar (#F59E0B): Sugerencias AI, pendiente
- Rojo (#EF4444): Conflictos

### Tipografía
- Font: Inter (sans-serif)
- Títulos: font-semibold, tracking-tight
- Body: text-base, leading-relaxed

### Componentes
- Botones: rounded-xl, teal primary
- Cards: rounded-xl, border, p-6
- Inputs: h-12, border, focus:border-primary
- Badges: rounded-full, px-3 py-1.5
- Iconos: Heroicons (outline), w-4/w-6

### Indicadores de Estado en Activity Cards
- ✓ Verde: Confirmado
- ⚠️ Ámbar: Pendiente/Sugerencia AI
- ❌ Rojo: Conflicto
- ⏰ Gris: Vacío/Tiempo libre

---

## 7. FEATURES ACTUALES (Implementados)

### Crear Viaje (< 2 minutos)
Formulario de 5 campos:
1. Destino (autocomplete Google Places)
2. Fechas (date range picker)
3. Viajeros (chips: Solo, Pareja, Familia, Amigos)
4. Estilo (chips: Relax, Balanceado, Aventura)
5. Presupuesto (slider: Budget, Mid, Premium)

Dos CTAs:
- "Generar borrador (AI)" → Estructura en <2s
- "Empezar vacío" → Canvas en blanco

### Canvas Principal
- Vista completa del viaje
- Drag & drop de actividades entre bloques/días
- Click en actividad = ver detalles en panel derecho
- Click en bloque vacío = buscar o pedir ideas AI
- Toggle Asistido/Manual

### Búsqueda de Lugares
- Integración Google Places
- Búsqueda por texto o categoría
- Cards con fotos, rating, precio, duración
- Auto-llenado de todos los campos al agregar

### Feature Explore (/explore)
- Descubrir destinos populares
- Ver lugares por categoría (restaurantes, atracciones, cafés, etc.)
- Mapa interactivo con markers por categoría
- Agregar directamente a viaje existente

### Gestión de Alojamiento
- Tab de "Reservaciones" en canvas
- Subir PDF/imagen de confirmación
- Extracción automática via Claude Vision (hotel, fechas, precio, confirmación)
- Email forwarding para confirmaciones (requiere Resend)

### Exportación
- PDF detallado
- Mapa interactivo (HTML + Google Maps)
- iCal (Google Calendar, Apple Calendar)
- CSV/JSON

---

## 8. ROADMAP Y FEATURES PLANEADOS

### Fase 1: MVP (COMPLETADO)
- ✅ Formulario crear viaje
- ✅ Canvas 3 columnas responsive
- ✅ Google Places search
- ✅ AI Architect agent
- ✅ AI Curator agent
- ✅ Drag & drop
- ✅ Export PDF básico
- ✅ Toggle Asistido/Manual

### Fase 2: Polish & Performance (EN PROGRESO)
- ✅ Loading states (skeletons <2s)
- ✅ Caching (Redis para Google Places)
- ✅ Mobile responsive
- ✅ Image optimization
- ✅ Error handling
- ⬜ Unit + integration tests
- ⬜ Lighthouse >90

### Fase 3: Features Avanzados (PLANEADO)
- ⬜ AI Optimizer agent (detección conflictos, optimización)
- ⬜ Saved Places (biblioteca personal)
- ⬜ Historial de viajes
- ⬜ Sugerencias asíncronas (mientras edita)
- ⬜ Multi-export (PDF, iCal, CSV)
- ⬜ Share link (solo lectura)

### Fase 4: Integración Proveedores de Tours (PLANEADO)
- ⬜ Viator Partner API
- ⬜ GetYourGuide Partner API
- ⬜ Buscar tours en panel derecho
- ⬜ Merge Google Places + Tours
- ⬜ Flujo de booking

### Fase 5: Colaboración (PLANEADO)
- ⬜ Generación de link compartido
- ⬜ Invitar colaboradores (email)
- ⬜ Edición en tiempo real (WebSockets)
- ⬜ Historial de cambios
- ⬜ Comentarios en actividades

### Fase 6: Mobile App (POST-MVP)
- ⬜ PWA con offline cache
- ⬜ Push notifications
- ⬜ Geolocation ("¿Dónde estoy?")
- ⬜ QR code sharing
- ⬜ Apps nativas (React Native o Flutter)

---

## 9. PROBLEMAS CONOCIDOS Y LIMITACIONES

### Problema 1: Radio de Búsqueda Fijo (20km)
- Falla para destinos amplios (regiones, países)
- Ej: Buscar "Italia" encuentra Roma pero no Siena, Venecia
- **Solución propuesta:** Radio dinámico según tipo de destino

### Problema 2: Solo 6 Categorías de Lugares
Categorías actuales: Restaurants, Attractions, Cafes, Bars, Museums, Nature

Faltan:
- Plazas (point_of_interest)
- Mercados (shopping_mall)
- Iglesias/templos
- Miradores (viewpoint)
- Playas (beach)

**Solución propuesta:** Expandir categorías, agregar "landmarks" genérico

### Problema 3: Límite de 15 Lugares por Categoría
- Máximo 90 lugares enviados al AI
- AI no puede sugerir lugares fuera de esos 90
- **Solución propuesta:** Aumentar a 25-30, o sistema de dos niveles

### Problema 4: AI Puede No Usar IDs Correctamente
- AI puede inventar IDs de lugares
- Puede confundir ID con nombre
- **Solución propuesta:** Mejor prompt con ejemplos, fallback fuzzy matching

---

## 10. PRINCIPIOS DE UX

### Valores Core
1. **Mínima fricción**
   - 5 campos para empezar
   - Sin entrada manual de direcciones
   - Disclosure progresivo de opciones avanzadas

2. **Experiencia > Perfección**
   - Mostrar borrador en <2 segundos
   - Refinamientos en background
   - Usuario nunca espera bloqueado

3. **Control sin complejidad**
   - Dos modos: Asistido (AI ayuda) & Manual (control total)
   - Cambiar en cualquier momento
   - Toda acción editable y reversible

4. **Google Places es verdad**
   - Toda data de lugares viene de Google
   - AI cura, no inventa
   - Entrada manual solo para excepciones

5. **Canvas, no Wizard**
   - Layout 3 columnas, ver todo de una vez
   - Edición no-lineal (cualquier parte, en cualquier momento)
   - Sin secuencia forzada de pasos

### Qué Evitar
- Formularios largos
- Entrada manual de datos (usar Google Places)
- Operaciones bloqueantes
- Wizards complejos
- Acciones no reversibles
- Razonamiento AI sin explicar

---

## 11. COMPETENCIA Y MERCADO

### Competidores Directos
| App | Fortalezas | Debilidades |
|-----|------------|-------------|
| **Wanderlog** | UX pulido, colaboración, offline | Sin AI generativo, entrada manual |
| **TripIt** | Integración email, business travel | Interfaz anticuada, sin AI |
| **TripAdvisor** | Masiva base de reviews | Cluttered, no es planificador real |
| **Google Travel** | Integración Google | Limitado, no colaborativo |
| **Notion/Sheets** | Flexible | Requiere setup manual completo |

### Diferenciadores de Travelr
1. **AI que genera** (no solo responde)
2. **Canvas visual** (no wizard step-by-step)
3. **Auto-llenado Google Places** (cero entrada manual)
4. **3 agentes especializados** (estructura, cura, optimiza)

---

## 12. MÉTRICAS DE ÉXITO PROPUESTAS

### Engagement
- Viajes creados por usuario/mes
- Actividades agregadas por viaje
- Tiempo en canvas por sesión
- % uso modo Asistido vs Manual

### Conversión
- Visitors → Sign up
- Sign up → First trip created
- First trip → Completed trip (status = ready)

### Retención
- % usuarios que vuelven en 30 días
- % usuarios con >1 viaje
- % viajes completados vs abandonados

### Performance
- Tiempo respuesta AI Architect: <2s
- Tiempo respuesta AI Curator: <5s
- Carga inicial canvas: <3s
- Lighthouse score: >90

---

## 13. CONSIDERACIONES PARA MONETIZACIÓN

### Modelos Posibles (para explorar)

**Freemium:**
- Gratis: X viajes/mes, funciones básicas
- Pro: Viajes ilimitados, AI avanzado, colaboración

**Por uso:**
- Créditos AI consumidos
- Llamadas a Google Places

**Marketplace:**
- Comisión por bookings de tours (Viator, GetYourGuide)
- Referrals a hoteles/vuelos

**B2B:**
- Agencias de viaje
- Travel management corporativo
- White-label para blogs de viaje

### Costos Actuales a Considerar
| Servicio | Costo aproximado |
|----------|------------------|
| Google Places API | $0.007-0.035/request |
| Anthropic API | $0.003-0.015/1K tokens |
| Supabase | Free tier → $25/mes Pro |
| Vercel | Free tier → $20/mes Pro |

---

## 14. INFORMACIÓN TÉCNICA ADICIONAL

### Estructura de Carpetas
```
src/
├── app/
│   ├── trips/new/          # Crear viaje
│   ├── trips/[id]/         # Canvas
│   ├── explore/            # Descubrimiento
│   └── api/                # API routes
├── components/
│   ├── canvas/             # Componentes canvas
│   ├── trip/               # Gestión viajes
│   ├── places/             # Google Places
│   └── ai/                 # UI de AI
├── lib/
│   ├── supabase/
│   ├── ai/                 # Provider abstraction
│   ├── google/             # APIs Google
│   └── utils/
├── stores/                 # Zustand
└── types/                  # TypeScript
```

### Comandos de Desarrollo
```bash
npm run dev          # Servidor desarrollo
npm run build        # Build producción
npm test             # Tests
npm run test:ai      # Tests de AI agents
```

---

## RESUMEN PARA EL AI AGENT

Travelr es una app de planificación de viajes que se diferencia por:

1. **Canvas de 3 columnas** donde ves todo el viaje y editas cualquier parte
2. **3 AI Agents especializados**: Architect (estructura), Curator (sugiere), Optimizer (logística)
3. **Google Places como motor** para cero entrada manual
4. **Modo dual** Asistido/Manual para diferentes usuarios

**Estado actual:** MVP funcional, en fase de polish. Features principales implementados.

**Próximos pasos planeados:** Optimizer agent, saved places, integración tours, colaboración.

**Para monetización:** Considerar freemium, marketplace de tours, o B2B.

**Principios a mantener:** Mínima fricción, experiencia fluida, control sin complejidad, Google Places como verdad, canvas sobre wizard.
