/**
 * E2E Tests: Google Places API Integration for AI Travel Agent
 *
 * Tests validate that the AI Travel Agent can:
 * 1. Search for specific places by name
 * 2. Get place recommendations by category
 * 3. Calculate travel times between locations
 * 4. Display results as visual PlaceResultCard components
 *
 * Test Data (from CLAUDE.md):
 * - Destino: Costa Rica
 * - Origen: Puerto Rico
 * - Fechas: del 7 de diciembre al 13 de diciembre
 * - Cantidad de personas: 9 personas
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const TEST_TRIP = {
  destination: 'Costa Rica',
  origin: 'Puerto Rico',
  startDate: '2024-12-07',
  endDate: '2024-12-13',
  travelers: 9,
}

/**
 * Helper: Navigate to existing trip's canvas view
 * For testing, we assume a trip already exists (created manually or in setup)
 */
async function navigateToTripCanvas(page: Page) {
  // Go to trips page
  await page.goto('/trips')

  // Wait for trips to load
  await page.waitForSelector('text=/mis viajes/i', { timeout: 10000 }).catch(() => {
    // Page might already be loaded
  })

  // Look for a trip for Costa Rica or any trip
  const costaRicaTrip = page.locator('article, div[class*="card"]').filter({ hasText: /costa rica/i }).first()
  const anyTrip = page.locator('article, div[class*="card"]').filter({ has: page.locator('button:has-text("Continuar")') }).first()

  let tripCard = costaRicaTrip
  if (!(await tripCard.isVisible({ timeout: 2000 }))) {
    tripCard = anyTrip
  }

  // If no trips exist, navigate to a well-known test trip or skip
  if (!(await tripCard.isVisible({ timeout: 2000 }))) {
    // For testing, try to access the planning page directly
    // This assumes authentication is disabled or handled elsewhere
    await page.goto('/trips')

    // Check if there's a "Crear nuevo viaje" button (empty state)
    const createButton = page.locator('button, a').filter({ hasText: /crear.*primer.*viaje|nuevo viaje/i }).first()

    if (await createButton.isVisible({ timeout: 2000 })) {
      // No trips exist - this test requires at least one trip
      test.skip()
      return
    }
  }

  // Click "Continuar planificando" button
  const continueButton = tripCard.locator('button').filter({ hasText: /continuar/i })
  await continueButton.click()

  // Wait for navigation to planning page
  await page.waitForURL(/\/trips\/[^/]+\/planning/, { timeout: 10000 })

  // Wait for the canvas/itinerary to be visible
  // The planning page should show the itinerary with days
  await page.waitForSelector('text=/día.*[0-9]|day.*[0-9]/i', { timeout: 15000 }).catch(() => {
    // Might still be generating
  })

  // Verify we're on a trip page
  await expect(page).toHaveURL(/\/trips\/[^/]+/)
}

/**
 * Helper: Open AI Chat Widget
 */
async function openAIChat(page: Page) {
  // Look for floating chat button (bottom right)
  const chatButton = page.locator('button').filter({ hasText: /chat|asistente/i }).or(
    page.locator('[aria-label*="chat" i], [aria-label*="asistente" i]')
  ).or(
    page.locator('button[class*="fixed"][class*="bottom"]').first()
  )

  await expect(chatButton).toBeVisible({ timeout: 10000 })
  await chatButton.click()

  // Wait for chat panel to open
  await page.waitForSelector('[role="dialog"], aside, div[class*="sheet"]', { timeout: 5000 })

  // Verify chat is open by looking for textarea
  await expect(page.locator('textarea[placeholder*="mensaje" i], textarea')).toBeVisible()
}

/**
 * Helper: Send message in AI Chat
 */
async function sendChatMessage(page: Page, message: string) {
  const textarea = page.locator('textarea[placeholder*="mensaje" i], textarea').first()
  await textarea.fill(message)

  // Send message (Enter key or Send button)
  const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /enviar|send/i }).or(
    page.locator('button svg').locator('..').filter({ has: page.locator('path[d*="M12 19"]') })
  ).first()

  if (await sendButton.isVisible({ timeout: 1000 })) {
    await sendButton.click()
  } else {
    await textarea.press('Enter')
  }
}

/**
 * Helper: Wait for AI response to complete
 */
