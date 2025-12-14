// Progressive generation prompts - optimized for faster initial response
// These prompts split the plan generation into smaller, faster steps

export const SYSTEM_PROMPT_PROGRESSIVE = `Eres un experto planificador de viajes. Creas itinerarios detallados y realistas.

Reglas:
1. Siempre responde en español
2. Sé específico con nombres, tiempos y costos
3. Considera tiempos de traslado
4. No sobrecargues los días
5. Responde SOLO con JSON válido (sin markdown)
`

/**
 * Step 1: Generate plan summary and structure
 * This is a lighter prompt that generates the overview quickly (~10-15s)
 * Output: summary, dayTitles, accommodation
 */
export const GENERATE_PLAN_SUMMARY_PROMPT = `Genera el RESUMEN de un plan de viaje (sin itinerario detallado).

VIAJE:
- Destino: {destination}
- Origen: {origin}
- Fechas: {startDate} al {endDate}
- Viajeros: {travelers}
- Prioridad: {priority}
- Intereses: {interests}

{styleRules}

{paceRules}

{accommodationRules}

Genera JSON con esta estructura:

{
  "summary": {
    "title": "Título atractivo del viaje",
    "description": "Descripción de 2-3 oraciones",
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
    "totalDriving": {
      "distance": "~X km",
      "time": "~X horas total"
    }
  },
  "dayTitles": [
    "Día 1: Llegada a...",
    "Día 2: Exploración de...",
    "Día 3: ..."
  ],
  "accommodation": {
    "suggestions": [
      {
        "id": "acc-1",
        "name": "Nombre del hospedaje",
        "type": "hotel",
        "area": "Zona",
        "location": {
          "lat": 10.4674,
          "lng": -84.6427
        },
        "pricePerNight": 80,
        "why": "Razón",
        "nights": 3,
        "checkIn": "YYYY-MM-DD",
        "checkOut": "YYYY-MM-DD",
        "amenities": ["WiFi", "Pool"]
      }
    ],
    "totalCost": 240
  }
}

IMPORTANTE:
- dayTitles debe tener exactamente {totalDays} elementos
- Cada título debe ser descriptivo: "Día X: [Actividad principal]"
- Responde SOLO con JSON válido`

/**
 * Step 2: Generate a single day's full details
 * Called once per day, can show progress as each day completes (~8-12s per day)
 */
export const GENERATE_SINGLE_DAY_PROMPT = `Genera el itinerario detallado para UN solo día.

VIAJE:
- Destino: {destination}
- Prioridad: {priority}
- Intereses: {interests}
- Viajeros: {travelers}

{styleRules}

{paceRules}

DÍA A GENERAR:
- Número: {dayNumber}
- Fecha: {date}
- Título: {dayTitle}
- Día anterior: {previousDaySummary}
- Día siguiente: {nextDayTitle}

Genera JSON con esta estructura:

{
  "day": {dayNumber},
  "date": "{date}",
  "title": "{dayTitle}",
  "subtitle": "Descripción más detallada del día",
  "timeline": [
    {
      "id": "tl-{dayNumber}-1",
      "time": "6:00 AM",
      "activity": "Actividad breve",
      "location": "Lugar específico (ciudad/zona)",
      "icon": "🌅",
      "notes": "Nota opcional",
      "travelToNext": {
        "distance": "X km/mi",
        "duration": "X min",
        "method": "driving"
      }
    }
  ],
  "meals": {
    "breakfast": {"suggestion": "Lugar", "priceRange": "$8-12/pp"},
    "lunch": {"suggestion": "Lugar", "priceRange": "$15-25/pp"},
    "dinner": {"suggestion": "Lugar", "priceRange": "$20-35/pp"}
  },
  "importantNotes": [
    {"id": "note-{dayNumber}-1", "category": "time", "text": "Nota importante", "isHighPriority": true},
    {"id": "note-{dayNumber}-2", "category": "tip", "text": "Tip útil"}
  ],
  "transport": "Descripción del transporte",
  "overnight": "Hotel/zona para dormir"
}

CATEGORÍAS para importantNotes: time, transport, weather, activity, food, lodging, budget, gear, warning, tip

ICONOS para timeline: 🌅 Amanecer, 🚗 Transporte, 🏨 Hotel, 🍳 Desayuno, ☕ Café, 🌋 Actividad, 🏊 Agua/playa, 🍽️ Comida, 📸 Fotos, 🛒 Compras, 🌙 Noche, ✈️ Vuelo, 🎒 Caminata

IMPORTANTE:
- El timeline debe tener 6-10 entradas cubriendo todo el día
- Incluye 2-3 importantNotes con diferentes categorías
- Para travelToNext en timeline:
  * Incluye SOLO si la siguiente actividad requiere desplazamiento a otro lugar
  * Omite si la siguiente actividad es en el mismo lugar o cercana (menos de 5 min)
  * method puede ser: "driving", "walking", o "transit"
  * La última actividad del día NO debe tener travelToNext
- Responde SOLO con JSON válido`

