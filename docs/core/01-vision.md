# Visión del Proyecto

## Inspiración

Travelr está inspirado en [Wanderlog](https://wanderlog.com), una aplicación de planificación de viajes reconocida por su excelente experiencia de usuario. Tomamos como base sus fortalezas y las expandimos con **AI Agents autónomos** que van más allá de un simple asistente consultivo, además de eliminar la fricción de entrada manual de datos mediante la integración profunda con Google Places.

Para el diseño detallado de la aplicación, ver [Diseño Completo](travelr_design_complete.md).

---

## Qué es Travelr

Una aplicación de planificación de viajes que combina inteligencia artificial con interfaces intuitivas para crear itinerarios completos sin fricción. A diferencia de otras apps que usan AI solo para consultas, Travelr utiliza **AI Agents** para:

- Generar estructura inicial de viajes (destinos, duración, bloques de tiempo)
- Sugerir actividades contextuales y priorizadas
- Optimizar logística (tiempos de traslado, conflictos de horarios)
- Permitir control total manual para usuarios avanzados

---

## Problema que Resuelve

Planificar un viaje puede ser abrumador:
- Semanas de investigación en múltiples sitios web
- Entrada manual tediosa de direcciones, horarios, precios
- Dificultad para visualizar el viaje completo
- Itinerarios que no consideran tiempos de traslado reales
- Información dispersa que no se conecta

---

## Solución: Canvas + AI Agents

### El Modelo Canvas

Un espacio de trabajo visual donde el usuario ve **todo su viaje de una vez**:

```
┌─────────────┬──────────────────────┬────────────────┐
│  Sidebar    │   Panel Central      │  Panel Derecho │
│  Izquierdo  │   (Timeline)         │  (Contextual)  │
│             │                      │                │
│  - Resumen  │   - Días y horas     │  - Búsqueda    │
│  - Destinos │   - Actividades      │  - Detalles    │
│  - Controles│   - Bloques vacíos   │  - Sugerencias │
└─────────────┴──────────────────────┴────────────────┘
```

### 3 AI Agents Especializados

| Agent | Función | Cuándo se usa |
|-------|---------|---------------|
| **Architect** | Genera estructura del viaje (días, bloques, temas) | Al crear viaje con "Generar borrador" |
| **Curator** | Sugiere actividades priorizadas desde Google Places | Al pedir ideas para un bloque vacío |
| **Optimizer** | Detecta conflictos, optimiza tiempos de traslado | Al tocar "Optimizar este día" |

### Google Places como Verdad

El usuario NO digita datos manualmente. Toda información de lugares viene de Google Places:
- Nombre, ubicación, dirección
- Horarios de apertura
- Fotos, rating, reviews
- Teléfono, website
- Duración típica, costo estimado

---

## Principios Fundamentales de UX

### 1. Fricción Mínima
- Máximo 4-5 campos para crear un viaje
- Toda información de lugares: desde Google Places
- Progressive profiling: preguntas adicionales solo en contexto

### 2. Experiencia > Perfectibilidad
- Mostrar borrador rápido primero (estructura en <2s)
- Refinamientos incrementales en background
- Usuario NO espera bloqueado; puede seguir editando

### 3. Control Total sin Complejidad
- Dos modos: "Asistido" (AI propone) y "Manual" (usuario controla)
- Conmutable en cualquier momento
- Cada acción es editable y reversible

### 4. Google Places es la Verdad
- Google Places es el motor de descubrimiento
- AI cura y prioriza, no inventa
- Entrada manual: solo para casos excepcionales

### 5. Canvas, No Wizard
- Un layout continuo (three-column)
- Usuario ve todo el viaje de una vez
- Cualquier parte es clickeable y editable
- No hay "pasos obligatorios" ni flujos lineales

---

## Diferencias vs Competencia

| Aspecto | Wanderlog | Otros (TripIt, etc.) | **Travelr** |
|---------|-----------|----------------------|-------------|
| AI | Solo consultas | Ninguno | Agents generadores |
| Entrada de datos | Manual | Manual | Google Places automático |
| Reservas | Redirige a proveedores | Booking directo | Redirige + anota |
| UX | Tradicional | Formulario | Canvas flexible |
| Modo offline | Limitado | No | Sí (futuro) |
| Colaboración | Real-time | No | Real-time (futuro) |

---

## Usuario Objetivo

- **Viajeros que planifican por su cuenta**: Quieren control pero no quieren perder horas investigando
- **Personas organizadas**: Valoran ver todo en un solo lugar
- **Grupos y familias**: Necesitan coordinar itinerarios compartidos (futuro)
- **Viajeros frecuentes**: Quieren reutilizar lugares guardados entre viajes

---

## Valores de Diseño

| Valor | Significado |
|-------|-------------|
| **Fricción = muerte** | Cada campo, cada paso debe ser necesario |
| **Datos de verdad** | Google Places, no invenciones de AI |
| **Velocidad** | Borrador rápido > perfecto lento |
| **Reversible** | Todo se puede cambiar/deshacer |
| **Transparente** | Usuario ve por qué la AI sugiere algo |

---

## Lo que NO es Travelr

- NO es un wizard de pasos obligatorios
- NO requiere que el usuario digite direcciones manualmente
- NO es solo un chatbot que responde preguntas
- NO genera información inventada (todo viene de fuentes reales)
- NO bloquea al usuario mientras la AI "piensa"
