// Prompts for accommodation data extraction from receipts/confirmations

import type { ExtractedAccommodationData } from "@/types/accommodation"

/**
 * Build prompt for extracting accommodation data from a confirmation document
 */
export function buildAccommodationExtractionPrompt(): string {
  return `You are an expert at extracting structured data from hotel and accommodation booking confirmations.

Analyze the provided document (PDF or image) and extract all relevant booking information.

Return a JSON object with the following structure:
{
  "name": "Exact name of the hotel/accommodation",
  "type": "hotel|airbnb|hostel|resort|vacation_rental|apartment|other",
  "address": "Full street address",
  "city": "City name",
  "country": "Country name",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "checkInTime": "HH:MM AM/PM (if mentioned)",
  "checkOutTime": "HH:MM AM/PM (if mentioned)",
  "pricePerNight": number (without currency symbol, null if not available),
  "totalPrice": number (without currency symbol),
  "currency": "USD|EUR|CRC|MXN|etc",
  "confirmationNumber": "Booking/confirmation number",
  "bookingPlatform": "Booking.com|Expedia|Airbnb|Hotels.com|Agoda|direct|etc",
  "phone": "Hotel phone number (if available)",
  "email": "Hotel email (if available)",
  "guestNames": ["Full Name 1", "Full Name 2"] (names on the reservation),
  "amenities": ["WiFi", "Pool", "Parking", etc] (if mentioned),
  "confidence": 0.0-1.0
}

IMPORTANT RULES:
1. If a field cannot be determined, use null
2. Dates MUST be in ISO format (YYYY-MM-DD)
3. Prices MUST be numeric without currency symbols
4. The "confidence" field (0-1) indicates how confident you are in the overall extraction
5. For "type", infer from the booking platform or hotel name:
   - Airbnb bookings → "airbnb"
   - Booking.com/Expedia/Hotels.com → usually "hotel"
   - If it mentions "hostel" → "hostel"
   - If it mentions "resort" → "resort"
   - Vacation rentals/VRBO → "vacation_rental"
6. Extract ALL guest names mentioned in the reservation
7. If the document is NOT a hotel/accommodation confirmation, return:
   {"error": "not_accommodation_confirmation", "confidence": 0}

Return ONLY valid JSON, no explanations or markdown.`
}

/**
 * Parse the AI response and validate the extracted data
 */
export function parseExtractionResponse(response: string): ExtractedAccommodationData {
  try {
    // Clean up response - remove markdown code blocks if present
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
    cleaned = cleaned.trim()

    const data = JSON.parse(cleaned)

    // Check for error response
    if (data.error) {
      return {
        error: data.error,
        confidence: data.confidence || 0,
      }
    }

    // Validate and normalize the data
    return {
      name: data.name || undefined,
      type: data.type || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      checkIn: data.checkIn || undefined,
      checkOut: data.checkOut || undefined,
      checkInTime: data.checkInTime || undefined,
      checkOutTime: data.checkOutTime || undefined,
      pricePerNight: typeof data.pricePerNight === "number" ? data.pricePerNight : undefined,
      totalPrice: typeof data.totalPrice === "number" ? data.totalPrice : undefined,
      currency: data.currency || "USD",
      confirmationNumber: data.confirmationNumber || undefined,
      bookingPlatform: data.bookingPlatform || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      guestNames: Array.isArray(data.guestNames) ? data.guestNames : undefined,
      amenities: Array.isArray(data.amenities) ? data.amenities : undefined,
      confidence: typeof data.confidence === "number" ? data.confidence : 0.5,
    }
  } catch (error) {
    console.error("Failed to parse extraction response:", error)
    return {
      error: "parse_error",
      confidence: 0,
    }
  }
}

/**
 * Build prompt for extracting accommodation data from email text
 */
export function buildEmailExtractionPrompt(emailText: string, emailHtml?: string): string {
  return `You are an expert at extracting structured data from hotel booking confirmation emails.

Analyze the following email content and extract all relevant booking information.

EMAIL TEXT:
${emailText}

${emailHtml ? `HTML VERSION (for additional context):\n${emailHtml.slice(0, 5000)}` : ""}

Return a JSON object with the following structure:
{
  "name": "Exact name of the hotel/accommodation",
  "type": "hotel|airbnb|hostel|resort|vacation_rental|apartment|other",
  "address": "Full street address",
  "city": "City name",
  "country": "Country name",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "checkInTime": "HH:MM AM/PM (if mentioned)",
  "checkOutTime": "HH:MM AM/PM (if mentioned)",
  "pricePerNight": number (without currency symbol, null if not available),
  "totalPrice": number (without currency symbol),
  "currency": "USD|EUR|CRC|MXN|etc",
  "confirmationNumber": "Booking/confirmation number",
  "bookingPlatform": "Booking.com|Expedia|Airbnb|Hotels.com|Agoda|direct|etc",
  "phone": "Hotel phone number (if available)",
  "email": "Hotel email (if available)",
  "guestNames": ["Full Name 1", "Full Name 2"] (names on the reservation),
  "amenities": ["WiFi", "Pool", "Parking", etc] (if mentioned),
  "confidence": 0.0-1.0
}

IMPORTANT RULES:
1. If a field cannot be determined, use null
2. Dates MUST be in ISO format (YYYY-MM-DD)
3. Prices MUST be numeric without currency symbols
4. The "confidence" field (0-1) indicates how confident you are in the overall extraction
5. Identify the booking platform from the sender email or content
6. Extract ALL guest names mentioned in the reservation
7. If the email is NOT a hotel/accommodation confirmation, return:
   {"error": "not_accommodation_confirmation", "confidence": 0}

Return ONLY valid JSON, no explanations or markdown.`
}
