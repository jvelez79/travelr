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

## Notas Importantes

- El AI Provider permite usar Claude Code CLI en desarrollo para aprovechar suscripción Max
- Google Places es la fuente de verdad para todos los datos de lugares
- El canvas usa Zustand para state management con optimistic updates
