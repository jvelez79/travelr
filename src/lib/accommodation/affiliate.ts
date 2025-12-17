/**
 * Affiliate Link Transformation Utilities
 *
 * Transforms booking provider URLs from SerpAPI with affiliate tracking parameters.
 * This enables monetization through hotel booking commissions.
 *
 * Supported Programs:
 * - Booking.com: 25-40% of margin (tiered by monthly volume)
 * - Expedia: 4-6% commission
 * - Hotels.com: 4% commission
 * - Agoda: 4-7% commission
 */

import type { BookingLink } from "@/types/accommodation"

// Environment variables for affiliate IDs
const BOOKING_AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || ""
const BOOKING_AFFILIATE_LABEL = process.env.BOOKING_AFFILIATE_LABEL || "travelr_app"
const EXPEDIA_AFFILIATE_ID = process.env.EXPEDIA_AFFILIATE_ID || ""
const HOTELS_COM_AFFILIATE_ID = process.env.HOTELS_COM_AFFILIATE_ID || ""
const AGODA_AFFILIATE_ID = process.env.AGODA_AFFILIATE_ID || ""

/**
 * Provider configurations for affiliate link transformation
 */
interface AffiliateConfig {
  isConfigured: boolean
  transform: (url: string) => string
}

const affiliateConfigs: Record<string, AffiliateConfig> = {
  "Booking.com": {
    isConfigured: !!BOOKING_AFFILIATE_ID,
    transform: (url: string) => {
      try {
        const parsedUrl = new URL(url)
        parsedUrl.searchParams.set("aid", BOOKING_AFFILIATE_ID)
        parsedUrl.searchParams.set("label", BOOKING_AFFILIATE_LABEL)
        return parsedUrl.toString()
      } catch {
        return url
      }
    },
  },
  "Expedia": {
    isConfigured: !!EXPEDIA_AFFILIATE_ID,
    transform: (url: string) => {
      try {
        const parsedUrl = new URL(url)
        parsedUrl.searchParams.set("affcid", EXPEDIA_AFFILIATE_ID)
        return parsedUrl.toString()
      } catch {
        return url
      }
    },
  },
  "Hotels.com": {
    isConfigured: !!HOTELS_COM_AFFILIATE_ID,
    transform: (url: string) => {
      try {
        const parsedUrl = new URL(url)
        parsedUrl.searchParams.set("affcid", HOTELS_COM_AFFILIATE_ID)
        return parsedUrl.toString()
      } catch {
        return url
      }
    },
  },
  "Agoda": {
    isConfigured: !!AGODA_AFFILIATE_ID,
    transform: (url: string) => {
      try {
        const parsedUrl = new URL(url)
        parsedUrl.searchParams.set("cid", AGODA_AFFILIATE_ID)
        return parsedUrl.toString()
      } catch {
        return url
      }
    },
  },
}

/**
 * Transform a single booking URL to include affiliate tracking
 *
 * @param originalUrl - The URL from SerpAPI or other source
 * @param provider - The booking provider name (e.g., "Booking.com")
 * @returns The URL with affiliate parameters, or original if not configured
 */
export function toAffiliateLink(originalUrl: string, provider: string): string {
  // Normalize provider name for matching
  const normalizedProvider = normalizeProviderName(provider)

  const config = affiliateConfigs[normalizedProvider]

  if (!config || !config.isConfigured) {
    // Return original URL if no affiliate config for this provider
    return originalUrl
  }

  return config.transform(originalUrl)
}

/**
 * Normalize provider name for consistent matching
 */
function normalizeProviderName(provider: string): string {
  const normalized = provider.toLowerCase().trim()

  // Map common variations to canonical names
  const providerMap: Record<string, string> = {
    "booking.com": "Booking.com",
    "booking": "Booking.com",
    "expedia": "Expedia",
    "expedia.com": "Expedia",
    "hotels.com": "Hotels.com",
    "hotelscom": "Hotels.com",
    "agoda": "Agoda",
    "agoda.com": "Agoda",
  }

  return providerMap[normalized] || provider
}

/**
 * Transform all booking links in an array with affiliate tracking
 *
 * @param bookingLinks - Array of booking links from SerpAPI
 * @returns Array with affiliateUrl populated where possible
 */
export function transformBookingLinks(bookingLinks: BookingLink[]): BookingLink[] {
  return bookingLinks.map((link) => ({
    ...link,
    affiliateUrl: toAffiliateLink(link.originalUrl, link.provider),
  }))
}

/**
 * Check if any affiliate programs are configured
 */
export function hasAnyAffiliateConfigured(): boolean {
  return Object.values(affiliateConfigs).some((config) => config.isConfigured)
}

/**
 * Get list of configured affiliate providers
 */
export function getConfiguredProviders(): string[] {
  return Object.entries(affiliateConfigs)
    .filter(([, config]) => config.isConfigured)
    .map(([provider]) => provider)
}

/**
 * Check if a specific provider has affiliate configured
 */
export function isProviderConfigured(provider: string): boolean {
  const normalized = normalizeProviderName(provider)
  return affiliateConfigs[normalized]?.isConfigured ?? false
}

/**
 * Get the effective URL for a booking link (affiliate if available, original otherwise)
 */
export function getEffectiveBookingUrl(link: BookingLink): string {
  return link.affiliateUrl || link.originalUrl
}

/**
 * Commission information for display purposes
 */
export interface CommissionInfo {
  provider: string
  commissionRange: string
  cookieDuration: string
  notes: string
}

export const COMMISSION_INFO: Record<string, CommissionInfo> = {
  "Booking.com": {
    provider: "Booking.com",
    commissionRange: "25-40%",
    cookieDuration: "Session",
    notes: "Tiered by monthly volume (of Booking's margin)",
  },
  "Expedia": {
    provider: "Expedia",
    commissionRange: "4-6%",
    cookieDuration: "7 days",
    notes: "Higher for bundles (hotel+flight)",
  },
  "Hotels.com": {
    provider: "Hotels.com",
    commissionRange: "4%",
    cookieDuration: "7 days",
    notes: "Part of Expedia Group",
  },
  "Agoda": {
    provider: "Agoda",
    commissionRange: "4-7%",
    cookieDuration: "30 days",
    notes: "Strong in Asia/Europe",
  },
}
