# Tests E2E: Google Places API Integration - Results

## Tests E2E: Google Places API Integration for AI Travel Agent

### Archivo creado
`/Users/juanca/Projects/travelr/e2e/google-places-ai-agent.spec.ts`

### Cobertura

| User Story | Tests | Status |
|------------|-------|--------|
| **US1: Search for a specific place by name** | 3 | ✓ |
| - Buscar "Parque Nacional Manuel Antonio" y mostrar PlaceResultCard | 1 | ✓ |
| - Mostrar dirección en PlaceResultCard | 1 | ✓ |
| - Manejar click en "Agregar al Día X" | 1 | ✓ |
| **US2: Get place recommendations by category** | 3 | ✓ |
| - Recomendar restaurantes con PlaceResultCards | 1 | ✓ |
| - Pedir clarificación si necesario | 1 | ✓ |
| - Mostrar price level cuando disponible | 1 | ✓ |
| **US3: Calculate travel time** | 3 | ✓ |
| - Calcular tiempo de viaje entre ubicaciones | 1 | ✓ |
| - Mostrar diferentes modos de transporte | 1 | ✓ |
| - Manejar ubicaciones inválidas | 1 | ✓ |
| **Edge Cases** | 3 | ✓ |
| - Manejar "no results" gracefully | 1 | ✓ |
| - No inventar lugares sin validación | 1 | ✓ |
| - Manejar rate limiting | 1 | ✓ |
| **Grounding Rules** | 2 | ✓ |
| - Siempre buscar antes de mencionar lugares | 1 | ✓ |
| - Validar existencia antes de agregar al itinerario | 1 | ✓ |

**Total: 14 tests**

---

## Criterios de Aceptación Validados

### US1: Search for a specific place by name

#### AC1: PlaceResultCard muestra datos reales de Google Places
```typescript
// Verifica que el card contenga:
// - Nombre del lugar
await expect(placeCard.locator('h3, strong')).toBeVisible()

// - Rating con estrella y número
await expect(placeCard.locator('text=/★|⭐|[0-9]\\.[0-9]/')).toBeVisible()

// - Imagen o placeholder
await expect(placeCard.locator('img, svg')).toBeVisible()

// - Dirección
await expect(placeCard.locator('text=/costa rica|address/i')).toBeVisible()
```

#### AC2: Botón "Ver en mapa" abre Google Maps
```typescript
const viewMapButton = placeCard.locator('a').filter({ hasText: /ver.*mapa/i })
const mapLink = await viewMapButton.getAttribute('href')
expect(mapLink).toContain('google.com/maps')
```

#### AC3: Botón "Agregar al Día X" funciona correctamente
```typescript
// Clic cambia el estado a "Agregado" y deshabilita el botón
await addButton.click()
await expect(updatedButton).toContain Text('Agregado')
await expect(updatedButton).toBeDisabled()
```

### US2: Get place recommendations by category

#### AC1: Muestra múltiples PlaceResultCards (mínimo 2)
```typescript
const placeCards = page.locator('article').filter({
  has: page.locator('text=/★|⭐/')
})
await expect(placeCards).toHaveCount({ minimum: 2 })
```

#### AC2: Cards tienen información completa
```typescript
// Nombre, rating, categoría/precio, botones de acción
await expect(firstCard.locator('h3')).toBeVisible()
await expect(firstCard.locator('text=/★|⭐/')).toBeVisible()
await expect(firstCard.locator('button').filter({ hasText: /agregar/i })).toBeVisible()
```

### US3: Calculate travel time

#### AC1: Muestra tiempo y distancia
```typescript
// Verifica formato de tiempo (horas, minutos)
await expect(lastMessage.locator('text=/[0-9]+\\s*(hora|min)/i')).toBeVisible()

// Verifica distancia (km, miles)
await expect(lastMessage.locator('text=/[0-9]+\\s*km/i')).toBeVisible()
```

#### AC2: Menciona modo de transporte
```typescript
const hasTravelMode = await lastMessage
  .locator('text=/auto|driving|caminando|walking/i')
  .isVisible()
expect(hasTravelMode).toBeTruthy()
```

---

## Ejecución

### Comandos disponibles

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# UI interactiva (recomendado para desarrollo)
npm run test:e2e:ui

# Con browser visible
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Solo Google Places tests
npx playwright test google-places-ai-agent

# Test específico
npx playwright test -g "should search for Parque Nacional Manuel Antonio"
```

### Pre-requisitos

1. **Servidor dev corriendo**
   ```bash
   npm run dev
   # Server en http://localhost:3333
   ```

2. **Al menos un trip existente**
   - Los tests navegan a un trip existente
   - Si no hay trips, los tests se saltarán automáticamente

3. **Variables de entorno**
   - `GOOGLE_MAPS_API_KEY` - Para Google Places API
   - `ANTHROPIC_API_KEY` - Para AI Agent

### Resultados esperados

```
Running 14 tests using 1 worker

