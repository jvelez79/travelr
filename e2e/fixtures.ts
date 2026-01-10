/**
 * Playwright Test Fixtures for Travelr E2E Tests
 *
 * Provides common setup and utilities for E2E tests:
 * - Authentication
 * - Trip creation
 * - AI Chat interaction
 */

import { test as base, Page } from '@playwright/test'

export interface TripData {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

export const TEST_TRIP: TripData = {
  destination: 'Costa Rica',
  origin: 'Puerto Rico',
  startDate: '2024-12-07',
  endDate: '2024-12-13',
  travelers: 9,
}

/**
 * Extended test fixture with helper methods
 */
export const test = base.extend<{
  authenticatedPage: Page
  tripId: string
}>({
  authenticatedPage: async ({ page }, use) => {
    // For local development, authentication might be disabled
    // or you might need to login with test credentials

    // TODO: Add authentication if needed
    // await page.goto('/login')
    // await page.fill('input[type="email"]', 'test@example.com')
    // await page.fill('input[type="password"]', 'password')
    // await page.click('button[type="submit"]')
    // await page.waitForURL(/\/trips/)

    await use(page)
  },

  tripId: async ({ page }, use) => {
    // This fixture creates a trip and extracts the trip ID
    // Useful for tests that need a trip ID directly

    // Navigate to trips page
    await page.goto('/trips')

    // Get existing trip or create new one
    const existingTrip = await page.locator('[data-trip-id], a[href*="/trips/"]').first()

    let tripId: string | null = null

    if (await existingTrip.isVisible({ timeout: 2000 })) {
      // Extract trip ID from existing trip
      const href = await existingTrip.getAttribute('href')
      const match = href?.match(/\/trips\/([^/?]+)/)
      if (match) {
        tripId = match[1]
      }
    }

    if (!tripId) {
      // Create new trip
      await page.goto('/trips/new')

      // Fill form
      await page.fill('input[name="destination"]', TEST_TRIP.destination)
      await page.fill('input[name="origin"]', TEST_TRIP.origin)
      await page.fill('input[name="startDate"]', TEST_TRIP.startDate)
      await page.fill('input[name="endDate"]', TEST_TRIP.endDate)
      await page.fill('input[name="travelers"]', String(TEST_TRIP.travelers))

      // Submit
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/trips\/[^/]+/, { timeout: 30000 })

      // Extract trip ID from URL
      const url = page.url()
      const match = url.match(/\/trips\/([^/?]+)/)
      if (match) {
        tripId = match[1]
      }
    }

    if (!tripId) {
      throw new Error('Failed to create or find trip ID')
    }

    await use(tripId)
  },
})

export { expect } from '@playwright/test'