/**
 * Step 2 (v2): Generate a single day WITH real Google Places context
 * The AI receives a JSON of real places to reference by ID
 */
export const GENERATE_SINGLE_DAY_WITH_PLACES_PROMPT = `Genera el itinerario detallado para UN solo día, usando LUGARES REALES del destino.

VIAJE:
- Destino: {destination}
- Prioridad: {priority}
- Intereses: {interests}
- Viajeros: {travelers}

{styleRules}

{paceRules}

DÍA A GENERAR:
- Número: {dayNumber}
- Fecha: {date}
- Título: {dayTitle}
- Día anterior: {previousDaySummary}
- Día siguiente: {nextDayTitle}

LUGARES REALES DISPONIBLES (USA ESTOS cuando sea posible):
{placesJson}

Genera JSON con esta estructura:

{
  "day": {dayNumber},
  "date": "{date}",
  "title": "{dayTitle}",
  "subtitle": "Descripción más detallada del día",
  "timeline": [
    {
      "id": "tl-{dayNumber}-1",
      "time": "6:00 AM",
      "activity": "Nombre del lugar REAL de la lista",
      "location": "Dirección del lugar",
      "icon": "🌅",
      "notes": "Nota opcional",
      "suggestedPlaceId": "ID_DEL_LUGAR_DE_LA_LISTA",
      "travelToNext": {
        "distance": "X km/mi",
        "duration": "X min",
        "method": "driving"
      }
    }
  ],
  "meals": {
    "breakfast": {"suggestion": "Nombre del restaurante de la lista", "priceRange": "$8-12/pp", "suggestedPlaceId": "ID_SI_APLICA"},
    "lunch": {"suggestion": "Nombre del restaurante", "priceRange": "$15-25/pp", "suggestedPlaceId": "ID_SI_APLICA"},
    "dinner": {"suggestion": "Nombre del restaurante", "priceRange": "$20-35/pp", "suggestedPlaceId": "ID_SI_APLICA"}
  },
  "importantNotes": [
    {"id": "note-{dayNumber}-1", "category": "time", "text": "Nota importante", "isHighPriority": true},
    {"id": "note-{dayNumber}-2", "category": "tip", "text": "Tip útil"}
  ],
  "transport": "Descripción del transporte",
  "overnight": "Hotel/zona para dormir"
}

REGLAS CRÍTICAS PARA LUGARES:
1. SIEMPRE usa lugares de la lista cuando sea posible
2. Prioriza lugares con rating >= 4.0
3. Si usas un lugar de la lista, COPIA su "id" EXACTAMENTE como "suggestedPlaceId"
   - Ejemplo CORRECTO: "suggestedPlaceId": "ChIJ8YWMWnZuLxMRRCmjWzs-aZA"
   - INCORRECTO: "suggestedPlaceId": "fontana-di-trevi" (ID inventado)
   - INCORRECTO: "suggestedPlaceId": "Fontana di Trevi" (usaste el nombre, no el ID)
4. Los IDs válidos de Google empiezan con "ChIJ" seguido de caracteres alfanuméricos
5. NUNCA inventes un ID - solo usa IDs que aparecen LITERALMENTE en la lista de lugares
6. Si no hay un lugar adecuado en la lista, NO incluyas suggestedPlaceId
7. Es MEJOR omitir suggestedPlaceId que incluir uno incorrecto o inventado

CATEGORÍAS de lugares:
- restaurants: para desayunos, almuerzos, cenas
- attractions: para lugares turísticos, puntos de interés
- cafes: para cafés y snacks
- bars: para vida nocturna
- museums: para museos y galerías
- nature: para parques, cascadas, reservas naturales
- landmarks: para plazas, monumentos, puntos de interés históricos
- beaches: para playas
- religious: para iglesias, catedrales, templos
- markets: para mercados y ferias

CATEGORÍAS para importantNotes: time, transport, weather, activity, food, lodging, budget, gear, warning, tip

ICONOS: 🌅 Amanecer, 🚗 Transporte, 🏨 Hotel, 🍳 Desayuno, ☕ Café, 🌋 Actividad, 🏊 Agua/playa, 🍽️ Comida, 📸 Fotos, 🛒 Compras, 🌙 Noche, ✈️ Vuelo, 🎒 Caminata

IMPORTANTE:
- El timeline debe tener 6-10 entradas cubriendo todo el día
- Incluye 2-3 importantNotes con diferentes categorías
- Para travelToNext en timeline:
  * Incluye SOLO si la siguiente actividad requiere desplazamiento
  * method puede ser: "driving", "walking", o "transit"
  * La última actividad NO debe tener travelToNext
- Responde SOLO con JSON válido`

