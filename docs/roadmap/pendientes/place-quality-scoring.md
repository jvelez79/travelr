> **FEATURE PENDIENTE**: Este documento describe una funcionalidad planificada pero no implementada aún.

# Sistema de Puntuación y Calidad de Lugares

Este documento define cómo Travelr analiza e interpreta los datos de Google Places para ayudar al usuario a encontrar lugares de calidad y evitar decepciones.

**Fuente principal:** [Google Restaurant Reviews: How to Spot Hidden Gems and Avoid Disasters](https://googlereviewservices.com/google-restaurant-reviews-how-to-spot-hidden-gems-and-avoid-disasters)

---

## Filosofía

El usuario no debería tener que saber cómo interpretar reviews. Travelr hace ese trabajo automáticamente, analizando patrones en los datos para:
1. **Identificar Hidden Gems** - Lugares excelentes poco conocidos
2. **Detectar Red Flags** - Señales de advertencia que el usuario promedio no ve
3. **Dar contexto** - Explicar POR QUÉ un lugar es bueno o sospechoso

---

## 1. Clasificación por Review Count + Rating

### Hidden Gem (💎 "Pocos lo conocen")
```typescript
function isHiddenGem(place: Place): boolean {
  return (
    place.rating >= 4.5 &&
    place.reviewCount >= 30 &&
    place.reviewCount <= 300
  );
}
```
**Razonamiento:** Un lugar con 4.5+ estrellas y solo 30-300 reviews indica "un lugar nuevo no descubierto por las masas pero amado por quienes lo probaron".

### Establecido Confiable (⭐ "Excepcionalmente valorado")
```typescript
function isExceptionallyRated(place: Place): boolean {
  return (
    place.rating >= 4.8 &&
    place.reviewCount >= 100
  );
}
```
**Razonamiento:** Rating muy alto con muestra significativa = calidad comprobada.

### Nuevo Favorito (🆕 "Nuevo favorito")
```typescript
function isNewFavorite(place: Place): boolean {
  // Requiere datos de fecha de apertura
  const isNew = place.openedWithinYears <= 2;
  return (
    isNew &&
    place.rating >= 4.3 &&
    place.reviewCount >= 20
  );
}
```

### Muestra Insuficiente (⚠️)
```typescript
function hasInsufficientData(place: Place): boolean {
  return place.reviewCount < 10;
}
```
**Mensaje al usuario:** "Muy pocas reviews para evaluar con confianza"

---

## 2. Regla de Oro: Rating vs Review Count

> "Un lugar con 4 estrellas y 100 reviews es mejor que uno con 5 estrellas pero solo 5 reviews"

### Fórmula de Confianza
```typescript
function calculateConfidenceScore(place: Place): number {
  // Score que balancea rating con tamaño de muestra
  const ratingWeight = place.rating / 5; // 0-1
  const sampleWeight = Math.min(place.reviewCount / 100, 1); // 0-1, cap at 100

  return (ratingWeight * 0.6) + (sampleWeight * 0.4);
}
```

### Insight generado
```typescript
function generateRatingInsight(place: Place): string | null {
  if (place.rating >= 4.5 && place.reviewCount < 100) {
    return `Solo ${place.reviewCount} reviews pero ${place.rating} de rating - joya por descubrir`;
  }
  if (place.rating >= 4.7 && place.reviewCount >= 500) {
    return `${place.rating} estrellas con ${place.reviewCount.toLocaleString()} reviews - calidad comprobada`;
  }
  return null;
}
```

---

## 3. Red Flags (Señales de Advertencia)

### 3.1 Patrón Polarizado
```typescript
function hasPolarizedRatings(place: Place): boolean {
  // Si disponemos de distribución de ratings
  // Muchos 5 estrellas Y muchos 1 estrella = sospechoso
  const fiveStarPercent = place.ratingDistribution?.[5] || 0;
  const oneStarPercent = place.ratingDistribution?.[1] || 0;

  return fiveStarPercent > 40 && oneStarPercent > 20;
}
```
**Mensaje:** "Opiniones muy divididas - algunos aman, otros odian"

### 3.2 Reviews Muy Antiguas
```typescript
function hasStaleReviews(place: Place): boolean {
  // Última review hace más de 6 meses
  const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
  return place.lastReviewDate < sixMonthsAgo;
}
```
**Mensaje:** "Sin reviews recientes - verificar si sigue abierto"

### 3.3 Flood de Reviews (Sospechoso)
```typescript
function hasSuspiciousReviewPattern(place: Place): boolean {
  // Muchas reviews positivas en poco tiempo = posible manipulación
  // Requiere datos de timeline de reviews
  return false; // Implementar cuando tengamos datos de timeline
}
```

---

## 4. Green Flags (Señales Positivas)

### 4.1 Consistencia en el Tiempo
- Reviews positivas distribuidas a lo largo del tiempo (no en clusters)
- Temas comunes mencionados por múltiples reviewers

### 4.2 Owner Responde
```typescript
function ownerRespondsToReviews(place: Place): boolean {
  // Google Places no provee esto directamente
  // Pero podemos inferir de las reviews si mencionan respuesta del dueño
  return false; // Implementar si disponible
}
```
**Mensaje:** "El negocio responde a feedback - señal de compromiso"

### 4.3 Fotos Reales de Usuarios
```typescript
function hasUserPhotos(place: Place): boolean {
  return place.images.length >= 3;
}
```
**Mensaje:** "Fotos reales de clientes disponibles"

---

## 5. Categorías de Badges

### Badges Positivos
| Badge | Criterio | Color | Mensaje |
|-------|----------|-------|---------|
| 💎 Pocos lo conocen | rating ≥4.5 AND reviews 30-300 | Purple (#8B5CF6) | "Solo X reviews pero Y de rating" |
| ⭐ Excepcionalmente valorado | rating ≥4.8 AND reviews ≥100 | Amber (#F59E0B) | "Uno de los mejores de la zona" |
| 🆕 Nuevo favorito | <2 años AND rating ≥4.3 | Teal (#14B8A6) | "Abierto en 202X, ya es favorito" |
| 🏆 Top de categoría | Top 3 en su categoría por rating | Gold (#EAB308) | "#X en [categoría]" |

### Badges de Advertencia
| Badge | Criterio | Color | Mensaje |
|-------|----------|-------|---------|
| ⚠️ Pocas reviews | reviews <10 | Gray (#6B7280) | "Muy pocas reviews para evaluar" |
| 📊 Opiniones divididas | polarized ratings | Orange (#F97316) | "Opiniones muy divididas" |
| 🕐 Sin actividad reciente | última review >6 meses | Gray (#6B7280) | "Sin reviews recientes" |

---

## 6. Algoritmo de Ordenamiento

### Para "Joyas escondidas" (Discovery Mode)
```typescript
function sortByHiddenGemScore(places: Place[]): Place[] {
  return places.sort((a, b) => {
    const scoreA = calculateHiddenGemScore(a);
    const scoreB = calculateHiddenGemScore(b);
    return scoreB - scoreA;
  });
}

function calculateHiddenGemScore(place: Place): number {
  if (place.reviewCount < 10) return 0; // Muestra insuficiente

  // Favorecemos alto rating con pocos reviews
  const ratingScore = place.rating / 5; // 0-1

  // Penalizamos lugares muy populares (ya son conocidos)
  const popularityPenalty = Math.min(place.reviewCount / 1000, 0.5);

  // Bonus por estar en el "sweet spot" de reviews
  const sweetSpotBonus = (place.reviewCount >= 30 && place.reviewCount <= 200) ? 0.2 : 0;

  return ratingScore - popularityPenalty + sweetSpotBonus;
}
```

### Para Búsqueda General
```typescript
function sortByOverallQuality(places: Place[]): Place[] {
  return places.sort((a, b) => {
    const scoreA = calculateOverallScore(a);
    const scoreB = calculateOverallScore(b);
    return scoreB - scoreA;
  });
}

function calculateOverallScore(place: Place): number {
  const ratingWeight = 0.6;
  const reviewCountWeight = 0.3;
  const recencyWeight = 0.1;

  const normalizedRating = place.rating / 5;
  const normalizedReviews = Math.min(place.reviewCount / 500, 1);
  const recencyScore = place.lastReviewDate ?
    Math.max(0, 1 - (Date.now() - place.lastReviewDate) / (365 * 24 * 60 * 60 * 1000)) : 0.5;

  return (normalizedRating * ratingWeight) +
         (normalizedReviews * reviewCountWeight) +
         (recencyScore * recencyWeight);
}
```

---

## 7. Insights Automáticos

El sistema genera insights contextuales para cada lugar:

```typescript
function generateInsights(place: Place): string[] {
  const insights: string[] = [];

  // Hidden gem insight
  if (place.rating >= 4.5 && place.reviewCount < 200) {
    insights.push(`Solo ${place.reviewCount} reviews pero ${place.rating} de rating - joya por descubrir`);
  }

  // High volume + high rating
  if (place.rating >= 4.7 && place.reviewCount >= 1000) {
    insights.push(`${place.rating} estrellas con miles de reviews - calidad comprobada`);
  }

  // Top in category
  const categoryRank = getCategoryRank(place);
  if (categoryRank <= 3) {
    insights.push(`Top ${categoryRank} en ${place.category} de ${place.location.city}`);
  }

  // Price value insight
  if (place.priceLevel === 1 && place.rating >= 4.3) {
    insights.push(`Económico pero bien valorado - excelente relación calidad/precio`);
  }

  // Warning insights
  if (place.reviewCount < 10) {
    insights.push(`Muy pocas reviews para evaluar con confianza`);
  }

  return insights;
}
```

---

## 8. Lo Que NO Podemos Detectar (Limitaciones)

Con los datos de Google Places API, **no tenemos acceso** a:
- Distribución de ratings (solo promedio)
- Texto completo de reviews individuales
- Timeline de cuándo se publicaron reviews
- Si el owner responde a reviews
- Perfiles de reviewers

**Mitigación:**
- Usar los datos que sí tenemos (rating, reviewCount, photos)
- Ser honestos con el usuario sobre limitaciones
- Links a Google Maps/TripAdvisor para investigación profunda

---

## 9. Implementación en UI

### En las Cards del Explorer
```jsx
<PlaceCard>
  <Image />
  <Badge type="hidden-gem" /> {/* Si aplica */}
  <Title>{place.name}</Title>
  <Rating value={place.rating} count={place.reviewCount} />
  <Insight>{generateInsights(place)[0]}</Insight> {/* Primera insight */}
  <AddButton />
</PlaceCard>
```

### En el Panel de Detalles
```jsx
<PlaceDetails>
  {/* ... otros campos ... */}

  <Section title="Análisis de Travelr">
    {generateInsights(place).map(insight => (
      <InsightBadge>{insight}</InsightBadge>
    ))}
  </Section>

  <Section title="Verificar en otras fuentes">
    <ExternalLink to={`google.com/search?q=${place.name}+reviews`}>
      Ver más reviews
    </ExternalLink>
    <ExternalLink to={place.googleMapsUrl}>
      Google Maps
    </ExternalLink>
  </Section>
</PlaceDetails>
```

---

## 10. Testing

### Casos de Prueba
```typescript
// Hidden Gem verdadero
{ rating: 4.8, reviewCount: 67 } // → 💎 Badge

// Hidden Gem falso (muy pocas reviews)
{ rating: 5.0, reviewCount: 5 } // → ⚠️ "Muy pocas reviews"

// Lugar establecido
{ rating: 4.7, reviewCount: 2340 } // → ⭐ Badge

// Lugar mediocre popular
{ rating: 3.8, reviewCount: 5000 } // → Sin badge

// Nuevo lugar prometedor
{ rating: 4.4, reviewCount: 45, openedYear: 2024 } // → 🆕 Badge
```

---

## Referencias

- [Google Restaurant Reviews Guide](https://googlereviewservices.com/google-restaurant-reviews-how-to-spot-hidden-gems-and-avoid-disasters)
- [Hidden Gems Algorithm - Fortress of Doors](https://www.fortressofdoors.com/an-algorithm-for-discovering-hidden-gems/)
- [Finding Hidden Trails - Towards Data Science](https://towardsdatascience.com/hidden-gems-finding-the-best-secret-trails-in-america-d9203e8ad073/)