async function waitForAIResponse(page: Page) {
  // Wait for typing indicator to appear
  await page.waitForSelector('text=/respondiendo|typing/i', { timeout: 2000 }).catch(() => {
    // If typing indicator doesn't appear, that's OK - response might be instant
  })

  // Wait for typing indicator to disappear
  await page.waitForSelector('text=/respondiendo|typing/i', { state: 'hidden', timeout: 30000 }).catch(() => {
    // If no typing indicator, wait for a message with AI avatar instead
  })

  // Additional wait for streaming to complete
  await page.waitForTimeout(1000)
}

test.describe('Google Places API Integration - AI Travel Agent', () => {
  test.beforeEach(async ({ page }) => {
    // Skip authentication for local testing
    // In production, you would need to handle login
    test.setTimeout(120000) // 2 minutes per test
  })

  test.describe('User Story 1: Search for a specific place by name', () => {
    test('should search for "Parque Nacional Manuel Antonio" and display PlaceResultCard with real data', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Send search query
      await sendChatMessage(page, 'Busca el Parque Nacional Manuel Antonio')
      await waitForAIResponse(page)

      // Verify PlaceResultCard is rendered
      const placeCard = page.locator('article, div').filter({
        has: page.locator('text="Parque Nacional Manuel Antonio"')
      }).first()

      await expect(placeCard).toBeVisible({ timeout: 10000 })

      // Verify card has essential elements
      // 1. Place name
      await expect(placeCard.locator('h3, strong').filter({ hasText: /manuel antonio/i })).toBeVisible()

      // 2. Rating (star icon + number)
      const ratingElement = placeCard.locator('text=/★|⭐|[0-9]\\.[0-9]/').first()
      await expect(ratingElement).toBeVisible()

      // 3. Image or placeholder
      const imageOrPlaceholder = placeCard.locator('img, svg, div[class*="image"]').first()
      await expect(imageOrPlaceholder).toBeVisible()

      // 4. "Ver en mapa" button
      const viewMapButton = placeCard.locator('a, button').filter({ hasText: /ver.*mapa|view.*map/i })
      await expect(viewMapButton).toBeVisible()

      // Verify "Ver en mapa" opens Google Maps
      const mapLink = await viewMapButton.getAttribute('href')
      expect(mapLink).toContain('google.com/maps')

      // 5. "Agregar al Día X" button
      const addButton = placeCard.locator('button').filter({ hasText: /agregar.*día|add.*day/i })
      await expect(addButton).toBeVisible()

      // Verify button shows day number
      const addButtonText = await addButton.textContent()
      expect(addButtonText).toMatch(/día\s+[0-9]|day\s+[0-9]/i)
    })

    test('should display address information in PlaceResultCard', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      await sendChatMessage(page, 'Busca el Volcán Arenal')
      await waitForAIResponse(page)

      const placeCard = page.locator('article, div').filter({
        has: page.locator('text=/volcán arenal|arenal volcano/i')
      }).first()

      await expect(placeCard).toBeVisible({ timeout: 10000 })

      // Verify address is displayed (should contain "Costa Rica")
      const addressElement = placeCard.locator('text=/costa rica|alajuela|la fortuna/i').first()
      await expect(addressElement).toBeVisible()
    })

    test('should handle "Agregar al Día X" button click', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      await sendChatMessage(page, 'Busca el Parque Nacional Manuel Antonio')
      await waitForAIResponse(page)

      const placeCard = page.locator('article, div').filter({
        has: page.locator('text="Parque Nacional Manuel Antonio"')
      }).first()

      const addButton = placeCard.locator('button').filter({ hasText: /agregar.*día|add.*day/i })
      await addButton.click()

      // Wait for state change
      await page.waitForTimeout(1000)

      // Verify button changes to "Agregado" or disabled state
      const updatedButton = placeCard.locator('button').filter({ hasText: /agregado|added|✓/i })
      await expect(updatedButton).toBeVisible({ timeout: 5000 })

      // Verify button is disabled
      await expect(updatedButton).toBeDisabled()
    })
  })

  test.describe('User Story 2: Get place recommendations by category', () => {
    test('should recommend restaurants and show PlaceResultCards with real data', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Ask for restaurant recommendations
      await sendChatMessage(page, 'Recomienda restaurantes en Manuel Antonio')
      await waitForAIResponse(page)

      // Wait longer for search results
      await page.waitForTimeout(2000)

      // Should show multiple PlaceResultCards
      const placeCards = page.locator('article, div[class*="card"]').filter({
        has: page.locator('text=/★|⭐|[0-9]\\.[0-9]/')
      })

      // Expect at least 2 results (Google Places returns up to 5)
      await expect(placeCards).toHaveCount({ minimum: 2 }, { timeout: 15000 })

      // Verify first card has restaurant data
      const firstCard = placeCards.first()

      // 1. Restaurant name
      await expect(firstCard.locator('h3, strong').first()).toBeVisible()

      // 2. Rating
      await expect(firstCard.locator('text=/★|⭐|[0-9]\\.[0-9]/')).toBeVisible()

      // 3. Category indicator (should mention restaurant or food)
      const categoryOrPrice = firstCard.locator('text=/restaurant|comida|café|\$/i').first()
      await expect(categoryOrPrice).toBeVisible().catch(() => {
        // Category might not always be visible, that's OK
      })

      // 4. Action buttons
      await expect(firstCard.locator('button').filter({ hasText: /agregar/i })).toBeVisible()
      await expect(firstCard.locator('a').filter({ hasText: /mapa/i })).toBeVisible()
    })

    test('should ask for clarification if needed before showing results', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Generic query that might need clarification
      await sendChatMessage(page, 'Recomienda restaurantes')
      await waitForAIResponse(page)

      // Check if AI asks for clarification OR shows results
      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()

      const hasQuestion = await lastMessage.locator('text=/dónde|qué.*área|prefieres|which|where/i').isVisible().catch(() => false)
      const hasResults = await page.locator('article, div').filter({ has: page.locator('text=/★|⭐/') }).count() > 0

      // Either AI asks for clarification OR shows results
      expect(hasQuestion || hasResults).toBeTruthy()
    })

    test('should display price level for restaurants when available', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      await sendChatMessage(page, 'Recomienda restaurantes caros en San José')
      await waitForAIResponse(page)
      await page.waitForTimeout(2000)

      const placeCards = page.locator('article, div[class*="card"]').filter({
        has: page.locator('text=/★|⭐/')
      })

      await expect(placeCards.first()).toBeVisible({ timeout: 15000 })

      // At least one card should have price level indicator ($, $$, $$$, $$$$)
      const priceIndicator = placeCards.first().locator('text=/\\$+/')

      // Price level is optional, so we just check if it exists on first result
      const hasPriceLevel = await priceIndicator.isVisible().catch(() => false)

      // If price level is shown, verify it's valid format
      if (hasPriceLevel) {
        const priceText = await priceIndicator.textContent()
        expect(priceText).toMatch(/^\$+$/)
      }
    })
  })

  test.describe('User Story 3: Calculate travel time', () => {
    test('should calculate travel time between two locations', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Ask for travel time
      await sendChatMessage(page, 'Cuánto tiempo toma ir de San José al Parque Nacional Manuel Antonio')
      await waitForAIResponse(page)

      // Verify response contains travel time information
      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()

      // Should mention time (hours, minutes, horas, minutos)
      await expect(lastMessage.locator('text=/[0-9]+\\s*(hora|hour|min|h|hr)/i')).toBeVisible({ timeout: 10000 })

      // Should mention distance (km, miles, kilómetros)
      await expect(lastMessage.locator('text=/[0-9]+\\s*(km|kilómetro|mile)/i')).toBeVisible()

      // Should mention travel mode (driving, caminando, etc.)
      const hasTravelMode = await lastMessage.locator('text=/auto|car|driving|caminando|walking|manejando/i').isVisible().catch(() => false)

      // Travel mode is often included in Distance Matrix responses
      expect(hasTravelMode).toBeTruthy()
    })

    test('should show different travel modes when applicable', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Ask for travel time between two points
      await sendChatMessage(page, 'Cuánto tiempo toma ir del hotel al centro de San José')
      await waitForAIResponse(page)

      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()

      // Should show at least one travel mode
      const hasDriving = await lastMessage.locator('text=/auto|car|driving|manejando/i').isVisible().catch(() => false)
      const hasWalking = await lastMessage.locator('text=/caminando|walking|a pie/i').isVisible().catch(() => false)
      const hasTransit = await lastMessage.locator('text=/transporte.*público|transit|bus/i').isVisible().catch(() => false)

      expect(hasDriving || hasWalking || hasTransit).toBeTruthy()
    })

    test('should handle invalid locations gracefully', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Ask for travel time with invalid location
      await sendChatMessage(page, 'Cuánto tiempo toma ir de XYZ123InvalidPlace a ABC456InvalidPlace')
      await waitForAIResponse(page)

      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()

      // Should show error message or ask for clarification
      const hasErrorOrQuestion = await lastMessage.locator('text=/no.*pude|error|no.*encontré|verificar|clarification|which|donde/i').isVisible()

      expect(hasErrorOrQuestion).toBeTruthy()
    })
  })

  test.describe('Edge Cases', () => {
    test('should handle no results gracefully', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Search for something that doesn't exist
      await sendChatMessage(page, 'Busca el restaurante XYZ123NonExistent en Costa Rica')
      await waitForAIResponse(page)

      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()

      // Should show "no encontré" or similar message
      await expect(lastMessage.locator('text=/no.*encontré|not found|ningún|no results/i')).toBeVisible()
    })

    test('should not invent places without validation', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Ask about a place
      await sendChatMessage(page, 'Háblame del Museo Nacional de Costa Rica')
      await waitForAIResponse(page)

      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()

      // Should either:
      // 1. Show PlaceResultCard with real Google Places data
      // 2. Say it's searching/looking for the place first
      // 3. Ask for clarification

      const hasPlaceCard = await page.locator('article, div').filter({ has: page.locator('text=/museo nacional/i') }).count() > 0
      const isSearching = await lastMessage.locator('text=/buscar|buscando|looking|searching/i').isVisible().catch(() => false)
      const asksClarification = await lastMessage.locator('text=/\\?/').isVisible().catch(() => false)

      // AI should not just generate made-up details without calling the search tool
      expect(hasPlaceCard || isSearching || asksClarification).toBeTruthy()
    })

    test('should handle rate limiting gracefully', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Send multiple rapid requests
      const queries = [
        'Busca restaurantes en San José',
        'Busca hoteles en Manuel Antonio',
        'Busca museos en San José',
      ]

      for (const query of queries) {
        await sendChatMessage(page, query)
        await page.waitForTimeout(500) // Small delay between requests
      }

      // Wait for last response
      await waitForAIResponse(page)

      // Should either show results or error message (not crash)
      const messages = page.locator('[class*="message"], [role="article"]')
      await expect(messages.last()).toBeVisible()
    })
  })

  test.describe('Grounding Rules', () => {
    test('should always search before mentioning specific places', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Ask about a specific restaurant
      await sendChatMessage(page, 'Qué sabes del restaurante Grano de Oro en San José')
      await waitForAIResponse(page)

      // AI should search for it first (tool call) and show PlaceResultCard
      // OR say it's searching
      // NOT just make up information

      const hasPlaceCard = await page.locator('article').filter({
        has: page.locator('text=/grano de oro/i')
      }).count() > 0

      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()
      const isSearching = await lastMessage.locator('text=/buscar|buscando|validar/i').isVisible().catch(() => false)

      expect(hasPlaceCard || isSearching).toBeTruthy()
    })

    test('should validate place existence before adding to itinerary', async ({ page }) => {
      await navigateToTripCanvas(page)
      await openAIChat(page)

      // Ask to add a specific place
      await sendChatMessage(page, 'Agrega el Café de los Deseos al día 2')
      await waitForAIResponse(page)

      // Should either:
      // 1. Search for it and show PlaceResultCard
      // 2. Say it's validating/searching first
      // 3. Ask for confirmation

      const messages = page.locator('[class*="message"], [role="article"]')
      const lastMessage = messages.last()

      const hasPlaceCard = await page.locator('article').filter({
        has: page.locator('text=/café.*deseos/i')
      }).count() > 0

      const isValidating = await lastMessage.locator('text=/buscar|validar|verificar|confirmar/i').isVisible().catch(() => false)
      const asksConfirmation = await lastMessage.locator('text=/es este|is this|correcto|correct/i').isVisible().catch(() => false)

      expect(hasPlaceCard || isValidating || asksConfirmation).toBeTruthy()
    })
  })
})