// ============================================================================
// ACCOMMODATION RULES - Dynamic prompt generation based on user preferences
// ============================================================================

type AccommodationRulesFn = (travelers: number) => string

const ACCOMMODATION_RULES: Record<string, AccommodationRulesFn> = {
  hotel: () => `
INSTRUCCIONES DE HOSPEDAJE (Usuario prefiere HOTEL):
- Sugiere hoteles con servicio completo (recepción 24h, limpieza diaria)
- Prioriza ubicaciones céntricas o cerca de atracciones principales
- Para grupos grandes: busca hoteles con habitaciones conectadas o suites familiares
- Ajusta el rango de precio según el estilo de viaje (budget=$40-80, comfort=$80-150, luxury=$150+ por noche)
`,

  airbnb: () => `
INSTRUCCIONES DE HOSPEDAJE (Usuario prefiere AIRBNB):
- Sugiere apartamentos o casas completas en barrios residenciales
- Prioriza opciones que ofrezcan experiencia "vivir como local"
- Para grupos grandes: busca casas con múltiples habitaciones (más económico por persona)
- Destaca la disponibilidad de cocina completa (menciona el posible ahorro en comidas)
- Ideal para estancias de 3+ noches (cleaning fees se diluyen)
`,

  hostel: () => `
INSTRUCCIONES DE HOSPEDAJE (Usuario prefiere HOSTEL):
- Sugiere hostels con buen ambiente social y áreas comunes
- Prioriza ubicaciones céntricas o en zonas con vida nocturna
- Para grupos: recomienda habitaciones privadas grupales
- Destaca: cocina compartida, bar, tours grupales, oportunidad de conocer otros viajeros
- Rango de precio: $15-40 por noche (la opción más económica)
- Nota: Solo recomendado para viajeros que no requieren privacidad total
`,

  mixed: (travelers: number) => {
    const hostelRule = travelers <= 2
      ? `- Usa HOSTEL solo si el viajero busca experiencia social y conocer gente`
      : `- NO sugieras hostel (grupo de ${travelers} personas es muy grande para hostels)`

    return `
INSTRUCCIONES DE HOSPEDAJE (Usuario prefiere MIXTO - combina según convenga):
Combina tipos inteligentemente según el contexto del viaje:

- Usa HOTEL cuando:
  * Primera noche del viaje (check-in garantizado para llegadas tardías)
  * Última noche del viaje (check-out flexible para salidas tempranas)
  * Estancias de 1 sola noche en un lugar

- Usa AIRBNB cuando:
  * Estancias de 3+ noches en el mismo lugar (descuentos semanales)
  * Grupos grandes (más económico dividir una casa grande)
  * Zonas rurales donde hoteles son escasos o muy caros
  * El viajero quiere cocinar para ahorrar

${hostelRule}

IMPORTANTE: Justifica CADA elección de hospedaje en el campo "why"
`
  }
}

