# Travelr

Web app de planificación de viajes con un **canvas interactivo de 3 columnas** y **3 AI Agents especializados**. El usuario ve todo su viaje de una vez y puede editar cualquier parte directamente, con datos auto-completados de Google Places.

## Concepto Core

- **Canvas, no wizard**: Todo visible, editable desde cualquier punto
- **Google Places como motor**: Cero entrada manual para lugares públicos
- **3 AI Agents**: Architect (estructura), Curator (sugerencias), Optimizer (logística)
- **Modo dual**: Asistido (AI ayuda) o Manual (control total)

## Stack

- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **AI:** Abstracto - Claude Code CLI (dev) / Anthropic API / OpenAI API (prod)
- **Maps & Places:** Google Places API + Google Maps
- **State:** Zustand (canvas state)
- **Drag & Drop:** @dnd-kit

## Estructura

```
travelr/
├── src/           # Código fuente Next.js
├── public/        # Assets estáticos
└── docs/          # Documentación detallada
```

## Documentación Detallada

### Core
- [Visión y Objetivo](docs/01-vision.md) - Paradigma canvas + AI
- [Arquitectura Técnica](docs/02-arquitectura.md) - Layout 3 columnas, componentes
- [Pantallas y UI](docs/03-pantallas.md) - Especificación de todas las pantallas
- [AI Provider](docs/04-ai-provider.md) - 3 Agents especializados
- [Modelo de Datos](docs/05-modelo-datos.md) - Schema con Activities

### Desarrollo
- [Guía de Desarrollo](docs/06-guia-desarrollo.md) - Setup, Zustand, testing
- [Design System](docs/07-design-system.md) - Colores, tipografía, patrones canvas

### Features
- [Explore Feature](docs/08-explore-feature.md) - Descubrimiento de destinos
- [Google Places](docs/09-google-places.md) - Integración completa
- [Roadmap](docs/10-roadmap.md) - Fases de implementación

### Referencia
- [Design Complete](docs/travelr_design_complete.md) - Documento maestro de diseño

## Comandos

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm test
npm run test:ai    # Tests de AI agents
```

## Testing

Cuando te pida hacer testing del app, debes usar el Chrome DevTools MCP para hacer testing en el browser. Para efectos de prueba, quiero que utilices la siguiente información:

- **Destino:** Costa Rica
- **Origen:** Puerto Rico
- **Fechas:** del 7 de diciembre al 13 de diciembre
- **Cantidad de personas:** 9 personas

## Arquitectura del Canvas

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
│   - Controles│     - Drag & Drop            │   - Búsqueda      │
│             │                               │   - AI Ideas      │
└─────────────┴───────────────────────────────┴───────────────────┘
```

## Gestión de Tareas (Linear)

**IMPORTANTE:** Todas las tareas del proyecto se gestionan exclusivamente en **Linear** (equipo: Travelr_ai).

- Usar Linear MCP para crear, actualizar y consultar tareas
- No usar TodoWrite para tareas del proyecto - solo para planificación interna de sesión
- Siempre sincronizar el progreso con Linear

## Documentación con Context7

**IMPORTANTE:** Siempre que vayas a configurar o interactuar con cualquier servicio o elemento de Supabase (Auth, Database, Storage, Edge Functions, RLS, etc.), debes usar el MCP server **Context7** para obtener la documentación actualizada de Supabase.

```
# Primero resolver el library ID
mcp__context7__resolve-library-id: "supabase"

# Luego obtener la documentación relevante
mcp__context7__get-library-docs: context7CompatibleLibraryID="/supabase/supabase", topic="<tema específico>"
```

Esto asegura que siempre uses las APIs y patrones más recientes de Supabase.

## Ambientes

| Ambiente | URL |
|----------|-----|
| Producción | https://travelr.vercel.app |
| Local | http://localhost:3000 |

## Herramientas de Debugging y Validación

### Vercel CLI
Disponible para debugging y validación del ambiente de producción/preview:

```bash
# Ver deployments
vercel ls

# Ver logs de producción
vercel logs [deployment-url]

# Ver variables de entorno
vercel env ls
```

### Supabase MCP
El MCP de Supabase está disponible para interactuar directamente con el proyecto:

- **Consultas SQL**: Ejecutar queries directamente en la base de datos
- **Ver tablas**: Listar y explorar estructura de tablas
- **Migrations**: Ver y aplicar migraciones
- **Logs**: Consultar logs de servicios (auth, postgres, edge functions)
- **Edge Functions**: Listar, ver y deployar funciones

Usar estas herramientas para:
- Validar que los datos están correctos en producción
- Debugging de problemas en tiempo real
- Verificar estado de migraciones
- Monitorear logs de errores

