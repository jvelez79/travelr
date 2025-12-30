import { NextRequest, NextResponse } from "next/server"
import { logAIRequest } from "@/lib/ai/logging"
import {
  buildFlightExtractionPrompt,
  parseMultiFlightExtractionResponse,
} from "@/lib/ai/prompts-flight"

const DEFAULT_MODEL = "claude-sonnet-4-20250514"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

type MediaType = "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | "image/gif"

const ALLOWED_TYPES: MediaType[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const tripId = formData.get("tripId") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!tripId) {
      return NextResponse.json(
        { error: "No tripId provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const mediaType = file.type as MediaType
    if (!ALLOWED_TYPES.includes(mediaType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: PDF, JPEG, PNG, WebP, GIF` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // Build the content based on file type
    // PDF uses "document" type, images use "image" type
    const contentType = mediaType === "application/pdf" ? "document" : "image"

    const content = [
      {
        type: contentType,
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64,
        },
      },
      {
        type: "text",
        text: buildFlightExtractionPrompt(),
      },
    ]

    // Call Claude API with vision
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
            content,
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
        endpoint: '/api/flights/extract',
        provider: 'anthropic',
        model,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'error',
        errorMessage: errorText,
        metadata: { tripId, fileType: mediaType, fileSize: file.size },
      }).catch(console.error)

      return NextResponse.json(
        { error: `AI extraction failed: ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiResponse = data.content?.[0]?.text

    // Log successful request
    logAIRequest({
      endpoint: '/api/flights/extract',
      provider: 'anthropic',
      model,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      durationMs,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'success',
      metadata: { tripId, fileType: mediaType, fileSize: file.size },
    }).catch(console.error)

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    // Parse the extraction response (multi-flight format)
    const extractedData = parseMultiFlightExtractionResponse(aiResponse)

    // Check for extraction errors
    if (extractedData.error) {
      return NextResponse.json(
        {
          error: extractedData.error === "not_flight_confirmation"
            ? "The uploaded file does not appear to be a flight confirmation"
            : "Failed to parse the extracted data",
          extracted: extractedData,
        },
        { status: 400 }
      )
    }

    // Check if any flights were extracted
    if (extractedData.flights.length === 0) {
      return NextResponse.json(
        {
          error: "No flights could be extracted from the document",
          extracted: extractedData,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      flightCount: extractedData.flights.length,
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error("Extract flight error:", error)

    // Log error
    logAIRequest({
      endpoint: '/api/flights/extract',
      provider: 'anthropic',
      model,
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
    }).catch(console.error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
