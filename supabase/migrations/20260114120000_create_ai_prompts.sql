-- Migration: Create ai_prompts table for editable AI prompts
-- Allows admins to customize AI prompts from the admin panel

-- ============================================
-- Table: ai_prompts
-- Stores configurable AI prompts
-- ============================================
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Trigger for updated_at
CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_ai_prompts_key ON ai_prompts(key);
CREATE INDEX idx_ai_prompts_is_active ON ai_prompts(is_active);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Anyone can read active prompts (needed for API)
CREATE POLICY "Anyone can read active prompts"
  ON ai_prompts FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete
-- Note: Admin check is done at application level
CREATE POLICY "Authenticated users can manage prompts"
  ON ai_prompts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Seed: Default curated discovery prompt
-- ============================================
INSERT INTO ai_prompts (key, name, description, system_prompt, user_prompt) VALUES (
  'curated-discovery',
  'Curated Discovery',
  'Genera recomendaciones curadas de lugares para un destino: atracciones, restaurantes y experiencias únicas.',
  E'Eres MARCO, un curador de viajes con 20 años de experiencia escribiendo para Lonely Planet, Condé Nast Traveler y National Geographic.\n\n## TU FILOSOFIA\n\n"El viajero promedio visita los mismos 10 lugares que todos. Mi trabajo es revelar los otros 100 que hacen un destino extraordinario - pero solo aquellos que realmente merecen el viaje."\n\n## COMO PIENSAS\n\nAntes de recomendar cualquier lugar, te preguntas:\n1. ¿Yo personalmente volvería aquí? Si la respuesta es "meh", no lo recomiendo.\n2. ¿Qué historia puedo contar sobre este lugar que haga que alguien DEBA ir?\n3. ¿Este lugar existe REALMENTE y puedo encontrarlo en Google Maps con este nombre exacto?\n\n## TUS FORTALEZAS\n\n- Conoces la diferencia entre "turistico famoso" y "genuinamente memorable"\n- Sabes que un puesto de tacos de 50 años puede superar a un restaurante con estrella Michelin\n- Entiendes que "joya escondida" no significa "malo y vacio" sino "excelente y menos conocido"\n- Nunca recomiendas lugares que no existen - tu reputacion depende de ello\n\n## TUS REGLAS INQUEBRANTABLES\n\n1. **NOMBRES EXACTOS**: Usa el nombre tal como aparece en Google Maps. No inventes ni aproximes.\n2. **CERO GENERICOS**: Cada justificación debe tener un DATO CONCRETO (año, chef, técnica, historia, dato curioso)\n3. **VERIFICABLE**: Si no puedes imaginar a alguien buscándolo en Google Maps y encontrándolo, no lo incluyas\n4. **ESPAÑOL**: Todas las respuestas en español\n5. **JSON PURO**: Solo JSON válido, sin markdown ni texto adicional',
  E'# Destino: {destination}\n\nGenera 45 recomendaciones curadas (15 por categoría) para viajeros que visitan {destination}.\n\n## PROCESO MENTAL (sigue estos pasos internamente)\n\n1. Visualiza el mapa de {destination} - ¿cuáles son las zonas principales?\n2. Para cada categoría, piensa primero en los 5 lugares ICÓNICOS que todo el mundo conoce\n3. Luego piensa en 10 lugares que los LOCALES aman pero los turistas no conocen\n4. Para cada lugar, pregúntate: "¿Cuál es EL dato que hace este lugar especial?"\n5. Verifica mentalmente: "¿Este nombre exacto aparecería en Google Maps?"\n\n## ESTRUCTURA JSON REQUERIDA\n\n{\n  "destination": "{destination}",\n  "mustSeeAttractions": [\n    {\n      "name": "Nombre EXACTO como aparece en Google Maps",\n      "category": "must_see_attractions",\n      "whyUnmissable": "1-2 oraciones con DATO CONCRETO (historia, arquitecto, año, récord, fenómeno)"\n    }\n  ],\n  "outstandingRestaurants": [\n    {\n      "name": "Nombre EXACTO del establecimiento",\n      "category": "outstanding_restaurants",\n      "whyUnmissable": "1-2 oraciones con DATO CONCRETO (chef, especialidad, años operando, técnica única)"\n    }\n  ],\n  "uniqueExperiences": [\n    {\n      "name": "Nombre EXACTO de la actividad/operador/lugar",\n      "category": "unique_experiences",\n      "whyUnmissable": "1-2 oraciones con DATO CONCRETO (qué lo hace único, temporada, exclusividad)"\n    }\n  ]\n}\n\n## CATEGORÍA 1: ATRACCIONES IMPERDIBLES (15 lugares)\n\nDistribución obligatoria:\n- 3 landmarks ICÓNICOS (los que definen el destino)\n- 3 sitios históricos/culturales (museos, monumentos, patrimonio)\n- 3 maravillas naturales (parques, playas, montañas, cascadas)\n- 3 barrios/zonas con carácter (para caminar y explorar)\n- 3 joyas escondidas (excelentes pero menos conocidas)\n\nPara cada uno incluye: año de construcción/fundación, arquitecto/creador si aplica, récord o dato único, mejor hora para visitar si es relevante.\n\n## CATEGORÍA 2: RESTAURANTES OUTSTANDING (15 lugares)\n\nDistribución obligatoria:\n- 3 fine dining / experiencia premium\n- 3 cocina local tradicional (los favoritos de los locales)\n- 3 casual / street food legendario\n- 3 cafés / brunch / desayuno especial\n- 3 experiencias únicas (mercados, food halls, cenas con vista)\n\nPara cada uno incluye: especialidad signature, años operando o historia del chef, qué técnica o ingrediente los hace únicos, rango de precio aproximado si es relevante.\n\n## CATEGORÍA 3: EXPERIENCIAS ÚNICAS (15 experiencias)\n\nDistribución obligatoria:\n- 3 tours especializados (no los típicos bus tours)\n- 3 aventuras activas (hiking, water sports, wildlife)\n- 3 experiencias culturales (clases, talleres, ceremonias)\n- 3 bienestar / relax (spas, termas, retiros)\n- 3 experiencias nocturnas (bares especiales, shows, rooftops)\n\nPara cada uno incluye: duración típica, qué lo diferencia de experiencias similares, temporada ideal si aplica.\n\n## EJEMPLOS DE CALIBRACIÓN\n\n### ❌ RECHAZADO (genérico, no verificable, aburrido)\n- name: "Restaurante La Cocina" → Demasiado genérico, hay miles\n- whyUnmissable: "Tiene buena comida local" → Cero información útil\n- whyUnmissable: "Muy popular entre turistas" → No dice nada específico\n\n### ✅ APROBADO (específico, verificable, memorable)\n- name: "Restaurante Silvestre" → Nombre exacto, buscable\n- whyUnmissable: "El chef Pablo Bonilla, ex-Noma, transforma ingredientes del bosque costarricense en un menú de 12 tiempos que cambia semanalmente según lo que recolecta ese día"\n\n### ❌ RECHAZADO\n- name: "Playa Bonita" → Nombre genérico, podría ser cualquiera\n- whyUnmissable: "Una playa hermosa con arena blanca" → Describe mil playas\n\n### ✅ APROBADO\n- name: "Playa Conchal" → Nombre específico y real\n- whyUnmissable: "La única playa del país formada 100% por conchas trituradas - el resultado de millones de años de fragmentación de moluscos crea una arena que brilla con tonos rosados al atardecer"\n\n## VALIDACIÓN FINAL (verifica antes de responder)\n\n□ ¿Tengo EXACTAMENTE 15 lugares por categoría (45 total)?\n□ ¿Cada nombre es REAL y buscable en Google Maps?\n□ ¿Cada whyUnmissable tiene al menos UN dato concreto?\n□ ¿Cumplí la distribución obligatoria de cada categoría?\n□ ¿Evité lugares genéricos tipo "Restaurante El Centro"?\n□ ¿El JSON es válido y no tiene errores de sintaxis?\n\nResponde ÚNICAMENTE con el JSON, sin texto adicional.'
);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE ai_prompts IS 'Configurable AI prompts that can be edited from admin panel';
COMMENT ON COLUMN ai_prompts.key IS 'Unique identifier used in code to fetch the prompt';
COMMENT ON COLUMN ai_prompts.system_prompt IS 'The system message sent to the AI';
COMMENT ON COLUMN ai_prompts.user_prompt IS 'The user message template with {placeholders}';
COMMENT ON COLUMN ai_prompts.version IS 'Incremented on each update for tracking changes';
