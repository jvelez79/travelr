> **PARCIALMENTE RESUELTO**: Este documento identifica problemas estructurales. Algunos han sido abordados (categorías expandidas a 12+), otros siguen pendientes (radio dinámico, límite de lugares).

# Problemas Estructurales del Sistema de Linkeo a Google Places

Este documento identifica problemas en la arquitectura actual del sistema de linkeo de actividades a Google Places, detectados durante la investigación del issue donde actividades como "Piazza del Campo" no se vincularon correctamente.

## Contexto: Cómo Funciona el Linkeo Actual

### Flujo de Linkeo

```
1. Pre-fetch de lugares (/api/ai/prefetch-places)
   └── Obtiene coordenadas del destino via autocomplete
   └── Busca lugares en 12+ categorías con radio de 20km
   └── Limita lugares por categoría para el AI

2. Generación del día (/api/ai/generate-day-stream)
   └── Recibe placesContext con los lugares simplificados
   └── AI debe devolver suggestedPlaceId para cada actividad

3. Enrichment (/api/ai/enrich-itinerary)
   └── Busca suggestedPlaceId en los lugares pre-fetched
   └── Si encuentra match → linkea con placeData
   └── Si no encuentra → matchConfidence: 'none'
```

### Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/api/ai/prefetch-places/route.ts` | Pre-fetch de lugares por categoría |
| `src/app/api/ai/generate-day-stream/route.ts` | Generación de itinerario con AI |
| `src/app/api/ai/enrich-itinerary/route.ts` | Matching de suggestedPlaceId |
| `src/lib/explore/google-places.ts` | Funciones de búsqueda en Google Places API |

---

## Problema 1: Radio de Búsqueda Fijo de 20km ❌ PENDIENTE

### Descripción

El sistema usa un radio fijo de 20km centrado en el punto que devuelve el autocomplete del destino. Esto funciona bien para ciudades específicas, pero falla para destinos amplios.

### Ejemplo del Problema

```
Destino ingresado: "Italia"
↓
Autocomplete resuelve a: Roma (o punto central de Italia)
↓
Radio de búsqueda: 20km desde ese punto
↓
Resultado: Siena, Florencia, Venecia quedan FUERA del radio
↓
"Piazza del Campo" (Siena) NO está en los lugares pre-fetched
```

### Posibles Soluciones

1. **Detectar tipo de destino**: Si es país o región, usar radio mayor o múltiples puntos
2. **Radio dinámico**: Calcular radio basado en el tamaño del área administrativa
3. **Multi-fetch**: Para destinos amplios, hacer pre-fetch desde múltiples ciudades principales
4. **Pre-fetch por día**: Cuando el itinerario incluye múltiples ciudades, hacer pre-fetch específico por ciudad visitada

---

## Problema 2: Categorías Limitadas ✅ RESUELTO

### Estado Anterior (6 categorías)

```typescript
const CATEGORIES: PlaceCategory[] = [
  "restaurants",
  "attractions",
  "cafes",
  "bars",
  "museums",
  "nature",
]
```

### Estado Actual (12+ categorías)

```typescript
type PlaceCategory =
  | 'attractions'
  | 'nature'
  | 'restaurants'
  | 'cafes'
  | 'bars'
  | 'museums'
  | 'landmarks'
  | 'beaches'
  | 'religious'
  | 'markets'
  | 'viewpoints'
  | 'wellness';
```

Esto soluciona el problema de lugares como plazas, iglesias y miradores que antes no se capturaban.

---

## Problema 3: Límite de Lugares por Categoría ⚠️ PARCIAL

### Descripción

Para reducir el tamaño del payload enviado al AI, se limitan los lugares por categoría. Para destinos con muchas atracciones, esto puede ser insuficiente.

### Ejemplo del Problema

```
Destino: Roma
Atracciones en 20km de Roma: ~500+
Atracciones enviadas al AI: limitadas
Probabilidad de incluir lugar específico: baja

Si el AI quiere sugerir "Fontana di Trevi" pero no está en la lista,
no puede devolver un suggestedPlaceId válido.
```