/**
 * Get accommodation rules based on user preference and number of travelers
 * This is used to dynamically generate the prompt with only the relevant rules
 */
export function getAccommodationRules(type: string, travelers: number): string {
  const ruleFn = ACCOMMODATION_RULES[type] || ACCOMMODATION_RULES.hotel
  return ruleFn(travelers)
}

// ============================================================================
// STYLE RULES - Dynamic prompt generation based on budget preference
// ============================================================================

const STYLE_RULES: Record<string, string> = {
  budget: `
INSTRUCCIONES DE PRESUPUESTO (Usuario prefiere ECONÓMICO):
- Prioriza actividades gratuitas o de bajo costo
- Restaurantes locales económicos ($5-15/persona)
- Transporte público en vez de taxis/uber cuando sea práctico
- Incluye tips de ahorro (comida callejera, días gratis en museos, happy hours)
- Menciona opciones gratuitas para atracciones si existen
- Hospedaje: ajusta expectativas al rango $40-80/noche
`,

  comfort: `
INSTRUCCIONES DE PRESUPUESTO (Usuario prefiere COMFORT):
- Balance entre precio y calidad
- Restaurantes mid-range ($15-40/persona)
- Mezcla de transporte público y privado según convenga
- Actividades populares con buen valor
- No es necesario buscar la opción más barata, pero tampoco la más cara
- Hospedaje: rango $80-150/noche
`,

  luxury: `
INSTRUCCIONES DE PRESUPUESTO (Usuario prefiere PREMIUM):
- Restaurantes de alta gama ($50+/persona)
- Transporte privado (transfers, auto rentado premium, taxis)
- Actividades exclusivas (tours privados, experiencias VIP)
- Servicios premium (spa, sommelier, chef privado si aplica)
- Prioriza calidad y exclusividad sobre precio
- Hospedaje: $150+/noche, hoteles boutique o 5 estrellas
`,
}

/**
 * Get style/budget rules based on user preference
 */
export function getStyleRules(style: string): string {
  return STYLE_RULES[style] || STYLE_RULES.comfort
}

// ============================================================================
// PACE RULES - Dynamic prompt generation based on travel rhythm preference
// ============================================================================

const PACE_RULES: Record<string, string> = {
  relaxed: `
INSTRUCCIONES DE RITMO (Usuario prefiere RELAJADO):
- Máximo 2-3 actividades principales por día
- Incluye tiempo libre explícito en el timeline ("Tarde libre para explorar")
- Horarios de inicio tardíos (no antes de 9am, idealmente 10am)
- Evita días con múltiples traslados largos
- Sugiere actividades opcionales ("Si te sobra tiempo...")
- Prioriza experiencias tranquilas: cafés, paseos, vistas panorámicas
`,

  moderate: `
INSTRUCCIONES DE RITMO (Usuario prefiere MODERADO):
- 4-5 actividades por día con descansos entre ellas
- Balance entre tiempo estructurado y tiempo libre
- Horarios razonables (inicio ~8-9am, fin ~8pm)
- Puede incluir un día más intenso si hay algo imperdible
- Incluye pausas para café/descanso en el timeline
`,

  active: `
INSTRUCCIONES DE RITMO (Usuario prefiere ACTIVO):
- 6-8 actividades por día, aprovechando cada momento
- Madrugones permitidos para aprovechar amaneceres o evitar multitudes
- Días completos de actividades con poco tiempo muerto
- Incluye opciones para llenar cualquier hueco de tiempo
- Prioriza ver/hacer lo máximo posible en el destino
- Puede sugerir actividades nocturnas si el destino lo permite
`,
}

/**
 * Get pace/rhythm rules based on user preference
 */
export function getPaceRules(pace: string): string {
  return PACE_RULES[pace] || PACE_RULES.moderate
}

// Re-export fillPrompt for convenience
export { fillPrompt } from './prompts'