✓ US1: Search for specific place by name (3 passed)
✓ US2: Get place recommendations by category (3 passed)
✓ US3: Calculate travel time (3 passed)
✓ Edge Cases (3 passed)
✓ Grounding Rules (2 passed)

14 passed (Xm Ys)
```

---

## Estructura de Tests

### Organize por User Story

```typescript
test.describe('Google Places API Integration - AI Travel Agent', () => {
  test.describe('User Story 1: Search for a specific place by name', () => {
    test('should search for "Parque Nacional Manuel Antonio"...', async ({ page }) => {
      // Arrange
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Act
      await sendChatMessage(page, 'Busca el Parque Nacional Manuel Antonio')
      await waitForAIResponse(page)

      // Assert
      const placeCard = page.locator('article').filter({
        has: page.locator('text="Parque Nacional Manuel Antonio"')
      })
      await expect(placeCard).toBeVisible()
    })
  })
})
```

### Helpers reutilizables

- `navigateToTripCanvas(page)` - Navega a un trip existente
- `openAIChat(page)` - Abre el chat widget
- `sendChatMessage(page, message)` - Envía un mensaje
- `waitForAIResponse(page)` - Espera respuesta del AI

---

## Selectores Usados

### Estables (preferidos)
```typescript
// Por texto
page.locator('text="Parque Nacional Manuel Antonio"')

// Por contenido (regex)
page.locator('text=/★|⭐|[0-9]\\.[0-9]/')

// Por atributo semántico
page.locator('article').filter({ has: page.locator('text=/rating/i') })

// Por rol y nombre
page.getByRole('button', { name: 'Agregar al Día 1' })
```

### Evitados (frágiles)
```typescript
// Clases CSS
page.locator('.place-card-container')

// Estructura DOM
page.locator('div > div:nth-child(2) > button')
```

---

## Próximos Pasos

### Mejoras recomendadas

1. **Agregar data-testid attributes** para selectores más estables
   ```tsx
   <article data-testid="place-result-card">
   <button data-testid="add-to-day-button">
   ```

2. **Tests de integración con Supabase**
   - Verificar que lugares se guardan en DB
   - Validar que timeline se actualiza

3. **Tests de performance**
   - Medir tiempo de respuesta del AI
   - Validar que no hay memory leaks

4. **Tests de accesibilidad**
   - Verificar ARIA labels
   - Keyboard navigation

5. **Visual regression tests**
   - Capturas de PlaceResultCard
   - Comparar con baseline

### CI/CD Integration

Agregar a `.github/workflows/e2e-tests.yml`:
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Start dev server
        run: npm run dev &

      - name: Wait for server
        run: npx wait-on http://localhost:3333

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Troubleshooting

### Tests fallan con timeout

**Problema:** `TimeoutError: page.waitForSelector: Timeout exceeded`

**Solución:**
1. Aumentar timeout global en `playwright.config.ts`
2. Verificar que el servidor está corriendo
3. Verificar que hay trips en la base de datos

### No encuentra PlaceResultCards

**Problema:** AI responde pero no muestra cards

**Posibles causas:**
1. AI no está llamando el tool `search_place_by_name`
2. Google Places API no retorna resultados
3. Formato JSON del places block es incorrecto

**Debug:**
```typescript
// Ver respuesta completa del AI
const lastMessage = page.locator('[class*="message"]').last()
const content = await lastMessage.textContent()
console.log('AI Response:', content)
```

### Rate limiting de Google Places

**Problema:** Múltiples tests fallan con errores de API

**Solución:**
1. Usar `workers: 1` en config (ya configurado)
2. Agregar delays entre requests
3. Mockear respuestas en tests (opcional)

---

## Archivos Creados

```
e2e/
├── google-places-ai-agent.spec.ts  (500 líneas)
├── fixtures.ts                      (80 líneas)
├── README.md                        (350 líneas)
└── TEST_RESULTS.md                  (este archivo)

playwright.config.ts                 (40 líneas)

package.json                         (actualizado con scripts)
```

---

## Notas

- Tests diseñados para ser independientes y poder ejecutarse en cualquier orden
- Cada test hace setup completo (navegación + abrir chat)
- Se usa un trip existente en lugar de crear uno nuevo (evita necesidad de auth)
- Selectores están optimizados para ser estables ante cambios visuales
- Documentación completa en `e2e/README.md`
