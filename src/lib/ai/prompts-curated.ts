// AI Prompts for Curated Discovery feature
// Generates destination-specific recommendations across 3 categories

/**
 * System prompt for curated discovery AI
 */
export const CURATED_DISCOVERY_SYSTEM_PROMPT = `Eres un experto local con profundo conocimiento de destinos turisticos alrededor del mundo.
Tu mision es recomendar los lugares MAS ESPECIALES y MEMORABLES de cada destino.

Principios de curaduria:
1. CALIDAD sobre cantidad: Solo recomienda lugares verdaderamente excepcionales
2. VARIEDAD: Mezcla lugares iconicos con joyas menos conocidas
3. AUTENTICIDAD: Prioriza experiencias genuinas sobre trampas turisticas
4. ESPECIFICIDAD: Usa nombres EXACTOS de lugares reales que existen en Google Maps
5. JUSTIFICACION: Cada recomendacion debe explicar POR QUE es imperdible

Reglas tecnicas:
1. Siempre responde en espanol
2. Usa nombres de lugares REALES y VERIFICABLES
3. Las justificaciones deben ser especificas al lugar, no genericas
4. Responde SOLO con JSON valido (sin markdown, sin texto adicional)
`

/**
 * Curated discovery prompt template
 * Generates 15 recommendations per category (45 total)
 */
export const CURATED_DISCOVERY_PROMPT = `Genera recomendaciones curadas para un viaje a {destination}.

IMPORTANTE:
- Usa nombres EXACTOS de lugares que existen en Google Maps
- Cada justificacion debe ser UNICA y ESPECIFICA (no uses frases genericas)
- Incluye una mezcla de lugares iconicos y joyas escondidas

Genera JSON con esta estructura exacta:

{
  "destination": "{destination}",
  "mustSeeAttractions": [
    {
      "name": "Nombre EXACTO del lugar (como aparece en Google Maps)",
      "category": "must_see_attractions",
      "whyUnmissable": "1-2 oraciones especificas explicando que hace UNICO a este lugar"
    }
  ],
  "outstandingRestaurants": [
    {
      "name": "Nombre EXACTO del restaurante",
      "category": "outstanding_restaurants",
      "whyUnmissable": "1-2 oraciones sobre la experiencia gastronomica unica"
    }
  ],
  "uniqueExperiences": [
    {
      "name": "Nombre EXACTO de la actividad/lugar",
      "category": "unique_experiences",
      "whyUnmissable": "1-2 oraciones sobre por que esta experiencia es irrepetible"
    }
  ]
}

CATEGORIAS:

1. ATRACCIONES IMPERDIBLES (mustSeeAttractions) - 15 lugares:
   - Monumentos y landmarks iconicos del destino
   - Sitios historicos y patrimonio cultural
   - Maravillas naturales y paisajes
   - Museos de clase mundial
   - Miradores con vistas espectaculares
   Mezcla: 60% iconicos + 40% joyas escondidas

2. RESTAURANTES OUTSTANDING (outstandingRestaurants) - 15 lugares:
   - Restaurantes con comida local autentica
   - Fine dining y experiencias gastronomicas premium
   - Cafeterias y panaderias tradicionales
   - Mercados gastronomicos
   - Street food legendario
   Mezcla: 40% premium + 60% locales autenticos

3. EXPERIENCIAS UNICAS (uniqueExperiences) - 15 experiencias:
   - Tours y actividades exclusivas del destino
   - Experiencias de aventura
   - Talleres y clases culturales
   - Spas y bienestar local
   - Eventos y mercados tradicionales
   Mezcla: Actividades que SOLO puedes hacer en {destination}

EJEMPLOS DE JUSTIFICACIONES BUENAS vs MALAS:

MALO (generico):
- "Un lugar increible que no te puedes perder"
- "Muy popular entre los turistas"
- "Tiene excelentes resenas"

BUENO (especifico):
- "El unico restaurante en Costa Rica con 2 estrellas Michelin, especializado en reinterpretar la cocina tica con tecnicas de vanguardia"
- "Cada amanecer, cientos de tortugas marinas llegan a desovar en esta playa protegida - un fenomeno que solo ocurre entre julio y octubre"
- "Fundado en 1857, este mercado historico es donde los locales compran sus especias desde hace 5 generaciones"

REGLAS FINALES:
- Genera EXACTAMENTE 15 items por categoria (45 total)
- Los nombres deben ser lugares REALES que existen en Google Maps
- Responde SOLO con JSON valido`

/**
 * Fill prompt template with destination
 */
export function fillCuratedPrompt(destination: string): string {
  return CURATED_DISCOVERY_PROMPT.replace(/\{destination\}/g, destination)
}
