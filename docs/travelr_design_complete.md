# TRAVELR - Diseño de Aplicación Completo
## Travel Planning with AI-Assisted Itineraries

**Versión**: 1.0  
**Fecha**: Diciembre 2025  
**Aplicación**: Travelr (Clone Wanderlog + AI Agents)  
**Ubicación**: Puerto Rico  

---

## ÍNDICE

1. [Visión General](#visión-general)
2. [Principios Fundamentales de UX](#principios-fundamentales-de-ux)
3. [Flujo del Usuario: El Proceso de Planificación](#flujo-del-usuario-el-proceso-de-planificación)
4. [Canvas Principal: Arquitectura Visual](#canvas-principal-arquitectura-visual)
5. [Integración de Google Places](#integración-de-google-places)
6. [Roles de la AI en el Sistema](#roles-de-la-ai-en-el-sistema)
7. [Especificación de Pantallas](#especificación-de-pantallas)
8. [Flujos de Datos Técnicos](#flujos-de-datos-técnicos)
9. [Stack Tecnológico](#stack-tecnológico)
10. [Roadmap de Implementación](#roadmap-de-implementación)

---

## 1. Visión General

### ¿Qué es Travelr?

Travelr es una aplicación de planificación de viajes que combina inteligencia artificial con interfaces intuitivas para que los usuarios creen itinerarios completos sin fricción. A diferencia de Wanderlog (que usa AI solo para consultas), Travelr utiliza **AI agents** para:

- Generar estructura inicial de viajes (destinos, duración, bloques de tiempo).
- Sugerir actividades contextuales y priorizadas.
- Optimizar logística (tiempos de traslado, conflictos de horarios).
- Permitir control total manual para usuarios avanzados.

### Objetivo Principal

Reducir el tiempo y esfuerzo de planificación de viajes desde semanas a minutos, manteniendo una **experiencia de usuario fluida** donde:
- El usuario NO entra datos manualmente (salvo en casos edge).
- Casi toda información proviene de **Google Places**.
- El usuario tiene **control total** en cada paso.
- La aplicación se siente como un "lienzo de trabajo", no un wizard.

### Diferencias clave vs. Competencia

| Aspecto | Wanderlog | Otros (TripAdvisor, etc.) | **Travelr** |
|---------|-----------|-------------------------|----------|
| AI | Solo consultas | Ninguno | Agents generadores |
| Entrada de datos | Manual | Manual | Google Places automático |
| Reservas | Redirige a proveedores | Booking directo | Redirige + anota |
| UX | Tradicional | Formulario | Canvas flexible |
| Modo offline | Limitado | No | Sí |
| Colaboración | Real-time | No | Real-time (future) |

---

## 2. Principios Fundamentales de UX

### 2.1 Fricción Mínima

**Problema**: Si el usuario debe responder 10 preguntas o digitar direcciones, no usará la app.

**Solución**:
- Preguntas iniciales: máximo 4 campos (destino, fechas, quién viaja, presupuesto).
- Toda información de lugares: desde Google Places (sin digitar).
- Progressive profiling: preguntas adicionales solo en contexto.

### 2.2 Experiencia > Perfectibilidad

**Problema**: Generar itinerario perfecto en 3 segundos vs. itinerario perfecto en 30 segundos.

**Solución**:
- Mostrar borrador rápido primero (estructura en <2s).
- Refinamientos incrementales en background.
- Usuario NO espera bloqueado; puede seguir editando.

### 2.3 Control Total sin Complejidad

**Problema**: Usuarios avanzados quieren control, usuarios novatos quieren ayuda.

**Solución**:
- Dos modos: "Asistido" (AI propone) y "Manual" (usuario controla).
- Conmutable en cualquier momento.
- En ambos, cada acción es editable y reversible.

### 2.4 Google Places es la Verdad

**Problema**: El usuario no debe digitar "Colosseum", "Via del Corso", "horario de apertura", etc.

**Solución**:
- Google Places es el motor de descubrimiento.
- AI cuida y prioriza, no inventa.
- Entrada manual: solo para casos excepcionales (tours privados, eventos personalizados).

### 2.5 Canvas, No Wizard

**Problema**: Wizards encierran al usuario en una secuencia lineal.

**Solución**:
- Un layout continuo (three-column: sidebar, timeline, panel derecho).
- Usuario ve todo el viaje de una vez.
- Cualquier parte es clickeable y editable en cualquier momento.
- No hay "pasos obligatorios" ni flujos lineales.

---

## 3. Flujo del Usuario: El Proceso de Planificación

### Fase 0: Crear un Viaje (Antes del Canvas)

**Pantalla**: "Empecemos tu viaje"

**Datos mínimos**:
1. **Destino**: Input con búsqueda (Google Places como fuente)
2. **Fechas**: Date range picker
3. **Quién viaja**: Chips (Solo, Pareja, Familia, Amigos)
4. **Estilo**: Chips (Relax, Balanceado, Aventura)
5. **Presupuesto**: Slider o chips (Budget, Mid, Premium)

**Acción**: Botón "Crear borrador" o "Empezar vacío"

**Resultado**:
- Si "Crear borrador": AI genera estructura (días, títulos por bloque, algunas sugerencias iniciales).
- Si "Empezar vacío": Canvas limpio, el usuario construye todo.

---

### Fase 1: Ver el Canvas Principal

**Pantalla**: Canvas de tres columnas (vea sección 4)

**Lo que ve el usuario**:
- Sidebar izquierdo: resumen del viaje, toggle modo, navegación de destinos.
- Panel central: timeline con días y actividades.
- Panel derecho: contexto (vacío o mostrado si selecciona algo).

**Sensación**: "Veo todo mi viaje de un vistazo. Puedo editar lo que quiera."

---

### Fase 2: Rellenar un Bloque de Tiempo Vacío

**Escenario**: Usuario hace clic en "Día 1 – Tarde libre (15:00–19:00)"

**Panel derecho muestra**:
1. Caja de búsqueda: "¿Qué quieres hacer?" (ej. "museos", "pizza", "tours")
2. Botón: "Déjame sugerir ideas (AI)"
3. Mis lugares guardados

**Flujo A: Búsqueda directa**
```
Usuario escribe "museos"
    ↓
Google Places devuelve ~8 resultados con fotos, rating, horario
    ↓
Usuario hace clic en uno: "Musei Vaticani"
    ↓
Se añade al timeline instantáneamente con TODOS LOS DATOS:
    - Ubicación, horario, teléfono, website, rating, duración
    (TODO de Google Places, cero manual)
    ↓
Usuario puede arrastrarlo a otra hora si quiere
```

**Flujo B: Sugerencias de AI**
```
Usuario toca "Déjame sugerir ideas"
    ↓
AI analiza: tipo de día, tiempo disponible, intereses previos
    ↓
AI busca en Google Places con filtros inteligentes
    ↓
Devuelve 3–5 opciones priorizadas con contexto:
    "Musei Vaticani (recomendado, imprescindible pero concurrido)"
    "Galería Borghese (alternativa menos concurrida)"
    ↓
Usuario hace clic en "[➕ Agregar]"
    ↓
Se añade al timeline con todos los datos, con badge "AI" (amarillo)
    ↓
Usuario puede confirmar o rechazar
```

---

### Fase 3: Gestión del Itinerario Completo

**Acciones disponibles en cada actividad**:
- Arrastrar a otra hora/día (drag & drop)
- Ver detalles completos (click en el card)
- Editar (cambiar hora, agregar notas, eliminar)
- Confirmar reserva (redirige a Google Maps/website del lugar)
- Optimizar el día (si hay conflictos o gaps)

**Acciones globales**:
- Cambiar modo (Asistido ↔ Manual)
- Añadir destino nuevo
- Exportar itinerario
- Compartir con grupo (future)

---

### Fase 4: Optimizar y Finalizar

**Flujo de Optimización**:
```
Usuario toca "Optimizar este día"
    ↓
AI analiza:
    - Actividades presentes
    - Tiempos de traslado (Google Maps)
    - Horarios de apertura (Google Places)
    - Gaps de tiempo libre
    ↓
Propone cambios (sin aplicarlos):
    - "Reordenar para ahorrar 30 min de traslado"
    - "Hay conflicto: tour de 3h + cena a misma hora"
    - "Puedo rellenar el gap de 14:00–16:00"
    ↓
Usuario revisa y acepta/rechaza cada cambio
    ↓
Se aplican los cambios aceptados
```

**Exportación**:
- PDF con itinerario detallado
- Mapa interactivo (Google Maps embebido)
- CSV / JSON para sincronizar con otros apps
- Link compartible (future)

---

## 4. Canvas Principal: Arquitectura Visual

### 4.1 Layout General: Three-Column

```
┌─────────────┬──────────────────────┬────────────────┐
│             │                      │                │
│  Sidebar    │   Panel Central      │  Panel Derecho │
│  Izquierdo  │   (Timeline)         │  (Contextual)  │
│             │                      │                │
│  200–250px  │    600–700px         │  280–350px     │
│             │                      │                │
└─────────────┴──────────────────────┴────────────────┘
```

### 4.2 Sidebar Izquierdo

**Contenidos** (de arriba a abajo):

1. **Header del Viaje**
   - Título: "Viaje a Roma"
   - Subtítulo: "5 días • Para 2 personas • Ene 15–20, 2026"
   - Toggle: Modo Asistido / Modo Manual

2. **Controles Rápidos** (iconos pequeños)
   - ⚙️ Editar detalles
   - 📥 Exportar
   - 🔗 Compartir

3. **Lista de Destinos** (scrollable)
   ```
   📍 Roma
      Días 1–3
      [⋯ menú]
   
   📍 Florencia
      Días 4–5
      [⋯ menú]
   ```

4. **Botón Principal**
   - "+ Agregar destino"

---

### 4.3 Panel Central (Timeline)

**Encabezado**:
```
Timeline de tu viaje | [Cambiar vista: Lista/Grid]
```

**Estructura por Día**:

```
┌──────────────────────────────────────────────────┐
│ 📅 Día 1 – Lunes, Enero 15                       │
│ Llegada y exploración inicial                    │
├──────────────────────────────────────────────────┤
│                                                  │
│ ├─ 09:00–11:30  ✈️ Vuelo LIH–FCO                │
│ │  Lufthansa LH 431                              │
│ │  ⭐ Confirmado ✓                               │
│ │  [Editar] [Mover] [Eliminar]                  │
│ │                                                │
│ ├─ 12:00–14:00  🏨 Hotel Roma (Check-in)       │
│ │  Via del Corso, 150, Roma                     │
│ │  ⭐ Confirmado ✓                               │
│ │  [Editar] [Mover] [Eliminar]                  │
│ │                                                │
│ ├─ 15:00–17:00  👤 [Vacío – Tarde libre]       │
│ │  [+ Agregar actividad] [AI: Dame ideas]      │
│ │                                                │
│ └─ 19:00–21:00  🍽️ Cena en Trastevere         │
│    Armando al Pantheon (sugerencia AI)          │
│    ⭐ Pendiente (⚠️)                             │
│    [Confirmar] [Rechazar] [Editar]              │
│                                                  │
│ [Botón flotante: Optimizar este día]            │
└──────────────────────────────────────────────────┘
```

**Iconos por Tipo de Actividad**:
- ✈️ Vuelo
- 🏨 Alojamiento
- 🏛️ Museo/Cultura
- 🍽️ Comida/Restaurante
- 🎭 Entretenimiento
- 🌲 Naturaleza/Outdoor
- 📸 Foto/Mirador
- 🎫 Tour guiado
- 👤 Actividad genérica

**Código de Colores**:
- Verde ✓: Confirmado/Bloqueado (Google Places)
- Amarillo ⚠️: Sugerencia AI (pendiente confirmación)
- Gris: Vacío
- Rojo ❌: Conflicto (solapamiento, logística imposible)

**Interactividad**:
- **Draggable**: Arrastrar entre horarios/días
- **Click**: Abre panel derecho con detalles
- **Hover**: Botones de edición visibles
- **Responsive**: En mobile, se reorganiza

---

### 4.4 Panel Derecho (Contextual)

**Estado 0: Vacío (por defecto)**
```
Resumen del viaje:
- 5 días
- 2 personas
- Presupuesto: $3,500 total
- Actividades confirmadas: 12
- Pendientes: 3
```

**Estado A: Clic en una Actividad Existente**
```
┌────────────────────────────────┐
│ 🏛️ Musei Vaticani              │
│ [Google Places badge]          │
├────────────────────────────────┤
│                                │
│ Ubicación:                      │
│ Viale Vaticano, Roma           │
│ 📍 [Ver en mapa]               │
│                                │
│ Contacto:                       │
│ ☎️ +39 06 6988 4676            │
│ 🌐 musei.vatican.va            │
│                                │
│ Horario:                        │
│ 🕐 09:00–18:00 (Lu–Do)         │
│ Cerrado: algunos Lu            │
│                                │
│ Info:                           │
│ ⭐ 4.8 (12.5K reviews)         │
│ 💰 €20 / persona               │
│ ⏱️ Duración típica: 3h         │
│ 📏 Distancia: 1.2 km           │
│                                │
│ [✓ Confirmar] [✏️ Editar]     │
│ [🗺️ Abrir Google Maps]         │
│ [💬 Leer reviews] [✕ Quitar]  │
│                                │
│ ─────────────────────────────  │
│ 💡 Sugerencia AI:              │
│ "3h de recorrido. Llega 15 min │
│  antes para evitar colas."     │
│                                │
└────────────────────────────────┘
```

**Estado B: Clic en un Bloque Vacío**
```
┌────────────────────────────────┐
│ Tarde libre – Día 1            │
│ (15:00 – 19:00)                │
├────────────────────────────────┤
│                                │
│ 🔍 Buscar en Google Places    │
│ ┌──────────────────────────┐  │
│ │ "Qué quieres hacer?"     │  │
│ │ (ej. museos, pizza)      │  │
│ └──────────────────────────┘  │
│                                │
│ — O —                          │
│                                │
│ 💡 Déjame sugerir ideas        │
│ [Pedir ideas a la AI]          │
│                                │
│ ─────────────────────────────  │
│ 📌 Mis lugares guardados       │
│ • Colosseum (⭐ 4.8)           │
│ • Foro Romano (⭐ 4.7)         │
│ [+ Agregar uno]                │
│                                │
└────────────────────────────────┘
```

**Estado C: Resultados de Google Places (Búsqueda Directa)**
```
┌────────────────────────────────┐
│ Resultados para "museos"       │
│ (5 km de tu hotel)             │
├────────────────────────────────┤
│                                │
│ 1. 🏛️ Musei Vaticani           │
│    ⭐ 4.8 (12.5K) | €20 | 3h   │
│    [📷 Fotos] [🗺️ Mapa]        │
│    [➕ Agregar] [❤️ Guardar]   │
│                                │
│ 2. 🎭 Galería Borghese         │
│    ⭐ 4.7 (8.2K) | €18 | 2h    │
│    [📷 Fotos] [🗺️ Mapa]        │
│    [➕ Agregar] [❤️ Guardar]   │
│                                │
│ 3. 🖼️ Palazzo Altemps          │
│    ⭐ 4.6 (3.1K) | €12 | 1.5h  │
│    [📷 Fotos] [🗺️ Mapa]        │
│    [➕ Agregar] [❤️ Guardar]   │
│                                │
│ [Ver más] [Filtros]            │
│                                │
└────────────────────────────────┘
```

**Estado D: Sugerencias de AI (Curada)**
```
┌────────────────────────────────┐
│ 💡 Ideas para tu tarde         │
│ (Basadas en tu estilo)         │
├────────────────────────────────┤
│                                │
│ ⭐⭐ TOP RECOMENDACIONES:       │
│                                │
│ 1. 🏛️ Musei Vaticani (★)      │
│    ⭐ 4.8 | €20 | 3h | 1.2km   │
│    "Imprescindible, aunque     │
│     con mucha gente"           │
│    [➕ Agregar] [ℹ️ Info]      │
│                                │
│ 2. 🍝 Armando al Pantheon     │
│    ⭐ 4.6 | €45 | 1.5h | 0.8km │
│    "Especialidad: pasta,       │
│     reserva anticipada"        │
│    [➕ Agregar] [ℹ️ Info]      │
│                                │
│ 3. 🎭 Galería Borghese        │
│    ⭐ 4.7 | €18 | 2h | 2.3km   │
│    "Menos concurrida,          │
│     arte excelente"            │
│    [➕ Agregar] [ℹ️ Info]      │
│                                │
│ Otras opciones:                │
│ • Palazzo Altemps              │
│ • Piazza Navona                │
│                                │
│ [Mostrar en mapa] [Ver más]    │
│                                │
└────────────────────────────────┘
```

---

### 4.5 Loading State (Cuando AI Piensa)

```
┌────────────────────────────────┐
│ 💭 AI pensando...              │
│ ⟳ (spinner elegante)           │
│                                │
│ "Analizando actividades        │
│  cercanas y tiempos de         │
│  traslado..."                  │
│                                │
│ [Cancelar]                     │
└────────────────────────────────┘
```

**Timing**: <2 segundos para búsquedas; <5s para optimizaciones.

---

## 5. Integración de Google Places

### 5.1 Por Qué Google Places

- **Cobertura global**: Casi todas las actividades públicas existen en Google Places.
- **Datos ricos**: Fotos, rating, reviews, horarios, teléfono, website.
- **APIs maduras**: Text Search, Nearby Search, Place Details, bien documentadas.
- **Costo razonable**: USD $0.007–0.035 por request (cacheable).

### 5.2 Flujo Técnico

```
Usuario escribe: "museos"
    ↓
Frontend envía query a backend:
    POST /api/search-places {
      query: "museos",
      location: {lat: 41.9028, lng: 12.4964},
      radius: 5000,
      types: ["museum"] (opcional)
    }
    ↓
Backend llama Google Places API:
    places.searchNearby({
      query: "museos",
      location: {lat, lng},
      radius: 5000,
      key: GOOGLE_PLACES_API_KEY
    })
    ↓
Google devuelve ~8–20 resultados:
    [{
      name: "Musei Vaticani",
      rating: 4.8,
      reviews: 12500,
      address: "Viale Vaticano, Roma",
      photos: [photo_reference],
      opening_hours: {...},
      place_id: "ChIJ...",
      types: ["museum", "tourist_attraction"],
      geometry: {location: {lat, lng}}
    }, ...]
    ↓
Backend enriquece con datos adicionales:
    - Horarios de apertura (place details)
    - Fotos (Photo API)
    - Duración típica (heurística + datos históricos)
    - Distancia desde ubicación del usuario
    ↓
Frontend muestra resultados en panel derecho
    ↓
Usuario hace clic: [➕ Agregar al día]
    ↓
Se crea evento en timeline con todos los datos:
    {
      title: "Musei Vaticani",
      location: {lat, lng},
      address: "Viale Vaticano, Roma",
      phone: "+39 06 6988 4676",
      website: "musei.vatican.va",
      rating: 4.8,
      reviews: 12500,
      opening_hours: {...},
      estimated_duration: "3h",
      estimated_cost: "€20",
      google_place_id: "ChIJ...",
      source: "google_places",
      status: "pending_confirmation"
    }
```

### 5.3 Datos que Llena Automáticamente

Cuando un usuario agrega una actividad desde Google Places:

| Campo | Fuente | Automático |
|-------|--------|-----------|
| Nombre | Google Places | ✅ |
| Ubicación (coordenadas) | Google Places | ✅ |
| Dirección | Google Places | ✅ |
| Teléfono | Google Places | ✅ |
| Website | Google Places | ✅ |
| Rating | Google Places | ✅ |
| Fotos | Google Places Photo API | ✅ |
| Horario de apertura | Google Places | ✅ |
| Duración típica | Heurística (museo ~2–3h) | ✅ |
| Costo estimado | Google Places (si existe) | ✅ |
| Distancia | Google Maps Distance API | ✅ |
| Tiempo de traslado | Google Maps Directions API | ✅ |

**Datos que NO se auto-rellenan** (casos raros):
- Notas personales ("llegamos 15 min antes")
- Confirmación de reserva (user confirm sí/no)
- Cambios de horario específico (si el usuario lo quiere)

### 5.4 Casos Edge: Entrada Manual Mínima

#### Caso 1: Evento Personalizado
```
Usuario toca: "+ Evento personalizado"
    ↓
Modal simple:
    Nombre: [_______________]
    Hora inicio: [HH:MM]
    Hora fin: [HH:MM]
    Notas (opcional): [_______________]
    ↓
Se añade con icono "personalizado" (diferente color)
```

#### Caso 2: Lugar no en Google Places
```
Usuario busca: "tour privado con Juan Pérez"
    ↓
No hay resultados en Google Places
    ↓
AI sugiere: "No encontré eso. ¿Detalles manuales?"
    ↓
Modal similar al caso 1 aparece
```

#### Caso 3: Agregar Nota a Lugar Existente
```
Usuario toca [✏️ Editar] en "Musei Vaticani"
    ↓
Se abre drawer con opción:
    [Datos de Google Places] (readonly)
    [Notas personales]: "Llegamos 15 min antes para evitar colas"
    ↓
Nota se guarda vinculada al evento, no reemplaza datos de Google
```

---

## 6. Roles de la AI en el Sistema

### 6.1 Modelo Conceptual: AI como Asistente Modular

La AI NO es un "mega-agente" que hace todo de una vez. Es **tres servicios especializados**:

```
┌─────────────────────────────────────────┐
│        USUARIO INTERACTÚA                │
├─────────────────────────────────────────┤
│                                         │
│  AI AGENT 1: Arquitecto                 │
│  ├─ Crear estructura de viaje            │
│  ├─ Dividir en destinos/bloques         │
│  └─ Proponer duración por bloque        │
│                                         │
│  AI AGENT 2: Curador de Actividades    │
│  ├─ Buscar en Google Places             │
│  ├─ Priorizar por perfil del usuario   │
│  └─ Devolver 3–5 opciones curadas      │
│                                         │
│  AI AGENT 3: Optimizador de Logística  │
│  ├─ Analizar horarios/tiempos          │
│  ├─ Detectar conflictos                │
│  └─ Proponer reorganización             │
│                                         │
└─────────────────────────────────────────┘
```

### 6.2 AI Agent 1: Arquitecto (Estructura de Viaje)

**Cuándo se llama**:
- Al crear un viaje con "Generar borrador"
- Al cambiar modo a "Asistido" (regenerar borrador)

**Inputs**:
```
{
  destination: "Roma",
  dates: {start: "2026-01-15", end: "2026-01-20"},
  travelers: 2,
  style: "balanceado",
  budget: "mid",
  interests: ["historia", "gastronomía", "arte"]  // opcional, progressive
}
```

**Output**:
```
{
  days: [
    {
      day_number: 1,
      title: "Llegada y exploración inicial",
      location: "Roma Centro",
      themes: ["llegada", "paseo", "comida local"],
      time_blocks: [
        {start: "09:00", end: "11:30", label: "Vuelo"},
        {start: "12:00", end: "14:00", label: "Hotel check-in"},
        {start: "15:00", end: "19:00", label: "Libre"},
        {start: "19:00", end: "21:00", label: "Cena"}
      ]
    },
    // ... más días
  ],
  summary: "5 días explorando Roma con énfasis en arte e historia. Ritmo relajado con tiempos libres para descansar."
}
```

**Prompt (conceptual)**:
```
Eres un experto planificador de viajes. Basándote en:
- Destino: [destino]
- Duración: [X días]
- Número de viajeros: [N]
- Estilo: [relax/balanceado/aventura]
- Intereses: [lista]

Genera una estructura de viaje que:
1. Divida los días en bloques temáticos (ej. "Centro histórico", "Naturaleza")
2. Incluya actividades ancla (vuelo, hotel, comidas principales)
3. Deje tiempos libres (NO llene cada hora)
4. Sea realista en términos de logística
5. Adapte ritmo al estilo (relax = mañanas tranquilas, aventura = más actividades)

Devuelve JSON con estructura de días, títulos, temas, y bloques de tiempo.
```

**Performance**: <2 segundos (respuesta texto simple)

---

### 6.3 AI Agent 2: Curador de Actividades

**Cuándo se llama**:
- Usuario toca "Pedir ideas a la AI" en un bloque vacío
- (Opcional) Usuario hace búsqueda; AI refina y ordena resultados

**Inputs**:
```
{
  query: "qué hay para hacer" (puede ser vacío),
  block: {
    day: 1,
    time_start: "15:00",
    time_end: "19:00",
    duration_hours: 4,
    location: {lat: 41.9028, lng: 12.4964}
  },
  user_profile: {
    style: "balanceado",
    interests: ["historia", "gastronomía"],
    budget: "mid",
    previous_activities: ["Colosseum", "Foro Romano"]  // aprende del historial
  }
}
```

**Output**:
```
{
  recommendations: [
    {
      rank: 1,
      place_id: "ChIJ...",
      name: "Musei Vaticani",
      category: "museum",
      rating: 4.8,
      reviews: 12500,
      duration: "3h",
      cost: "€20",
      distance_km: 1.2,
      reason: "Imprescindible en Roma, aunque con mucha gente",
      fit_score: 0.95  // qué tan bien encaja en el time block
    },
    {
      rank: 2,
      place_id: "ChIJ...",
      name: "Armando al Pantheon",
      category: "restaurant",
      rating: 4.6,
      reviews: 2300,
      duration: "1.5h",
      cost: "€45",
      distance_km: 0.8,
      reason: "Especializado en pasta, vistas al Panteón",
      fit_score: 0.88
    },
    {
      rank: 3,
      place_id: "ChIJ...",
      name: "Galería Borghese",
      category: "museum",
      rating: 4.7,
      reviews: 8200,
      duration: "2h",
      cost: "€18",
      distance_km: 2.3,
      reason: "Alternativa menos concurrida, arte excelente",
      fit_score: 0.82
    }
  ],
  other_nearby_options: [
    {name: "Palazzo Altemps", category: "museum"},
    {name: "Piazza Navona", category: "public_square"}
  ]
}
```

**Prompt (conceptual)**:
```
Eres un curador de viajes. Basándote en:
- Disponibilidad de tiempo: [X horas]
- Ubicación actual: [lat/lng]
- Estilo del usuario: [relax/balanceado/aventura]
- Intereses: [lista]
- Presupuesto: [bajo/medio/alto]
- Historial: [lugares visitados antes]

Sugiere 3–5 actividades que:
1. Encajen en el time block disponible
2. Estén ordenadas por relevancia para ESTE usuario (no genérico)
3. Tengan diversidad (no todas museos, si lo quiere)
4. Consideren logística (tiempo de traslado)
5. Agreguen contexto personal ("recomendado", "menos concurrida", etc.)

Devuelve JSON con lista ordenada y reasoning para cada una.
```

**Datos usados**:
- Google Places API (búsqueda + detalles)
- Google Maps Distance Matrix (tiempos de traslado)
- User profile data (historial de viajes previos, preferencias)

**Performance**: <5 segundos (incluye llamadas a Google APIs)

---

### 6.4 AI Agent 3: Optimizador de Logística

**Cuándo se llama**:
- Usuario toca "[Optimizar este día]"
- (Opcional) AI detecta conflictos automáticamente y sugiere fix

**Inputs**:
```
{
  day: 1,
  activities: [
    {name: "Musei Vaticani", start: "15:00", end: "18:00", location: {lat, lng}},
    {name: "Cena en Trastevere", start: "18:30", end: "20:00", location: {lat, lng}}
  ],
  free_time_blocks: [
    {start: "12:00", end: "15:00"}  // disponible para rellenar
  ]
}
```

**Output**:
```
{
  issues: [
    {
      type: "travel_time",
      description: "15 min de traslado entre museo y restaurante, pero solo hay 30 min de gap",
      severity: "warning"
    }
  ],
  suggestions: [
    {
      suggestion: "Mover restaurante a 18:45 para tener más margen",
      impact: "Resuelve conflicto de tiempo",
      action: "apply_change"
    },
    {
      suggestion: "Rellenar gap de 12:00–15:00 con actividad de 2–3h",
      options: [
        {name: "Galería Borghese", fit_score: 0.88},
        {name: "Paseo en Piazza Navona", fit_score: 0.75}
      ],
      action: "suggest_activities"
    }
  ],
  optimized_timeline: [
    {name: "Musei Vaticani", start: "15:00", end: "18:00"},
    {name: "Cena en Trastevere", start: "18:45", end: "20:30"}
  ]
}
```

**Prompt (conceptual)**:
```
Eres un experto en logística de viajes. Analiza este itinerario:

[Listar actividades por hora]

Detecta:
1. Conflictos (solapamiento de horarios)
2. Traslados imposibles (distancia > tiempo disponible)
3. Gaps sin aprovechar (>2h libres)

Para cada problema, propón soluciones sin aplicarlas, y déja que el usuario decida.

Devuelve JSON con issues, suggestions, y timeline optimizado (si se aceptan cambios).
```

**Datos usados**:
- Google Maps Directions API (tiempos de traslado reales)
- Place Details (horarios de operación)
- Actividades existentes en el día

**Performance**: <3 segundos

---

## 7. Especificación de Pantallas

### 7.1 Flujo de Pantallas

```
1. Splash / Onboarding
   ↓
2. Crear Viaje ("Empecemos")
   ↓
   [Generar borrador] ←→ [Empezar vacío]
   ↓ ↓
   3. Canvas Principal (el core)
   ↓
   [Exportar] [Compartir] [Finalizar]
```

### 7.2 Pantalla: Crear Viaje

**Layout**:
- Encabezado: "Empecemos tu viaje"
- Contenido principal con campos:
  1. Destino (searchable, Google Places)
  2. Fechas (date range)
  3. Quién viaja (chips: Solo, Pareja, Familia, Amigos)
  4. Estilo (chips: Relax, Balanceado, Aventura)
  5. Presupuesto (slider: Budget, Mid, Premium)
- Dos botones:
  - "Generar borrador (AI)" (primario)
  - "Empezar vacío" (secundario)

**Validación**:
- Destino: obligatorio
- Fechas: obligatorio, fecha_fin > fecha_inicio
- Quién viaja: obligatorio
- Otros: opcionales (pero recomendados)

---

### 7.3 Pantalla: Canvas Principal

(Ya especificada en sección 4)

---

### 7.4 Pantalla: Detalles de Actividad (Modal/Drawer)

Cuando usuario hace clic en una actividad:

```
┌─────────────────────────────────────┐
│ 🏛️ Musei Vaticani                   │
│ Día 1 • 15:00–18:00                 │
├─────────────────────────────────────┤
│                                     │
│ Contacto:                           │
│ 📍 Viale Vaticano, Roma             │
│ ☎️ +39 06 6988 4676                 │
│ 🌐 musei.vatican.va                 │
│                                     │
│ Horario de Apertura:                │
│ Abierto: 09:00–18:00 (Lu–Do)        │
│ Cerrado: algunos lunes              │
│                                     │
│ Información:                        │
│ ⭐ 4.8 (12.5K reviews)              │
│ 💰 €20 por persona                  │
│ ⏱️ Duración típica: 3h              │
│ 📏 Distancia desde hotel: 1.2 km    │
│                                     │
│ [Leer 100 reviews más]              │
│ [Ver 50+ fotos]                     │
│                                     │
│ ─────────────────────────────────── │
│ Opciones:                           │
│ [✓ Confirmar reserva]               │
│ [🗺️ Abrir en Google Maps]           │
│ [🔗 Ir a sitio web]                 │
│ [✏️ Editar hora] [✕ Eliminar]      │
│ [💬 Agregar nota personal]          │
│                                     │
└─────────────────────────────────────┘
```

---

### 7.5 Pantalla: Exportar Itinerario

Opciones:
- PDF detallado
- Mapa interactivo (HTML con Google Maps)
- CSV (para sincronizar)
- Link compartible (future)

---

## 8. Flujos de Datos Técnicos

### 8.1 Arquitectura General

```
FRONTEND (Next.js)
├─ Pages
│  ├─ /onboarding (crear viaje)
│  ├─ /canvas/[trip_id] (canvas principal)
│  └─ /export/[trip_id] (exportar)
├─ Components
│  ├─ Sidebar (navegación)
│  ├─ Timeline (panel central)
│  └─ ContextPanel (panel derecho)
└─ Services
   ├─ Google Places API wrapper
   ├─ AI Agent clients (Claude, OpenAI, etc.)
   └─ State management (Redux, Zustand, etc.)

BACKEND (Node.js / Symfony / tu choice)
├─ /api/trips
│  ├─ POST /trips (crear)
│  ├─ GET /trips/:id (obtener)
│  └─ PUT /trips/:id (actualizar)
├─ /api/search
│  ├─ POST /search/places (Google Places)
│  └─ POST /search/ai-recommendations (AI Agent 2)
├─ /api/ai-agents
│  ├─ POST /agents/architect (AI Agent 1)
│  ├─ POST /agents/curator (AI Agent 2)
│  └─ POST /agents/optimizer (AI Agent 3)
└─ Database
   ├─ trips table
   ├─ activities table
   ├─ user_profiles table
   └─ saved_places table (historial)

EXTERNAL SERVICES
├─ Google Places API
├─ Google Maps API (Distance, Directions)
├─ Claude API (o OpenAI, Anthropic, etc.)
└─ (Future) Viator, GetYourGuide APIs
```

### 8.2 Flujo: Crear Viaje y Generar Borrador

```
USUARIO
  ├─ Rellena: destino, fechas, quién viaja, estilo, presupuesto
  └─ Toca: "Generar borrador"
       ↓
FRONTEND
  ├─ Valida inputs
  └─ POST /api/trips con datos
       ↓
BACKEND
  ├─ Crea record en DB (trips table)
  └─ POST /api/ai-agents/architect con inputs
       ↓
CLAUDE API (AI Agent 1: Arquitecto)
  ├─ Procesa: destino + duración + estilo + intereses
  └─ Devuelve: estructura de días, títulos, time blocks
       ↓
BACKEND
  ├─ Recibe respuesta de Claude
  ├─ Crea records en activities table (vuelo placeholder, hotel, etc.)
  └─ Retorna trip_id + borrador a frontend
       ↓
FRONTEND
  ├─ Recibe trip_id
  └─ Redirige a /canvas/[trip_id]
       ↓
USUARIO ve: Canvas con días, estructure inicial, algunas sugerencias
```

### 8.3 Flujo: Usuario Busca Actividades (Google Places)

```
USUARIO (en Canvas)
  ├─ Hace clic en bloque vacío
  └─ Escribe en caja de búsqueda: "museos"
       ↓
FRONTEND (en tiempo real, debounced)
  └─ POST /api/search/places con {query: "museos", location, radius}
       ↓
BACKEND
  └─ Llama Google Places API:
     places.searchNearby({
       query: "museos",
       location: [lat, lng],
       radius: 5000,
       key: GOOGLE_PLACES_API_KEY
     })
       ↓
GOOGLE PLACES
  └─ Devuelve: ~8–20 resultados
       ↓
BACKEND
  ├─ Enriquece con place details (horarios, fotos, etc.)
  ├─ Calcula distancias (Google Distance Matrix)
  └─ Retorna resultados a frontend
       ↓
FRONTEND
  ├─ Recibe resultados
  └─ Muestra en panel derecho (lista o mapa)
       ↓
USUARIO
  ├─ Ve opciones con fotos, rating, horario
  └─ Hace clic: "[➕ Agregar al día]"
       ↓
FRONTEND
  ├─ Crea evento en timeline con todos los datos de Google Places
  └─ PUT /api/trips/:id/activities (guardar en DB)
       ↓
USUARIO ve: Actividad agregada al timeline, con todos los detalles rellenados
```

### 8.4 Flujo: Pedir Ideas a la AI

```
USUARIO (en Canvas)
  ├─ Hace clic en "[Pedir ideas a la AI]"
  └─ (Opcionalmente, selecciona filtros: precio, duración, tipo)
       ↓
FRONTEND
  └─ POST /api/ai-agents/curator con {block, user_profile, filters}
       ↓
BACKEND (AI Agent 2: Curador)
  ├─ Analiza: duración disponible, ubicación, intereses del usuario
  ├─ Llama Google Places API (múltiples búsquedas):
  │  ├─ search("museums", location, radius)
  │  ├─ search("restaurants", location, radius)
  │  └─ search("outdoor activities", location, radius)
  ├─ Recibe resultados de Google
  └─ POST /api/ai/Claude con prompt:
     "Eres curador de viajes. El usuario tiene 4h libres. Intereses: [X].
      Aquí hay [N] actividades potenciales de Google Places.
      Ordénalas por relevancia (score 0–1) y agrega contexto personal."
       ↓
CLAUDE (AI Agent 2)
  └─ Devuelve: [
       {place_id: "...", rank: 1, reason: "...", fit_score: 0.95},
       {place_id: "...", rank: 2, reason: "...", fit_score: 0.88},
       ...
     ]
       ↓
BACKEND
  ├─ Enriquece con datos finales de Google Places
  └─ Retorna recomendaciones a frontend
       ↓
FRONTEND
  ├─ Recibe recomendaciones
  └─ Muestra en panel derecho con badges "AI", orden de relevancia, reasoning
       ↓
USUARIO
  ├─ Ve 3–5 opciones curadas
  └─ Hace clic: "[➕ Agregar]" (igual flujo que búsqueda directa)
```

### 8.5 Flujo: Optimizar un Día

```
USUARIO (en Canvas)
  └─ Hace clic: "[Optimizar este día]"
       ↓
FRONTEND
  └─ POST /api/ai-agents/optimizer con {day, activities, free_blocks}
       ↓
BACKEND (AI Agent 3: Optimizador)
  ├─ Recibe: actividades del día, time blocks disponibles
  ├─ Llama Google Maps Distance Matrix:
  │  (para calcular tiempos de traslado reales)
  ├─ Analiza conflictos, gaps, logística
  └─ POST /api/ai/Claude con prompt:
     "Analiza este itinerario de día.
      Actividades: [X]. Distancias: [Y]. Horarios: [Z].
      ¿Hay conflictos? ¿Puedo rellenar gaps? Propón cambios."
       ↓
CLAUDE (AI Agent 3)
  └─ Devuelve: {issues: [...], suggestions: [...], optimized_timeline: [...]}
       ↓
BACKEND
  └─ Retorna sugerencias a frontend
       ↓
FRONTEND
  ├─ Muestra modal/drawer con:
  │  ├─ Issues detectados (warnings)
  │  └─ Sugerencias (con botones: [Aplicar] [Ignorar])
  └─ Usuario revisa y acepta/rechaza cada sugerencia
       ↓
USUARIO
  ├─ Toca "[Aplicar]" en sugerencias que le gusten
  └─ Frontend actualiza timeline
       ↓
BACKEND
  └─ Recibe cambios aceptados y actualiza DB
```

---

## 9. Stack Tecnológico

  TO BE DOCUMENTED

---

## 10. Roadmap de Implementación

### Fase 1: MVP (Semanas 1–6)

**Objetivo**: Canvas funcional con Google Places + AI básico

**Deliverables**:
- [x] Pantalla: Crear viaje
- [x] Canvas principal (three-column layout)
- [x] Integración Google Places (búsqueda, resultados)
- [x] AI Agent 1: Arquitecto (generar estructura)
- [x] AI Agent 2: Curador (sugerencias básicas)
- [x] Drag-and-drop de actividades
- [x] Exportar a PDF simple
- [x] Modo Asistido / Manual (toggle)

**No incluye**:
- Compartir con grupo
- Colaboración real-time
- Integración Viator/GetYourGuide
- Mobile optimizado
- Historial de viajes

---

### Fase 2: Pulido & Performance (Semanas 7–8)

**Objetivo**: Experiencia fluida, fast, responsive

**Deliverables**:
- [x] Loading states optimizados (<2s respuestas)
- [x] Caching de Google Places (Redis)
- [x] Mobile responsive (sidebar collapse, drawer)
- [x] Optimización de images
- [x] Error handling graceful
- [x] Tests (unit + integration)

---

### Fase 3: Features Avanzadas (Semanas 9–12)

**Objetivo**: Más poder, más automatización

**Deliverables**:
- [x] AI Agent 3: Optimizador (conflictos, gaps)
- [x] Guarda de lugares (para reutilizar en viajes)
- [x] Historial de viajes previos
- [x] Sugerencias automáticas mientras edita (async)
- [x] Exportar a múltiples formatos (PDF, iCal, CSV)
- [x] Share link (read-only) de itinerario

---

### Fase 4: Integración Tours Providers (Semanas 13–16)

**Objetivo**: Tours guiados dentro del canvas

**Deliverables**:
- [x] Integración Viator Partner API
- [x] Integración GetYourGuide Partner API
- [x] Búsqueda "Tours guiados" en panel derecho
- [x] Mostrar ambas fuentes (Google Places + Providers)
- [x] Booking directo (si es partner)

---

### Fase 5: Colaboración (Semanas 17–20)

**Objetivo**: Itinerarios compartidos en tiempo real

**Deliverables**:
- [x] Generar share link
- [x] Invitar colaboradores (email)
- [x] Edición real-time (WebSockets)
- [x] Versioning de cambios (history)
- [x] Comentarios en actividades

---

### Fase 6: Mobile App (Post-MVP)

**Objetivo**: PWA + Native apps (React Native o Flutter)

**Deliverables**:
- [x] PWA con cache offline
- [x] Push notifications
- [x] Geolocation features ("¿Dónde estoy ahora?")
- [x] QR codes para share
- [x] Native app (iOS/Android)

---

## Resumen Ejecutivo

### Lo que hace Travelr diferente

1. **Canvas, no wizard**: El usuario ve todo su viaje de una vez, en un espacio de trabajo continuo.
2. **Google Places como motor**: Cero entrada manual de datos para actividades públicas.
3. **AI especializada**: Tres agents diferentes (Arquitecto, Curador, Optimizador) hacen una cosa bien cada uno.
4. **Control total**: Usuario avanzado puede apagar AI y construir manualmente.
5. **Performance first**: Respuestas <2–5 segundos, nunca bloquea el usuario.
6. **UX obsesionada**: Si entrar datos es tedioso, la app fracasa. Todo es visual, click, drag.

### Valores de diseño

- **Fricción = muerte**: Cada paso debe ser necesario.
- **Datos de verdad**: Google Places, no invenciones.
- **Velocidad**: Borrador rápido > perfecto lento.
- **Reversible**: Todo se puede cambiar/deshacer.
- **Transparente**: Usuario ve por qué la AI sugiere algo.

---

**Documento completado**: Diciembre 2025  
**Siguiente paso**: Empezar Fase 1 (Pantalla crear viaje + Canvas básico)