### Impacto

- **Lugares famosos omitidos**: Los lugares son los primeros que devuelve Google, no necesariamente los más relevantes
- **AI limitada**: El AI no puede sugerir lugares que no ve en la lista
- **Inconsistencia**: Regenerar el mismo día puede dar resultados diferentes si Google devuelve en orden diferente

### Posibles Soluciones

1. **Aumentar límite**: Subir a 25-30 lugares por categoría (cuidando el tamaño del contexto)
2. **Priorización inteligente**: Ordenar por rating × reviewCount antes de limitar
3. **Dos niveles**: Lista corta para el prompt + lista larga para el matching
4. **Contexto por día**: Enviar lugares relevantes para cada día según la zona que se visitará

---

## Problema 4: AI Puede No Usar IDs Correctamente ⚠️ PARCIAL

### Descripción

El sistema depende de que la AI devuelva el `suggestedPlaceId` exacto de la lista. Si la AI inventa un ID, usa el nombre en lugar del ID, o simplemente no incluye el campo, el linkeo falla silenciosamente.

### Casos de Fallo

```typescript
// Caso 1: AI inventa un ID
{
  activity: "Visita a la Fontana di Trevi",
  suggestedPlaceId: "fontana-di-trevi" // ← ID inventado, no existe
}

// Caso 2: AI usa nombre en lugar de ID
{
  activity: "Visita a la Fontana di Trevi",
  suggestedPlaceId: "Fontana di Trevi" // ← Es el nombre, no el ID
}

// Caso 3: AI omite el campo
{
  activity: "Visita a la Fontana di Trevi",
  // sin suggestedPlaceId
}

// Caso 4: AI alucinó el lugar completo
{
  activity: "Visita al Museo del Chocolate", // No existe en la lista
  suggestedPlaceId: "ChIJxyz123..." // ID inventado
}
```

### Por Qué Falla

1. **Alucinaciones de LLM**: Los modelos de lenguaje pueden generar IDs que parecen válidos pero no lo son
2. **Confusión ID vs nombre**: El prompt dice "id" pero el AI puede confundirlo con el nombre
3. **Formato inconsistente**: Google Place IDs tienen formato específico (ej: `ChIJ...`) que el AI puede no reconocer
4. **Contexto largo**: Con muchos lugares, el AI puede perder de vista los IDs específicos

### Posibles Soluciones

1. **Validación en tiempo real**: Verificar IDs durante el streaming y advertir si son inválidos
2. **Fallback por nombre**: Si el ID no existe, intentar match por nombre similar
3. **Prompt mejorado**: Incluir ejemplos explícitos de IDs válidos vs inválidos
4. **Post-procesamiento**: Algoritmo de fuzzy matching si el exact match falla
5. **Structured output**: Usar function calling o JSON schema para forzar formato correcto

---

## Plan de Mejora Sugerido

### Fase 1: Diagnóstico ✅ COMPLETADO
- Debugging detallado del proceso de linkeo implementado
- Datos recopilados sobre dónde fallan los links

### Fase 2: Quick Wins ✅ COMPLETADO
- Categorías expandidas a 12+
- Prompts mejorados con ejemplos de IDs válidos

### Fase 3: Mejoras Estructurales ❌ PENDIENTE
- Implementar radio dinámico basado en tipo de destino
- Agregar fallback de matching por nombre
- Pre-fetch específico por ciudad cuando hay múltiples destinos

### Fase 4: Optimización ❌ PENDIENTE
- Cache inteligente de lugares por región
- Matching fuzzy para lugares no encontrados
- Sistema de retroalimentación para mejorar prompts

---

## Referencias

- Código de pre-fetch: `src/app/api/ai/prefetch-places/route.ts`
- Código de enrichment: `src/app/api/ai/enrich-itinerary/route.ts`
- Prompts del AI: `src/lib/ai/prompts-progressive.ts`
- Tipos de Google Places: `src/lib/explore/google-places.ts`
