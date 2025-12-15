/**
 * PDF Generation Logic
 * Server-side PDF generation using @react-pdf/renderer
 */

import { renderToBuffer } from '@react-pdf/renderer'
import type { GeneratedPlan } from '@/types/plan'
import { TravelrPDFDocument } from './components/PDFDocument'
import { generateStaticMapUrl } from './utils/static-map'
import { getDestinationImage } from './utils/destination-image'

export interface GeneratePDFOptions {
  includeMap?: boolean
  includeHeroImage?: boolean
}

/**
 * Generate a PDF buffer from a travel plan
 */
export async function generateTravelPDF(
  plan: GeneratedPlan,
  options: GeneratePDFOptions = {}
): Promise<Buffer> {
  const { includeMap = true, includeHeroImage = true } = options

  // Get hero image
  let heroImage: string | null = null
  if (includeHeroImage) {
    try {
      heroImage = await getDestinationImage(plan)
    } catch (error) {
      console.error('Error getting destination image:', error)
    }
  }

  // Generate static map URL
  let staticMapUrl: string | null = null
  if (includeMap) {
    try {
      staticMapUrl = generateStaticMapUrl(plan)
    } catch (error) {
      console.error('Error generating static map URL:', error)
    }
  }

  // Render PDF to buffer
  const buffer = await renderToBuffer(
    TravelrPDFDocument({
      plan,
      heroImage,
      staticMapUrl,
    })
  )

  return buffer
}

/**
 * Generate a filename for the PDF
 */
export function generatePDFFilename(plan: GeneratedPlan): string {
  const title = plan.summary.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)

  const date = new Date().toISOString().split('T')[0]

  return `${title}-itinerary-${date}.pdf`
}
