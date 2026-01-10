# E2E Tests - Google Places API Integration

Tests end-to-end que validan la integración de Google Places API en el AI Travel Agent.

## Tests Implementados

### `google-places-ai-agent.spec.ts`

Valida 3 User Stories principales:

#### US1: Search for a specific place by name
- ✓ Buscar "Parque Nacional Manuel Antonio" y mostrar PlaceResultCard con datos reales
- ✓ Mostrar información de dirección en PlaceResultCard
- ✓ Manejar click en botón "Agregar al Día X"

#### US2: Get place recommendations by category
- ✓ Recomendar restaurantes y mostrar PlaceResultCards con datos reales
- ✓ Pedir clarificación si es necesario antes de mostrar resultados
- ✓ Mostrar price level para restaurantes cuando esté disponible

#### US3: Calculate travel time
- ✓ Calcular tiempo de viaje entre dos ubicaciones
- ✓ Mostrar diferentes modos de transporte cuando aplique
- ✓ Manejar ubicaciones inválidas gracefully

#### Edge Cases
- ✓ Manejar "no results" gracefully
- ✓ No inventar lugares sin validación
- ✓ Manejar rate limiting gracefully

#### Grounding Rules
- ✓ Siempre buscar antes de mencionar lugares específicos
- ✓ Validar existencia de lugar antes de agregar al itinerario

## Estructura de Tests

```
e2e/
├── google-places-ai-agent.spec.ts  # Tests principales
├── fixtures.ts                      # Fixtures y helpers compartidos
└── README.md                        # Esta documentación
```

## Ejecutar Tests

### Pre-requisitos

1. Servidor local corriendo en `http://localhost:3333`:
   ```bash
   npm run dev
   ```

2. Variables de entorno configuradas:
   - `GOOGLE_MAPS_API_KEY` - API key de Google Maps/Places
   - `ANTHROPIC_API_KEY` - API key de Anthropic Claude

### Comandos

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con UI interactiva
npm run test:e2e:ui

# Ejecutar con browser visible (headed mode)
npm run test:e2e:headed

# Debug mode (paso a paso)
npm run test:e2e:debug

# Ejecutar solo el spec de Google Places
npx playwright test google-places-ai-agent

# Ejecutar solo un test específico
npx playwright test -g "should search for Parque Nacional Manuel Antonio"
```

## Datos de Prueba

Los tests usan datos consistentes definidos en `fixtures.ts`:

```typescript
const TEST_TRIP = {
  destination: 'Costa Rica',
  origin: 'Puerto Rico',
  startDate: '2024-12-07',
  endDate: '2024-12-13',
  travelers: 9,
}
```

## Selectores

Los tests utilizan selectores estables siguiendo best practices:

### Bueno
```typescript
// Por texto (contenido estable)
page.locator('text="Parque Nacional Manuel Antonio"')

// Por rol y nombre accesible
page.getByRole('button', { name: 'Agregar al Día 1' })

// Por atributos semánticos
page.locator('article').filter({ has: page.locator('text=/★|⭐/') })
```

### Evitado
```typescript
// Clases CSS (frágiles)
page.locator('.card-header-title')

// Selectores por estructura DOM
page.locator('div > div > button:first-child')
```

## Assertions Clave

### PlaceResultCard Validation

Cada PlaceResultCard debe tener:

1. **Nombre del lugar** - `h3` o `strong` con el nombre
2. **Rating** - Estrella (★/⭐) + número (ej: "4.5")
3. **Imagen** - `img` o placeholder icon
4. **Dirección** - Texto con ubicación (opcional)
5. **Botón "Ver en mapa"** - Link a Google Maps
6. **Botón "Agregar al Día X"** - Botón con número de día

### AI Response Validation

Las respuestas del AI deben:

1. **No inventar datos** - Siempre llamar tool de búsqueda primero
2. **Mostrar loading** - Indicador de "typing" mientras responde
3. **Manejar errores** - Mensajes claros cuando no hay resultados
4. **Pedir clarificación** - Cuando la query es ambigua

## Helpers

### `createTripAndNavigateToCanvas(page)`
Crea un trip de prueba y navega al canvas.

### `openAIChat(page)`
Abre el floating chat widget del AI Travel Agent.

### `sendChatMessage(page, message)`
Envía un mensaje en el chat.

### `waitForAIResponse(page)`
Espera a que el AI termine de responder (typing indicator).

## Troubleshooting

### Test timeout
Si los tests fallan por timeout, aumenta el timeout en `beforeEach`:
```typescript
test.beforeEach(async ({ page }) => {
  test.setTimeout(180000) // 3 minutes
})
```

### Authentication requerida
Si el ambiente requiere autenticación:
1. Agregar credenciales de prueba en `.env.test`
2. Implementar login en `fixtures.ts`

### Rate limiting de Google Places API
Si ves errores de rate limiting:
1. Reducir número de tests que corren en paralelo (`workers: 1` en config)
2. Agregar delays entre requests
3. Usar API key con mayor quota

## Cobertura

| User Story | Tests | Cobertura |
|------------|-------|-----------|
| US1: Search by name | 3 | ✓ Happy path, address display, button interaction |
| US2: Recommendations | 3 | ✓ Multiple results, clarification, price level |
| US3: Travel time | 3 | ✓ Time calculation, multiple modes, error handling |
| Edge cases | 3 | ✓ No results, no invented data, rate limiting |
| Grounding rules | 2 | ✓ Search validation, place validation |

**Total: 14 tests**

## CI/CD

Para ejecutar en CI, asegurar:

1. Servidor de desarrollo iniciado antes de los tests
2. Variables de entorno configuradas
3. Playwright browsers instalados:
   ```bash
   npx playwright install --with-deps chromium
   ```

Ejemplo GitHub Actions:
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run dev server
  run: npm run dev &

- name: Wait for server
  run: npx wait-on http://localhost:3333

- name: Run E2E tests
  run: npm run test:e2e
```

## Mantenimiento

### Actualizar tests cuando cambien:
- Selectores de UI (clase CSS, estructura DOM)
- Textos de botones o labels
- Flujo de autenticación
- Formato de respuestas del AI

### Agregar tests para:
- Nuevos tools del AI Agent
- Nuevas categorías de lugares
- Nuevas features de PlaceResultCard
- Edge cases descubiertos en producción
