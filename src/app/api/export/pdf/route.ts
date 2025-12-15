/**
 * PDF Export API Route
 * POST /api/export/pdf
 *
 * Generates a PDF from a travel plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateTravelPDF, generatePDFFilename } from '@/lib/pdf'
import type { GeneratedPlan } from '@/types/plan'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, options } = body as {
      plan: GeneratedPlan
      options?: {
        includeMap?: boolean
        includeHeroImage?: boolean
      }
    }

    // Validate plan
    if (!plan || !plan.trip || !plan.itinerary) {
      return NextResponse.json(
        { error: 'Invalid plan data' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateTravelPDF(plan, options)

    // Generate filename
    const filename = generatePDFFilename(plan)

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF as response
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Optionally handle GET for testing
export async function GET() {
  return NextResponse.json(
    {
      message: 'PDF Export API',
      usage: 'POST with { plan: GeneratedPlan } to generate PDF',
    },
    { status: 200 }
  )
}
