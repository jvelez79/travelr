// Prompts for flight data extraction from receipts/confirmations

import type {
  ExtractedFlightData,
  MultiFlightExtractionResult,
  ExtractedFlightSegment,
  ExtractedDocumentMetadata
} from '@/lib/flights/types'

/**
 * Build prompt for extracting ALL flights from a confirmation document
 * Supports multi-leg itineraries (outbound + connections + return)
 */
export function buildFlightExtractionPrompt(): string {
  return `You are an expert at extracting structured data from airline booking confirmations and e-tickets.

Analyze the provided document (PDF or image) and extract ALL flight segments found.

Return a JSON object with the following structure:
{
  "flights": [
    {
      "airline": "Full airline name (e.g., 'COPA Airlines')",
      "flightNumber": "Flight number without airline code (e.g., '451' for CM451)",
      "origin": "IATA airport code (e.g., 'SJU')",
      "originCity": "Departure city name",
      "destination": "IATA airport code (e.g., 'PTY')",
      "destinationCity": "Arrival city name",
      "date": "YYYY-MM-DD (departure date)",
      "arrivalDate": "YYYY-MM-DD (if arrival is on a different day, otherwise null)",
      "departureTime": "HH:MM AM/PM",
      "arrivalTime": "HH:MM AM/PM",
      "seatNumber": "Seat assignment (if available, can be null)",
      "type": "outbound|return|connection",
      "segmentOrder": 1,
      "pricePerPerson": number or null,
      "confidence": 0.0-1.0
    }
  ],
  "sharedData": {
    "confirmationNumber": "Booking/PNR/confirmation code",
    "passengerNames": ["Full Name 1", "Full Name 2"],
    "totalPrice": number (total for all segments, null if not available),
    "currency": "USD|EUR|CRC|etc"
  },
  "overallConfidence": 0.0-1.0
}

FLIGHT TYPE DETECTION RULES:
1. Analyze the complete trip direction:
   - Identify the "home" airport (first origin in the itinerary)
   - Identify the "final destination" (where the outbound journey ends)
2. Classify each segment:
   - Segments moving TOWARD the destination from home = "outbound"
   - Intermediate stops on outbound journey = "connection"
   - First segment heading BACK toward home = "return"
   - Intermediate stops on return journey = "connection"
3. Use dates and times to determine chronological order
4. segmentOrder must be 1, 2, 3... in chronological travel order

EXAMPLE for SJU → PTY → SJO trip with return:
- SJU → PTY (Nov 23): type="outbound", segmentOrder=1
- PTY → SJO (Nov 23): type="connection", segmentOrder=2
- SJO → PTY (Nov 29): type="return", segmentOrder=3
- PTY → SJU (Nov 29): type="connection", segmentOrder=4

IMPORTANT RULES:
1. Extract ALL flights found in the document, not just the first one
2. If a field cannot be determined, use null
3. Dates MUST be in ISO format (YYYY-MM-DD)
4. Times MUST include AM/PM (e.g., "5:27 AM")
5. Prices MUST be numeric without currency symbols
6. IATA codes MUST be uppercase 3-letter codes
7. Shared data (confirmation, passengers, total price) applies to ALL flights
8. For "flightNumber", extract ONLY the numeric part (e.g., "451" not "CM451")
9. For "airline", use the full name (e.g., "COPA Airlines" not "CM")
10. If single flight found, still return as array with one element
11. If NOT a flight confirmation, return:
    {"error": "not_flight_confirmation", "overallConfidence": 0, "flights": [], "sharedData": {}}

Return ONLY valid JSON, no explanations or markdown.`
}

/**
 * Build prompt for extracting flight data from email text
 */
export function buildEmailFlightExtractionPrompt(emailText: string, emailHtml?: string): string {
  return `You are an expert at extracting structured data from airline booking confirmation emails.

Analyze the following email content and extract ALL flight segments found.

EMAIL TEXT:
${emailText}

${emailHtml ? `HTML VERSION (for additional context):\n${emailHtml.slice(0, 5000)}` : ""}

Return a JSON object with the following structure:
{
  "flights": [
    {
      "airline": "Full airline name",
      "flightNumber": "Flight number without airline code",
      "origin": "IATA airport code",
      "originCity": "Departure city name",
      "destination": "IATA airport code",
      "destinationCity": "Arrival city name",
      "date": "YYYY-MM-DD",
      "arrivalDate": "YYYY-MM-DD (if different day, otherwise null)",
      "departureTime": "HH:MM AM/PM",
      "arrivalTime": "HH:MM AM/PM",
      "seatNumber": "Seat (if available)",
      "type": "outbound|return|connection",
      "segmentOrder": 1,
      "pricePerPerson": number or null,
      "confidence": 0.0-1.0
    }
  ],
  "sharedData": {
    "confirmationNumber": "Booking/PNR code",
    "passengerNames": ["Full Name 1", "Full Name 2"],
    "totalPrice": number or null,
    "currency": "USD|EUR|CRC|etc"
  },
  "overallConfidence": 0.0-1.0
}

FLIGHT TYPE DETECTION:
- First segment toward destination = "outbound"
- Intermediate stops = "connection"
- First segment heading back home = "return"
- segmentOrder = chronological order (1, 2, 3...)

IMPORTANT RULES:
1. Extract ALL flights in the email
2. Dates in ISO format (YYYY-MM-DD)
3. Times with AM/PM
4. IATA codes uppercase (3 letters)
5. Identify airline from sender or content
6. If NOT a flight confirmation:
   {"error": "not_flight_confirmation", "overallConfidence": 0, "flights": [], "sharedData": {}}

Return ONLY valid JSON, no explanations or markdown.`
}