## Notas Importantes

- El AI Provider permite usar Claude Code CLI en desarrollo para aprovechar suscripción Max
- Google Places es la fuente de verdad para todos los datos de lugares
- El canvas usa Zustand para state management con optimistic updates
- **Supabase**: Siempre consultar documentación via Context7 antes de implementar

## Solo Dev Workflow System

Este proyecto usa un sistema de workflow optimizado para desarrollo solo con skills, subagents y commands.

### Quick Start

```bash
# Ship a feature from idea to production
/feature-quick [idea description]

# Example
/feature-quick Add ability to share trips with friends via link
```

### Skills (`.claude/skills/`)

| Skill | Purpose |
|-------|---------|
| `skill-feature-validation` | GO/NO-GO decisions on feature ideas |
| `skill-nextjs-patterns` | Next.js 14 App Router conventions |
| `skill-supabase-patterns` | Supabase integration patterns |
| `skill-zustand-canvas` | Canvas state management |
| `skill-travel-domain` | Travel industry knowledge |
| `skill-tdd-nextjs` | Quick MVP testing patterns |
| `skill-ui-ux-travel-app` | UI/UX design system patterns and guidelines |

### Agents (`.claude/agents/`)

| Agent | Role |
|-------|------|
| `business-advisor-agent` | Feature validation (GO/MAYBE/NO-GO) |
| `full-stack-builder-agent` | Primary implementation |
| `quick-reviewer-agent` | Pragmatic code review |
| `debugger-agent` | Bug investigation and fixes |
| `ux-system-designer-agent` | Design system guardian - generates UI patterns |
| `ux-reviewer-agent` | UX quality gate - reviews UI implementations |
| `ux-analyst-agent` | Conceptual usability analyst - evaluates features for clarity, value, user understanding |

### Commands (`.claude/commands/`)

| Command | Description |
|---------|-------------|
| `/feature-quick` | Ship a feature from idea to production |

### Workflow Phases

```
1. VALIDATE (15 min)  → business-advisor-agent → GO/NO-GO
2. PLAN (15-30 min)   → Define implementation checklist
3. BUILD (2-4 hours)  → full-stack-builder-agent → Feature branch
4. REVIEW (10 min)    → quick-reviewer-agent → OK/FIXES
5. SHIP              → Merge → Deploy → Monitor
```

### Key Reference Files

When implementing new features, reference these existing patterns:
- `src/hooks/useTrips.ts` - Hook pattern
- `src/components/planning/PlanningModeSelector.tsx` - Component pattern
- `src/app/api/generation/start/route.ts` - API route pattern
- `src/contexts/AuthContext.tsx` - Auth context pattern
- `src/components/canvas/CanvasContext.tsx` - Canvas state pattern


### CRITICAL INFORMATION

- Siempre (sin excepciones) que necesites hacer busquedas en internet o research usaras el skill perplexity-researcher

## Reglas Críticas de Supabase Queries

### .single() vs .maybeSingle() - NUNCA CONFUNDIR

**REGLA ABSOLUTA:**

| Método | Cuándo Usar | Comportamiento si no hay filas |
|--------|-------------|-------------------------------|
| `.single()` | SOLO cuando GARANTIZAS que existe exactamente 1 fila (ej: query por primary key después de INSERT) | **ERROR 406** - Rompe el flujo |
| `.maybeSingle()` | Cuando la fila PUEDE o NO existir (ej: verificar si existe un registro) | Retorna `null` - Flujo continúa |

**Ejemplos Correctos:**

```typescript
// ✅ CORRECTO: Verificar si existe un generation_state (puede no existir)
const { data: existingState } = await supabase
  .from('generation_states')
  .select('status')
  .eq('trip_id', tripId)
  .maybeSingle()  // ← Retorna null si no existe

// ✅ CORRECTO: Obtener un trip que DEBE existir (ya validado)
const { data: trip } = await supabase
  .from('trips')
  .select('*')
  .eq('id', tripId)
  .single()  // ← OK porque sabemos que existe
```

**NUNCA HACER:**

```typescript
// ❌ INCORRECTO: Verificar existencia con .single()
const { data } = await supabase
  .from('generation_states')
  .select('status')
  .eq('trip_id', tripId)
  .single()  // ← ERROR 406 si no existe fila!
```

**Por qué esto es crítico:**
- En producción, `.single()` sin fila retorna HTTP 406 (Not Acceptable)
- El código puede parecer funcionar en desarrollo pero fallar en producción
- Este error es SILENCIOSO si no se verifica el `error` de la respuesta
- Ha causado bugs de generación atascada múltiples veces en este proyecto
