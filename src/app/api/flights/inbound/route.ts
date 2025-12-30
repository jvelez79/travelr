import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { logAIRequest } from "@/lib/ai/logging"
import {
  buildEmailFlightExtractionPrompt,
  parseFlightExtractionResponse,
} from "@/lib/ai/prompts-flight"

const DEFAULT_MODEL = "claude-sonnet-4-20250514"

/**
 * Resend Inbound Email Webhook for Flights
 *
 * This endpoint receives forwarded emails from Resend's inbound feature.
 * Email address format: trip-{tripId}@inbound.travelr.app
 *
 * Setup instructions:
 * 1. Configure a domain in Resend for inbound emails
 * 2. Set up a webhook pointing to this endpoint
 * 3. Add RESEND_WEBHOOK_SECRET to environment variables
 */

interface ResendInboundPayload {
  from: string
  to: string[]
  subject: string
  text: string
  html?: string
  date: string
  messageId: string
  attachments?: Array<{
    filename: string
    contentType: string
    content: string // base64
  }>
}

/**
 * Verify the webhook signature from Resend
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Extract tripId from the email address
 * Format: trip-{tripId}@inbound.travelr.app
 */
function extractTripIdFromEmail(email: string): string | null {
  const match = email.match(/trip-([a-z0-9-]+)@/i)
  return match ? match[1] : null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL
  let tripId: string | null = null

  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    const apiKey = process.env.ANTHROPIC_API_KEY

    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify webhook signature (skip in development if no secret)
    if (webhookSecret) {
      const signature = req.headers.get("resend-signature") || req.headers.get("x-resend-signature")
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid webhook signature")
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        )
      }
    }

    // Parse the payload
    const payload: ResendInboundPayload = JSON.parse(rawBody)

    // Extract tripId from the "to" email address
    const toEmail = payload.to[0]
    tripId = extractTripIdFromEmail(toEmail)

    if (!tripId) {
      console.error("Could not extract tripId from email:", toEmail)
      return NextResponse.json(
        { error: "Invalid trip email address" },
        { status: 400 }
      )
    }

    console.log(`Processing inbound flight email for trip: ${tripId}`)
    console.log(`From: ${payload.from}`)
    console.log(`Subject: ${payload.subject}`)

    // Check if we have API key for AI extraction
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured")
      return NextResponse.json(
        { error: "AI extraction not configured" },
        { status: 500 }
      )
    }

    // Build the extraction prompt
    const extractionPrompt = buildEmailFlightExtractionPrompt(
      payload.text,
      payload.html
    )

    // Call Claude API to extract flight data
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: extractionPrompt,
          },
        ],
      }),
    })

    const durationMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Anthropic API error:", errorText)

      // Log failed request
      logAIRequest({
        endpoint: '/api/flights/inbound',
        provider: 'anthropic',
        model,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'error',
        errorMessage: errorText,
        metadata: { tripId, source: 'email_forward' },
      }).catch(console.error)

      return NextResponse.json(
        { error: "AI extraction failed" },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiResponse = data.content?.[0]?.text

    // Log successful request
    logAIRequest({
      endpoint: '/api/flights/inbound',
      provider: 'anthropic',
      model,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      durationMs,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'success',
      metadata: { tripId, source: 'email_forward' },
    }).catch(console.error)

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    // Parse the extraction response
    const extractedData = parseFlightExtractionResponse(aiResponse)

    // Check for extraction errors
    if (extractedData.error) {
      console.log("Extraction failed:", extractedData.error)
      return NextResponse.json({
        success: false,
        error: extractedData.error === "not_flight_confirmation"
          ? "Email does not appear to be a flight confirmation"
          : "Failed to extract flight data",
        tripId,
      })
    }

    // Create the flight reservation object
    const flight = {
      id: `flight-${Date.now()}`,
      type: extractedData.type || 'outbound',
      origin: extractedData.origin || '',
      originCity: extractedData.originCity || '',
      destination: extractedData.destination || '',
      destinationCity: extractedData.destinationCity || '',
      date: extractedData.date || '',
      arrivalDate: extractedData.arrivalDate,
      departureTime: extractedData.departureTime || '',
      arrivalTime: extractedData.arrivalTime || '',
      airline: extractedData.airline || '',
      confirmationNumber: extractedData.confirmationNumber,
      pricePerPerson: extractedData.pricePerPerson,
      source: 'email_forward' as const,
      sourceData: {
        rawEmailId: payload.messageId,
        extractedAt: new Date().toISOString(),
        confidence: extractedData.confidence,
      },
    }

    console.log("Successfully extracted flight:", {
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      date: flight.date,
      confirmationNumber: flight.confirmationNumber,
    })

    // TODO: Store the flight in database (Supabase)
    // For now, we'll return it and the client can poll/store it
    // In production, you would:
    // 1. Save to database
    // 2. Trigger a real-time notification via Supabase Realtime
    // 3. Send a confirmation email back to the user

    return NextResponse.json({
      success: true,
      tripId,
      flight,
      message: "Flight extracted successfully",
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error("Inbound email processing error:", error)

    // Log error
    logAIRequest({
      endpoint: '/api/flights/inbound',
      provider: 'anthropic',
      model,
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: { tripId, source: 'email_forward' },
    }).catch(console.error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * Health check for the webhook
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "flights/inbound",
    description: "Resend inbound email webhook for flight extraction",
  })
}