/**
 * Clean markdown code blocks from AI response
 */
function cleanJsonResponse(response: string): string {
  let cleaned = response.trim()
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7)
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3)
  }
  return cleaned.trim()
}

/**
 * Parse the AI response for multi-flight extraction
 */
export function parseMultiFlightExtractionResponse(response: string): MultiFlightExtractionResult {
  try {
    const cleaned = cleanJsonResponse(response)
    const data = JSON.parse(cleaned)

    // Check for error response
    if (data.error) {
      return {
        error: data.error,
        flights: [],
        sharedData: {},
        overallConfidence: data.overallConfidence || 0,
      }
    }

    // Parse flights array
    const flights: ExtractedFlightSegment[] = (data.flights || []).map((f: Record<string, unknown>, index: number) => ({
      airline: (f.airline as string) || undefined,
      flightNumber: (f.flightNumber as string) || undefined,
      origin: ((f.origin as string) || '').toUpperCase() || undefined,
      originCity: (f.originCity as string) || undefined,
      destination: ((f.destination as string) || '').toUpperCase() || undefined,
      destinationCity: (f.destinationCity as string) || undefined,
      date: (f.date as string) || undefined,
      arrivalDate: (f.arrivalDate as string) || undefined,
      departureTime: (f.departureTime as string) || undefined,
      arrivalTime: (f.arrivalTime as string) || undefined,
      seatNumber: (f.seatNumber as string) || undefined,
      type: (f.type as 'outbound' | 'return' | 'connection') || 'outbound',
      segmentOrder: (f.segmentOrder as number) || index + 1,
      pricePerPerson: typeof f.pricePerPerson === 'number' ? f.pricePerPerson : undefined,
      confidence: typeof f.confidence === 'number' ? f.confidence : 0.5,
    }))

    // Parse shared data
    const sharedData: ExtractedDocumentMetadata = {
      confirmationNumber: data.sharedData?.confirmationNumber || undefined,
      passengerNames: Array.isArray(data.sharedData?.passengerNames)
        ? data.sharedData.passengerNames
        : undefined,
      totalPrice: typeof data.sharedData?.totalPrice === 'number'
        ? data.sharedData.totalPrice
        : undefined,
      currency: data.sharedData?.currency || 'USD',
    }

    return {
      flights,
      sharedData,
      overallConfidence: typeof data.overallConfidence === 'number'
        ? data.overallConfidence
        : 0.5,
    }
  } catch (error) {
    console.error("Failed to parse multi-flight extraction response:", error)
    return {
      error: 'parse_error',
      flights: [],
      sharedData: {},
      overallConfidence: 0,
    }
  }
}

/**
 * Parse the AI response for single flight extraction (backward compatibility)
 * @deprecated Use parseMultiFlightExtractionResponse instead
 */
export function parseFlightExtractionResponse(response: string): ExtractedFlightData {
  try {
    const cleaned = cleanJsonResponse(response)
    const data = JSON.parse(cleaned)

    // Check for error response
    if (data.error) {
      return {
        error: data.error,
        confidence: data.confidence || 0,
      }
    }

    // If it's a multi-flight response, extract the first flight
    if (data.flights && Array.isArray(data.flights) && data.flights.length > 0) {
      const firstFlight = data.flights[0]
      return {
        airline: firstFlight.airline || undefined,
        flightNumber: firstFlight.flightNumber || undefined,
        origin: firstFlight.origin?.toUpperCase() || undefined,
        originCity: firstFlight.originCity || undefined,
        destination: firstFlight.destination?.toUpperCase() || undefined,
        destinationCity: firstFlight.destinationCity || undefined,
        date: firstFlight.date || undefined,
        arrivalDate: firstFlight.arrivalDate || undefined,
        departureTime: firstFlight.departureTime || undefined,
        arrivalTime: firstFlight.arrivalTime || undefined,
        confirmationNumber: data.sharedData?.confirmationNumber || undefined,
        passengerNames: data.sharedData?.passengerNames || undefined,
        seatNumber: firstFlight.seatNumber || undefined,
        pricePerPerson: typeof firstFlight.pricePerPerson === "number" ? firstFlight.pricePerPerson : undefined,
        totalPrice: typeof data.sharedData?.totalPrice === "number" ? data.sharedData.totalPrice : undefined,
        currency: data.sharedData?.currency || "USD",
        type: firstFlight.type || undefined,
        confidence: typeof firstFlight.confidence === "number" ? firstFlight.confidence : 0.5,
      }
    }

    // Legacy single-flight format
    return {
      airline: data.airline || undefined,
      flightNumber: data.flightNumber || undefined,
      origin: data.origin?.toUpperCase() || undefined,
      originCity: data.originCity || undefined,
      destination: data.destination?.toUpperCase() || undefined,
      destinationCity: data.destinationCity || undefined,
      date: data.date || undefined,
      arrivalDate: data.arrivalDate || undefined,
      departureTime: data.departureTime || undefined,
      arrivalTime: data.arrivalTime || undefined,
      confirmationNumber: data.confirmationNumber || undefined,
      passengerNames: Array.isArray(data.passengerNames) ? data.passengerNames : undefined,
      seatNumber: data.seatNumber || undefined,
      pricePerPerson: typeof data.pricePerPerson === "number" ? data.pricePerPerson : undefined,
      totalPrice: typeof data.totalPrice === "number" ? data.totalPrice : undefined,
      currency: data.currency || "USD",
      type: data.type || undefined,
      confidence: typeof data.confidence === "number" ? data.confidence : 0.5,
    }
  } catch (error) {
    console.error("Failed to parse flight extraction response:", error)
    return {
      error: "parse_error",
      confidence: 0,
    }
  }
}
