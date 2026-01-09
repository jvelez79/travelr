/**
 * Travel Agent Tools Module
 *
 * Defines the tools available to the AI Travel Agent for modifying the itinerary.
 * This module contains:
 * 1. Tool schemas for Anthropic Messages API
 * 2. Tool execution functions (to be implemented in Milestone 3)
 */

import type { TravelAgentTool } from '@/types/ai-agent'

/**
 * Tool definitions for Anthropic Messages API
 *
 * These schemas define what tools the AI can use and their parameters.
 * The AI will analyze user intent and decide which tool to call.
 */
export const TRAVEL_AGENT_TOOLS: TravelAgentTool[] = [
  {
    name: 'add_activity_to_day',
    description: `Adds a tourism activity to a specific day's timeline.

USE FOR: attractions, restaurants, tours, transportation, beaches, museums, cafes, parks, etc.

DO NOT USE FOR: hotels, hostels, accommodations, lodging, check-in/check-out.
For lodging, use add_accommodation instead - hotels are NOT activities.

FORBIDDEN activity names: "Check-in at...", "Hotel...", "Llegada al hotel", "Hospedaje..."`,
    input_schema: {
      type: 'object',
      properties: {
        dayNumber: {
          type: 'number',
          description: 'The day number (1-based index) to add the activity to. Example: 1 for Day 1, 2 for Day 2, etc.',
        },
        activity: {
          type: 'object',
          description: 'The activity details to add',
          properties: {
            time: {
              type: 'string',
              description: 'Start time in HH:MM format (24-hour). Example: "09:00", "14:30", "19:00"',
            },
            activity: {
              type: 'string',
              description: 'Name of the activity. Be specific. Example: "Lunch at Café Central", "Visit Museo del Oro", "Snorkeling tour"',
            },
            location: {
              type: 'string',
              description: 'Location name or address. Be specific. Example: "Plaza Mayor", "Parque Nacional Volcán Arenal", "Downtown"',
            },
            icon: {
              type: 'string',
              description: 'Emoji icon representing the activity type. Examples: "🍽️" for meals, "🏛️" for museums, "🏖️" for beach, "🚶" for walking',
            },
            notes: {
              type: 'string',
              description: 'Optional additional notes or instructions for the activity',
            },
          },
          required: ['time', 'activity', 'location', 'icon'],
        },
      },
      required: ['dayNumber', 'activity'],
    },
  },
  {
    name: 'update_activity',
    description: 'Updates properties of an existing activity (time, notes, duration) without creating a new one. IMPORTANT: Use this tool (NOT add_activity_to_day) when the user wants to change the time, update notes, or modify any property of an existing activity. This preserves the Google Place data and other existing properties.',
    input_schema: {
      type: 'object',
      properties: {
        activityIdentifier: {
          type: 'string',
          description: 'Identifier for the activity to update. Can be the activity name or a description that matches the timeline entry. Example: "Teatro Nacional", "lunch", "museum visit"',
        },
        dayNumber: {
          type: 'number',
          description: 'The day number where the activity is located (1-based index)',
        },
        updates: {
          type: 'object',
          description: 'The properties to update. Only include properties that need to change.',
          properties: {
            time: {
              type: 'string',
              description: 'New start time in HH:MM format (24-hour). Example: "09:00", "14:30", "19:00"',
            },
            notes: {
              type: 'string',
              description: 'New notes or description for the activity',
            },
            durationMinutes: {
              type: 'number',
              description: 'New duration in minutes. Example: 60, 90, 120',
            },
          },
        },
      },
      required: ['activityIdentifier', 'dayNumber', 'updates'],
    },
  },
  {
    name: 'move_activity',
    description: 'Moves an existing activity from one day to another day. Use this when the user wants to move an activity to a DIFFERENT day. For changing time within the SAME day, use update_activity instead.',
    input_schema: {
      type: 'object',
      properties: {
        activityIdentifier: {
          type: 'string',
          description: 'Identifier for the activity to move. Can be the activity name or a description that matches the timeline entry. Example: "lunch", "museum visit", "snorkeling"',
        },
        currentDay: {
          type: 'number',
          description: 'The current day number where the activity is located',
        },
        newDayNumber: {
          type: 'number',
          description: 'The destination day number to move the activity to',
        },
        newTime: {
          type: 'string',
          description: 'New start time in HH:MM format. Example: "09:00", "14:30"',
        },
      },
      required: ['activityIdentifier', 'currentDay', 'newDayNumber', 'newTime'],
    },
  },
  {
    name: 'remove_activity',
    description: 'Removes an activity from the itinerary. IMPORTANT: For destructive actions affecting multiple items, you MUST set requireConfirmation=true and ask the user to confirm before executing.',
    input_schema: {
      type: 'object',
      properties: {
        activityIdentifier: {
          type: 'string',
          description: 'Identifier for the activity to remove. Can be the activity name or description. Example: "lunch", "museum visit"',
        },
        dayNumber: {
          type: 'number',
          description: 'The day number where the activity is located',
        },
        requireConfirmation: {
          type: 'boolean',
          description: 'Set to true if this action requires explicit user confirmation before executing. MUST be true for: deleting multiple activities, clearing entire days, removing important activities.',
        },
      },
      required: ['activityIdentifier', 'dayNumber', 'requireConfirmation'],
    },
  },
  {
    name: 'get_day_details',
    description: 'Retrieves the current schedule and details for a specific day. Use this BEFORE making changes to understand the current state and avoid conflicts.',
    input_schema: {
      type: 'object',
      properties: {
        dayNumber: {
          type: 'number',
          description: 'The day number to retrieve details for (1-based index)',
        },
      },
      required: ['dayNumber'],
    },
  },
  {
    name: 'search_place_by_name',
    description: 'Search for a specific place by name using Google Places API. Use when the user mentions a specific restaurant, attraction, or location by name. IMPORTANT: Always use this tool to validate a place exists before mentioning it by name.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Name of the place to search for. Example: "Parque Nacional Manuel Antonio", "Café de los Deseos", "Volcán Arenal"',
        },
        regionHint: {
          type: 'string',
          description: 'Optional region hint to narrow results. Example: "San Jose, Costa Rica", "Manuel Antonio"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_places_nearby',
    description: 'Search for places by category near a location using Google Places API. Returns up to 5 places sorted by rating. Use when the user asks for recommendations (e.g., "restaurants for dinner", "attractions to visit").',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['restaurants', 'attractions', 'cafes', 'bars', 'museums', 'nature', 'landmarks', 'beaches'],
          description: 'Category of places to search for',
        },
        keywords: {
          type: 'string',
          description: 'Optional keywords to refine search. Examples: "italian", "seafood", "family-friendly", "romantic"',
        },
        location: {
          type: 'object',
          description: 'Location to search near (lat/lng). If not provided, will use trip destination center.',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
        radiusMeters: {
          type: 'number',
          description: 'Search radius in meters. Default: 5000 (5km)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return. Default: 5, max: 10',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_place_details',
    description: 'Get detailed information about a specific place using its Google Place ID. Use this to get more info about a place the user is interested in.',
    input_schema: {
      type: 'object',
      properties: {
        placeId: {
          type: 'string',
          description: 'Google Place ID of the place to get details for',
        },
      },
      required: ['placeId'],
    },
  },
  {
    name: 'calculate_travel_time',
    description: 'Calculate travel time and distance between two locations using Google Distance Matrix API. Use when the user asks about travel time, distance, or "how long does it take to get from X to Y".',
    input_schema: {
      type: 'object',
      properties: {
        origin: {
          type: 'object',
          description: 'Starting location',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            placeId: { type: 'string', description: 'Google Place ID (preferred over coordinates)' },
          },
        },
        destination: {
          type: 'object',
          description: 'Ending location',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            placeId: { type: 'string', description: 'Google Place ID (preferred over coordinates)' },
          },
        },
        mode: {
          type: 'string',
          enum: ['driving', 'walking', 'transit', 'bicycling'],
          description: 'Travel mode. Default: driving',
        },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'ask_for_clarification',
    description: 'Ask the user a clarifying question when their request is ambiguous or missing critical information. Use this instead of making assumptions.',
    input_schema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The clarifying question to ask the user. Be specific about what information you need. Example: "Which day would you like to add the restaurant to?" or "What time would you prefer for the museum visit?"',
        },
        context: {
          type: 'string',
          description: 'Optional context about why you need clarification. Example: "I found multiple restaurants in the area"',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'get_saved_ideas',
    description: 'Retrieves the list of saved ideas (Things To Do / Ideas guardadas) for this trip. These are places the user has saved from the Explore page but not yet added to their itinerary. Use this to see what places the user has bookmarked.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'add_saved_idea_to_day',
    description: 'Adds a saved idea from the Things To Do list to a specific day in the itinerary. This preserves all Google Place data (photos, rating, address, etc.) and removes the idea from the saved list after adding it.',
    input_schema: {
      type: 'object',
      properties: {
        ideaIdentifier: {
          type: 'string',
          description: 'Name or partial name of the saved idea to add. Example: "Catarata", "Volcán Arenal", "Manuel Antonio"',
        },
        dayNumber: {
          type: 'number',
          description: 'The day number (1-based index) to add the activity to',
        },
        time: {
          type: 'string',
          description: 'Start time in HH:MM format (24-hour). Example: "09:00", "14:30". If not specified, will use "Por definir"',
        },
      },
      required: ['ideaIdentifier', 'dayNumber'],
    },
  },
  {
    name: 'remove_saved_idea',
    description: 'Removes an idea from the saved ideas list (Things To Do) without adding it to the itinerary. Use when the user no longer wants to consider a saved place.',
    input_schema: {
      type: 'object',
      properties: {
        ideaIdentifier: {
          type: 'string',
          description: 'Name or partial name of the saved idea to remove. Example: "Catarata", "Volcán"',
        },
      },
      required: ['ideaIdentifier'],
    },
  },
  // ============================================================================
  // ACCOMMODATION MANAGEMENT TOOLS
  // ============================================================================
  {
    name: 'search_accommodations',
    description: 'Search for hotels and accommodations using Google Places API. Use when the user asks to find hotels, lodging, or places to stay. Returns real hotels with ratings, prices, and booking info.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for accommodations. Example: "hotels in Antigua Guatemala", "hostels near La Fortuna", "beachfront resorts Manuel Antonio"',
        },
        checkIn: {
          type: 'string',
          description: 'Optional check-in date in YYYY-MM-DD format. Used to filter available accommodations.',
        },
        checkOut: {
          type: 'string',
          description: 'Optional check-out date in YYYY-MM-DD format. Used to filter available accommodations.',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return. Default: 5, max: 10',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_accommodation',
    description: 'Adds an accommodation/hotel to the trip plan. IMPORTANT: Use this tool (NOT add_activity_to_day) when adding hotels, hostels, or any lodging. Accommodations are managed separately from daily activities.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the accommodation. Example: "Hotel Museo Casa Santo Domingo"',
        },
        type: {
          type: 'string',
          enum: ['hotel', 'airbnb', 'hostel', 'resort', 'vacation_rental', 'apartment', 'other'],
          description: 'Type of accommodation',
        },
        area: {
          type: 'string',
          description: 'Area or neighborhood where the accommodation is located. Example: "Antigua Guatemala", "La Fortuna"',
        },
        checkIn: {
          type: 'string',
          description: 'Check-in date in YYYY-MM-DD format',
        },
        checkOut: {
          type: 'string',
          description: 'Check-out date in YYYY-MM-DD format',
        },
        pricePerNight: {
          type: 'number',
          description: 'Optional price per night in the specified currency',
        },
        currency: {
          type: 'string',
          description: 'Currency code. Default: USD',
        },
        googlePlaceId: {
          type: 'string',
          description: 'Google Place ID if the accommodation was found via search. This enables rich data like photos, ratings, etc.',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the accommodation',
        },
      },
      required: ['name', 'type', 'area', 'checkIn', 'checkOut'],
    },
  },
  {
    name: 'update_accommodation',
    description: 'Updates an existing accommodation in the trip plan. Use to change dates, status, prices, or notes.',
    input_schema: {
      type: 'object',
      properties: {
        accommodationIdentifier: {
          type: 'string',
          description: 'Name or partial name of the accommodation to update. Example: "Santo Domingo", "Hostel"',
        },
        updates: {
          type: 'object',
          description: 'The properties to update. Only include properties that need to change.',
          properties: {
            checkIn: {
              type: 'string',
              description: 'New check-in date in YYYY-MM-DD format',
            },
            checkOut: {
              type: 'string',
              description: 'New check-out date in YYYY-MM-DD format',
            },
            pricePerNight: {
              type: 'number',
              description: 'New price per night',
            },
            status: {
              type: 'string',
              enum: ['suggested', 'pending', 'confirmed', 'cancelled'],
              description: 'New status for the accommodation',
            },
            notes: {
              type: 'string',
              description: 'New notes for the accommodation',
            },
          },
        },
      },
      required: ['accommodationIdentifier', 'updates'],
    },
  },
  {
    name: 'remove_accommodation',
    description: 'Removes an accommodation from the trip plan. IMPORTANT: For destructive actions, you MUST set requireConfirmation=true.',
    input_schema: {
      type: 'object',
      properties: {
        accommodationIdentifier: {
          type: 'string',
          description: 'Name or partial name of the accommodation to remove. Example: "Santo Domingo", "Hostel"',
        },
        requireConfirmation: {
          type: 'boolean',
          description: 'Set to true to require explicit user confirmation before removing. Should be true for confirmed or pending accommodations.',
        },
      },
      required: ['accommodationIdentifier', 'requireConfirmation'],
    },
  },
  {
    name: 'get_accommodations',
    description: 'Retrieves the list of current accommodations in the trip plan. Shows all hotels/lodging with their dates, status, and coverage gaps.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

/**
 * Get tool definition by name
 */
export function getToolByName(name: string): TravelAgentTool | undefined {
  return TRAVEL_AGENT_TOOLS.find(tool => tool.name === name)
}

/**
 * Validate tool input against schema
 * Returns true if valid, false otherwise
 */
export function validateToolInput(
  toolName: string,
  input: Record<string, unknown>
): boolean {
  const tool = getToolByName(toolName)
  if (!tool) return false

  // Check all required fields are present
  const requiredFields = tool.input_schema.required || []
  for (const field of requiredFields) {
    if (!(field in input)) {
      console.error(`[validateToolInput] Missing required field: ${field}`)
      return false
    }
  }

  return true
}

// ============================================================================
// TOOL EXECUTION FUNCTIONS
// Implemented in Milestone 3
// ============================================================================

import type { ToolExecutionContext } from '@/types/ai-agent'
import type { GeneratedPlan, TimelineEntry } from '@/types/plan'

// Keywords that indicate accommodation (should use accommodation tools instead)
const ACCOMMODATION_KEYWORDS = [
  'hotel', 'hostel', 'airbnb', 'resort', 'motel', 'lodge', 'villa', 'cabin',
  'check-in', 'check-out', 'checkout', 'checkin',
  'hospedaje', 'alojamiento', 'lodging', 'accommodation',
  'llegada al hotel', 'salida del hotel'
]

/**
 * Check if an activity name indicates it's actually an accommodation
 */
function isAccommodationActivity(activityName: string): boolean {
  const lowerName = activityName.toLowerCase()
  return ACCOMMODATION_KEYWORDS.some(keyword => lowerName.includes(keyword))
}

/**
 * Execute add_activity_to_day tool
 *
 * Adds a new activity to a specific day in the itinerary
 */
async function executeAddActivity(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const dayNumber = input.dayNumber as number
  const activity = input.activity as {
    time: string
    activity: string
    location: string
    icon: string
    notes?: string
  }

  // VALIDATION: Reject accommodation-related activities
  if (isAccommodationActivity(activity.activity)) {
    return `❌ Error: "${activity.activity}" parece ser un hospedaje/hotel.

Los hoteles y hospedajes NO son actividades del timeline - tienen su propia sección separada.

**Usa el tool correcto:**
- Para agregar un hotel: usa \`add_accommodation\`
- Para buscar hoteles: usa \`search_accommodations\`
- Para ver hospedajes: usa \`get_accommodations\`

Los hospedajes aparecen en la sección "Alojamientos", no en el timeline de actividades diarias.`
  }

  // 1. Validate day exists
  const day = context.plan.itinerary.find(d => d.day === dayNumber)
  if (!day) {
    return `Error: Day ${dayNumber} does not exist in the itinerary. The trip has ${context.plan.itinerary.length} days.`
  }

  // 2. Create new timeline entry
  const newEntry: TimelineEntry = {
    id: `activity-${Date.now()}`,
    time: activity.time,
    activity: activity.activity,
    location: activity.location,
    icon: activity.icon,
    notes: activity.notes,
    durationMinutes: 90, // Default duration
  }

  // 3. Add to timeline
  day.timeline.push(newEntry)

  // 4. Sort timeline by time
  day.timeline.sort((a, b) => {
    // Handle "Por definir" or invalid times by putting them at the end
    if (a.time === "Por definir" || !a.time) return 1
    if (b.time === "Por definir" || !b.time) return -1
    return a.time.localeCompare(b.time)
  })

  // 5. Update plan in Supabase - only filter by trip_id (which is unique)
  const { error, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id')

  if (error) {
    console.error('[executeAddActivity] Error updating plan:', error)
    return `Error: Failed to save the activity. Please try again.`
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('[executeAddActivity] No rows updated! Trip ID:', context.tripId)
    return `Error: Failed to save the activity. No matching plan found.`
  }

  return `Successfully added "${activity.activity}" at ${activity.time} on Day ${dayNumber} (${day.title}). The activity has been added to your itinerary.`
}

/**
 * Execute update_activity tool
 *
 * Updates properties of an existing activity (time, notes, duration)
 * while preserving the existing activity data (including Google Place info)
 */
async function executeUpdateActivity(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const activityIdentifier = (input.activityIdentifier as string).toLowerCase()
  const dayNumber = input.dayNumber as number
  const updates = input.updates as {
    time?: string
    notes?: string
    durationMinutes?: number
  }

  // 1. Validate day exists
  const day = context.plan.itinerary.find(d => d.day === dayNumber)
  if (!day) {
    return `Error: Day ${dayNumber} does not exist in the itinerary. The trip has ${context.plan.itinerary.length} days.`
  }

  // 2. Find activity to update
  const activityIndex = day.timeline.findIndex(entry =>
    entry.activity.toLowerCase().includes(activityIdentifier) ||
    entry.location.toLowerCase().includes(activityIdentifier)
  )

  if (activityIndex === -1) {
    return `Error: Could not find an activity matching "${activityIdentifier}" on Day ${dayNumber}. Available activities: ${day.timeline.map(e => e.activity).join(', ')}`
  }

  const activity = day.timeline[activityIndex]
  const originalTime = activity.time

  // 3. Apply updates (preserve all existing properties)
  if (updates.time !== undefined) {
    activity.time = updates.time
  }
  if (updates.notes !== undefined) {
    activity.notes = updates.notes
  }
  if (updates.durationMinutes !== undefined) {
    activity.durationMinutes = updates.durationMinutes
  }

  // 4. Re-sort timeline by time if time was changed
  if (updates.time !== undefined) {
    day.timeline.sort((a, b) => {
      if (a.time === "Por definir" || !a.time) return 1
      if (b.time === "Por definir" || !b.time) return -1
      return a.time.localeCompare(b.time)
    })
  }

  // 5. Update plan in Supabase - only filter by trip_id (which is unique)
  const { error, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id')

  if (error) {
    console.error('[executeUpdateActivity] Error updating plan:', error)
    return `Error: Failed to update the activity. Please try again.`
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('[executeUpdateActivity] No rows updated! Trip ID:', context.tripId)
    return `Error: Failed to update the activity. No matching plan found.`
  }

  // 6. Build response message
  const changedFields: string[] = []
  if (updates.time !== undefined) {
    changedFields.push(`time from ${originalTime} to ${updates.time}`)
  }
  if (updates.notes !== undefined) {
    changedFields.push(`notes`)
  }
  if (updates.durationMinutes !== undefined) {
    changedFields.push(`duration to ${updates.durationMinutes} minutes`)
  }

  return `Successfully updated "${activity.activity}" on Day ${dayNumber}: changed ${changedFields.join(', ')}.`
}

/**
 * Execute get_day_details tool
 *
 * Returns the current schedule for a specific day
 */
async function executeGetDayDetails(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const dayNumber = input.dayNumber as number

  // 1. Validate day exists
  const day = context.plan.itinerary.find(d => d.day === dayNumber)
  if (!day) {
    return `Error: Day ${dayNumber} does not exist in the itinerary. The trip has ${context.plan.itinerary.length} days.`
  }

  // 2. Format timeline for AI
  if (day.timeline.length === 0) {
    return `Day ${dayNumber} (${day.title}) - ${day.subtitle || 'No activities yet'}\n\nThe schedule is currently empty. No activities have been added yet.`
  }

  const formattedTimeline = day.timeline
    .map((entry, idx) => {
      const time = entry.time || "Por definir"
      const duration = entry.durationMinutes ? ` (${entry.durationMinutes} min)` : ''
      const notes = entry.notes ? `\n   Notes: ${entry.notes}` : ''
      return `${idx + 1}. ${time}${duration} - ${entry.icon || ''} ${entry.activity} @ ${entry.location}${notes}`
    })
    .join('\n')

  // 3. Identify free time blocks
  const busyTimes = day.timeline
    .filter(entry => entry.time && entry.time !== "Por definir")
    .map(entry => entry.time)
    .sort()

  let freeTimeInfo = ''
  if (busyTimes.length > 0) {
    const firstActivity = busyTimes[0]
    const lastActivity = busyTimes[busyTimes.length - 1]
    freeTimeInfo = `\n\nBusy times: ${firstActivity} - ${lastActivity} (${busyTimes.length} activities)`
  }

  return `Day ${dayNumber} (${day.title}) - ${day.subtitle || ''}\n\nCurrent Schedule:\n${formattedTimeline}${freeTimeInfo}`
}

/**
 * Execute move_activity tool
 *
 * Moves an activity from one day to another
 */
async function executeMoveActivity(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const activityIdentifier = (input.activityIdentifier as string).toLowerCase()
  const currentDay = input.currentDay as number
  const newDayNumber = input.newDayNumber as number
  const newTime = input.newTime as string

  // 1. Validate days exist
  const sourceDay = context.plan.itinerary.find(d => d.day === currentDay)
  if (!sourceDay) {
    return `Error: Day ${currentDay} does not exist in the itinerary.`
  }

  const targetDay = context.plan.itinerary.find(d => d.day === newDayNumber)
  if (!targetDay) {
    return `Error: Day ${newDayNumber} does not exist in the itinerary.`
  }

  // 2. Find activity to move
  const activityIndex = sourceDay.timeline.findIndex(entry =>
    entry.activity.toLowerCase().includes(activityIdentifier) ||
    entry.location.toLowerCase().includes(activityIdentifier)
  )

  if (activityIndex === -1) {
    return `Error: Could not find an activity matching "${activityIdentifier}" on Day ${currentDay}. Available activities: ${sourceDay.timeline.map(e => e.activity).join(', ')}`
  }

  const activityToMove = sourceDay.timeline[activityIndex]

  // 3. Check for time conflicts in target day
  const conflictingActivity = targetDay.timeline.find(entry =>
    entry.time === newTime && entry.time !== "Por definir"
  )

  if (conflictingActivity) {
    return `Warning: There is already an activity at ${newTime} on Day ${newDayNumber} (${conflictingActivity.activity}). Please choose a different time or confirm you want to proceed.`
  }

  // 4. Remove from source day
  sourceDay.timeline.splice(activityIndex, 1)

  // 5. Add to target day with new time
  const movedActivity: TimelineEntry = {
    ...activityToMove,
    time: newTime,
  }
  targetDay.timeline.push(movedActivity)

  // 6. Sort both timelines
  sourceDay.timeline.sort((a, b) => {
    if (a.time === "Por definir" || !a.time) return 1
    if (b.time === "Por definir" || !b.time) return -1
    return a.time.localeCompare(b.time)
  })

  targetDay.timeline.sort((a, b) => {
    if (a.time === "Por definir" || !a.time) return 1
    if (b.time === "Por definir" || !b.time) return -1
    return a.time.localeCompare(b.time)
  })

  // 7. Update plan in Supabase - only filter by trip_id (which is unique)
  const { error, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id')

  if (error) {
    console.error('[executeMoveActivity] Error updating plan:', error)
    return `Error: Failed to move the activity. Please try again.`
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('[executeMoveActivity] No rows updated! Trip ID:', context.tripId)
    return `Error: Failed to move the activity. No matching plan found.`
  }

  return `Successfully moved "${activityToMove.activity}" from Day ${currentDay} to Day ${newDayNumber} at ${newTime}.`
}

/**
 * Execute remove_activity tool
 *
 * Removes an activity from a day (with optional confirmation)
 */
async function executeRemoveActivity(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const activityIdentifier = (input.activityIdentifier as string).toLowerCase()
  const dayNumber = input.dayNumber as number
  const requireConfirmation = input.requireConfirmation as boolean

  console.log('[executeRemoveActivity] Input:', { activityIdentifier, dayNumber, requireConfirmation })
  console.log('[executeRemoveActivity] Available days:', context.plan.itinerary.map(d => ({ day: d.day, date: d.date, title: d.title })))

  // 1. Validate day exists - check by day number (1-based index)
  const dayIndex = context.plan.itinerary.findIndex(d => d.day === dayNumber)
  const day = dayIndex >= 0 ? context.plan.itinerary[dayIndex] : null

  if (!day) {
    const availableDays = context.plan.itinerary.map(d => `Day ${d.day} (${d.date})`).join(', ')
    return `Error: Day ${dayNumber} does not exist in the itinerary. Available days: ${availableDays}`
  }

  console.log('[executeRemoveActivity] Found day:', { day: day.day, date: day.date, timelineCount: day.timeline.length })

  // 2. Find activity to remove
  const activityIndex = day.timeline.findIndex(entry =>
    entry.activity.toLowerCase().includes(activityIdentifier) ||
    entry.location.toLowerCase().includes(activityIdentifier)
  )

  if (activityIndex === -1) {
    const availableActivities = day.timeline.map(e => `"${e.activity}" (${e.time})`).join(', ')
    return `Error: Could not find an activity matching "${activityIdentifier}" on Day ${dayNumber}. Available activities on this day: ${availableActivities}`
  }

  const activityToRemove = day.timeline[activityIndex]
  console.log('[executeRemoveActivity] Found activity to remove:', {
    activity: activityToRemove.activity,
    time: activityToRemove.time,
    index: activityIndex
  })

  // 3. If confirmation required, return confirmation request
  if (requireConfirmation) {
    return `CONFIRMATION_REQUIRED: Are you sure you want to remove "${activityToRemove.activity}" (${activityToRemove.time}) from Day ${dayNumber}? This action cannot be undone. Please confirm if you'd like to proceed.`
  }

  // 4. Remove the activity from the timeline
  context.plan.itinerary[dayIndex].timeline.splice(activityIndex, 1)

  // Also increment the plan's internal version
  const newVersion = (context.plan.version || 1) + 1
  context.plan.version = newVersion
  context.plan.updatedAt = new Date().toISOString()

  console.log('[executeRemoveActivity] Timeline after removal:', context.plan.itinerary[dayIndex].timeline.length, 'activities')

  // 5. Update plan in Supabase - only filter by trip_id (which is unique)
  const { error, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id, version')

  if (error) {
    console.error('[executeRemoveActivity] Error updating plan:', error)
    return `Error: Failed to remove the activity. Database error: ${error.message}`
  }

  // Check if any rows were actually updated
  if (!updateResult || updateResult.length === 0) {
    console.error('[executeRemoveActivity] No rows updated! Trip ID:', context.tripId)
    return `Error: Failed to update the plan. No matching plan found for this trip.`
  }

  console.log('[executeRemoveActivity] Plan updated successfully:', updateResult)

  return `Successfully removed "${activityToRemove.activity}" from Day ${dayNumber} (${day.date}).`
}

/**
 * Execute ask_for_clarification tool
 *
 * Simply returns the clarification question to be shown to the user
 */
async function executeAskForClarification(
  input: Record<string, unknown>,
  _context: ToolExecutionContext
): Promise<string> {
  const question = input.question as string
  const context = input.context as string | undefined

  if (context) {
    return `${question}\n\nContext: ${context}`
  }

  return question
}

/**
 * Execute search_place_by_name tool
 *
 * Searches for a specific place by name using Google Places API
 */
async function executeSearchPlaceByName(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const query = input.query as string
  const regionHint = input.regionHint as string | undefined

  // Use trip destination as region hint if not provided
  const searchRegion = regionHint || context.plan.trip.destination

  try {
    // Dynamic import to avoid circular dependencies
    const { searchPlaceByName } = await import('@/lib/explore/google-places')

    const results = await searchPlaceByName(query, searchRegion)

    if (results.length === 0) {
      return `No encontré ningún lugar llamado "${query}" en ${searchRegion}. ¿Podrías verificar el nombre o intentar con un término de búsqueda diferente?`
    }

    // Convert to PlaceSearchResult format and return as JSON for ChatMessage to render
    const places = results.slice(0, 5).map(place => ({
      id: place.id,
      name: place.name,
      category: place.category,
      rating: place.rating,
      reviewCount: place.reviewCount,
      priceLevel: place.priceLevel,
      imageUrl: place.images?.[0],
      address: place.location.address,
      description: place.description,
      location: {
        lat: place.location.lat,
        lng: place.location.lng,
      },
    }))

    // Return JSON in a code block that ChatMessage can detect and render
    return `Encontré ${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}":\n\n\`\`\`places\n${JSON.stringify(places, null, 2)}\n\`\`\``
  } catch (error) {
    console.error('[executeSearchPlaceByName] Error:', error)
    return `Error al buscar "${query}". Por favor intenta de nuevo.`
  }
}

/**
 * Execute search_places_nearby tool
 *
 * Searches for places by category near a location
 */
async function executeSearchPlacesNearby(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const category = input.category as string
  const keywords = input.keywords as string | undefined
  const location = input.location as { lat: number; lng: number } | undefined
  const radiusMeters = (input.radiusMeters as number) || 5000
  const maxResults = Math.min((input.maxResults as number) || 5, 10)

  try {
    // Dynamic import to avoid circular dependencies
    const { searchPlacesByCategory } = await import('@/lib/explore/google-places')

    // Build search query with keywords if provided
    const searchQuery = keywords
      ? `${keywords} ${category}`
      : category

    // Use provided location or trip destination center
    const searchLocation = location || {
      lat: 0, // Will be replaced with trip destination coordinates
      lng: 0,
    }

    // If no location provided, we need destination coordinates
    // For now, we'll use a placeholder - in production this should come from trip data
    if (!location) {
      // TODO: Get actual destination coordinates from trip data
      return `Para buscar lugares cercanos, necesito saber la ubicación. ¿Me puedes especificar el área o día donde estás buscando ${category}?`
    }

    const results = await searchPlacesByCategory(
      context.plan.trip.destination,
      category as any, // Cast to PlaceCategory
      searchLocation,
      radiusMeters
    )

    if (results.places.length === 0) {
      return `No encontré ${category} cerca de la ubicación especificada. ¿Quieres ampliar el área de búsqueda?`
    }

    // Convert to PlaceSearchResult format
    const places = results.places.slice(0, maxResults).map(place => ({
      id: place.id,
      name: place.name,
      category: place.category,
      rating: place.rating,
      reviewCount: place.reviewCount,
      priceLevel: place.priceLevel,
      imageUrl: place.images?.[0],
      address: place.location.address,
      description: place.description,
      location: {
        lat: place.location.lat,
        lng: place.location.lng,
      },
    }))

    return `Encontré ${places.length} ${category} cerca:\n\n\`\`\`places\n${JSON.stringify(places, null, 2)}\n\`\`\``
  } catch (error) {
    console.error('[executeSearchPlacesNearby] Error:', error)
    return `Error al buscar ${category}. Por favor intenta de nuevo.`
  }
}

/**
 * Execute get_place_details tool
 *
 * Gets detailed information about a specific place
 */
async function executeGetPlaceDetails(
  input: Record<string, unknown>,
  _context: ToolExecutionContext
): Promise<string> {
  const placeId = input.placeId as string

  try {
    // Dynamic import to avoid circular dependencies
    const { getPlaceDetails } = await import('@/lib/explore/google-places')

    const place = await getPlaceDetails(placeId)

    if (!place) {
      return `No pude obtener los detalles del lugar. El ID podría ser inválido.`
    }

    // Return detailed info as formatted text
    let details = `**${place.name}**\n\n`

    if (place.rating) {
      details += `⭐ ${place.rating}/5 (${place.reviewCount || 0} reseñas)\n`
    }

    if (place.priceLevel) {
      details += `💰 ${"$".repeat(place.priceLevel)}\n`
    }

    if (place.location.address) {
      details += `📍 ${place.location.address}\n`
    }

    if (place.description) {
      details += `\n${place.description}\n`
    }

    if (place.openingHours && place.openingHours.length > 0) {
      details += `\n**Horarios:**\n${place.openingHours.join('\n')}\n`
    }

    if (place.phone) {
      details += `\n📞 ${place.phone}\n`
    }

    if (place.website) {
      details += `\n🌐 ${place.website}\n`
    }

    return details
  } catch (error) {
    console.error('[executeGetPlaceDetails] Error:', error)
    return `Error al obtener detalles del lugar. Por favor intenta de nuevo.`
  }
}

/**
 * Execute calculate_travel_time tool
 *
 * Calculates travel time between two locations
 */
async function executeCalculateTravelTime(
  input: Record<string, unknown>,
  _context: ToolExecutionContext
): Promise<string> {
  const origin = input.origin as { lat?: number; lng?: number; placeId?: string }
  const destination = input.destination as { lat?: number; lng?: number; placeId?: string }
  const mode = (input.mode as 'driving' | 'walking' | 'transit' | 'bicycling') || 'driving'

  try {
    // Dynamic import to avoid circular dependencies
    const { calculateTravelTime } = await import('@/lib/places/distance-matrix')

    const result = await calculateTravelTime(origin, destination, mode)

    if (!result) {
      return `No pude calcular el tiempo de viaje. Verifica que las ubicaciones sean válidas.`
    }

    const modeText = {
      driving: 'en auto',
      walking: 'caminando',
      transit: 'en transporte público',
      bicycling: 'en bicicleta',
    }[mode]

    return `⏱️ Tiempo de viaje ${modeText}: **${result.durationText}** (${result.distanceText})`
  } catch (error) {
    console.error('[executeCalculateTravelTime] Error:', error)
    return `Error al calcular el tiempo de viaje. Por favor intenta de nuevo.`
  }
}

/**
 * Execute get_saved_ideas tool
 *
 * Retrieves the list of saved ideas (Things To Do) for this trip
 */
async function executeGetSavedIdeas(
  _input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  // Query the trip_things_to_do table
  const { data: items, error } = await context.supabase
    .from('trip_things_to_do')
    .select('id, google_place_id, place_data, category, created_at')
    .eq('trip_id', context.tripId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[executeGetSavedIdeas] Error:', error)
    return 'Error: Failed to retrieve saved ideas. Please try again.'
  }

  if (!items || items.length === 0) {
    return 'No saved ideas found. The user has not saved any places from the Explore page yet.'
  }

  // Format the ideas list
  const formattedItems = items.map((item, idx) => {
    const placeData = item.place_data as {
      name: string
      formatted_address?: string
      rating?: number
      types?: string[]
    }
    const category = item.category || 'uncategorized'
    const rating = placeData.rating ? `★${placeData.rating.toFixed(1)}` : ''
    const address = placeData.formatted_address || ''

    return `${idx + 1}. **${placeData.name}** ${rating}
   Category: ${category}
   ${address ? `Address: ${address}` : ''}`
  }).join('\n\n')

  return `Found ${items.length} saved idea${items.length !== 1 ? 's' : ''} (Things To Do):\n\n${formattedItems}\n\nYou can add any of these to a specific day using add_saved_idea_to_day tool.`
}

/**
 * Execute add_saved_idea_to_day tool
 *
 * Adds a saved idea to a specific day in the itinerary, preserving Google Place data
 */
async function executeAddSavedIdeaToDay(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const ideaIdentifier = (input.ideaIdentifier as string).toLowerCase()
  const dayNumber = input.dayNumber as number
  const time = (input.time as string) || 'Por definir'

  // 1. Find the saved idea
  const { data: items, error: fetchError } = await context.supabase
    .from('trip_things_to_do')
    .select('*')
    .eq('trip_id', context.tripId)

  if (fetchError) {
    console.error('[executeAddSavedIdeaToDay] Error fetching ideas:', fetchError)
    return 'Error: Failed to retrieve saved ideas. Please try again.'
  }

  if (!items || items.length === 0) {
    return 'Error: No saved ideas found. The user needs to save places from the Explore page first.'
  }

  // Find matching idea
  const matchingIdea = items.find(item => {
    const placeData = item.place_data as { name: string }
    return placeData.name.toLowerCase().includes(ideaIdentifier)
  })

  if (!matchingIdea) {
    const availableNames = items.map(item => (item.place_data as { name: string }).name).join(', ')
    return `Error: Could not find a saved idea matching "${ideaIdentifier}". Available ideas: ${availableNames}`
  }

  const placeData = matchingIdea.place_data as {
    name: string
    formatted_address?: string
    rating?: number
    user_ratings_total?: number
    photos?: Array<{ photo_reference: string }>
    geometry?: { location: { lat: number; lng: number } }
    editorial_summary?: { overview: string }
  }

  // 2. Validate day exists
  const day = context.plan.itinerary.find(d => d.day === dayNumber)
  if (!day) {
    return `Error: Day ${dayNumber} does not exist in the itinerary. The trip has ${context.plan.itinerary.length} days.`
  }

  // 3. Create new timeline entry with full Google Place data
  const newEntry: TimelineEntry = {
    id: `activity-${Date.now()}`,
    time: time,
    activity: placeData.name,
    location: placeData.formatted_address || context.plan.trip.destination,
    icon: getCategoryIcon(matchingIdea.category),
    notes: placeData.editorial_summary?.overview,
    durationMinutes: 120, // Default 2 hours for attractions
    // Preserve Google Place data using the correct fields
    placeId: matchingIdea.google_place_id,
    placeData: {
      name: placeData.name,
      category: matchingIdea.category as any, // Category from saved idea
      rating: placeData.rating,
      reviewCount: placeData.user_ratings_total,
      coordinates: placeData.geometry?.location || { lat: 0, lng: 0 },
      address: placeData.formatted_address,
      images: placeData.photos?.map(p => p.photo_reference),
    },
  }

  // 4. Add to timeline
  day.timeline.push(newEntry)

  // 5. Sort timeline by time
  day.timeline.sort((a, b) => {
    if (a.time === 'Por definir' || !a.time) return 1
    if (b.time === 'Por definir' || !b.time) return -1
    return a.time.localeCompare(b.time)
  })

  // 6. Update plan in Supabase - only filter by trip_id (which is unique)
  const { error: updateError, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id')

  if (updateError) {
    console.error('[executeAddSavedIdeaToDay] Error updating plan:', updateError)
    return 'Error: Failed to add the activity to the itinerary. Please try again.'
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('[executeAddSavedIdeaToDay] No rows updated! Trip ID:', context.tripId)
    return 'Error: Failed to add the activity. No matching plan found.'
  }

  // 7. Remove from saved ideas
  const { error: deleteError } = await context.supabase
    .from('trip_things_to_do')
    .delete()
    .eq('id', matchingIdea.id)

  if (deleteError) {
    console.error('[executeAddSavedIdeaToDay] Warning: Failed to remove from saved ideas:', deleteError)
    // Don't fail the operation, just log the warning
  }

  const timeDisplay = time === 'Por definir' ? 'time to be defined' : time
  return `Successfully added "${placeData.name}" to Day ${dayNumber} (${day.title}) at ${timeDisplay}. The place has been removed from your saved ideas list.`
}

/**
 * Execute remove_saved_idea tool
 *
 * Removes an idea from the saved ideas list without adding it to the itinerary
 */
async function executeRemoveSavedIdea(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const ideaIdentifier = (input.ideaIdentifier as string).toLowerCase()

  // 1. Find the saved idea
  const { data: items, error: fetchError } = await context.supabase
    .from('trip_things_to_do')
    .select('*')
    .eq('trip_id', context.tripId)

  if (fetchError) {
    console.error('[executeRemoveSavedIdea] Error fetching ideas:', fetchError)
    return 'Error: Failed to retrieve saved ideas. Please try again.'
  }

  if (!items || items.length === 0) {
    return 'Error: No saved ideas found. The list is already empty.'
  }

  // Find matching idea
  const matchingIdea = items.find(item => {
    const placeData = item.place_data as { name: string }
    return placeData.name.toLowerCase().includes(ideaIdentifier)
  })

  if (!matchingIdea) {
    const availableNames = items.map(item => (item.place_data as { name: string }).name).join(', ')
    return `Error: Could not find a saved idea matching "${ideaIdentifier}". Available ideas: ${availableNames}`
  }

  const placeName = (matchingIdea.place_data as { name: string }).name

  // 2. Remove from saved ideas
  const { error: deleteError } = await context.supabase
    .from('trip_things_to_do')
    .delete()
    .eq('id', matchingIdea.id)

  if (deleteError) {
    console.error('[executeRemoveSavedIdea] Error:', deleteError)
    return 'Error: Failed to remove the idea. Please try again.'
  }

  return `Successfully removed "${placeName}" from your saved ideas list.`
}

// ============================================================================
// ACCOMMODATION MANAGEMENT TOOL IMPLEMENTATIONS
// ============================================================================

import type { Accommodation, AccommodationType, AccommodationStatus } from '@/types/accommodation'
import { calculateNights, findAccommodationGaps } from '@/types/accommodation'

/**
 * Execute search_accommodations tool
 *
 * Searches for hotels/accommodations using Google Places API
 */
async function executeSearchAccommodations(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const query = input.query as string
  const maxResults = Math.min((input.maxResults as number) || 5, 10)

  try {
    // Dynamic import to avoid circular dependencies
    const { searchPlaceByName } = await import('@/lib/explore/google-places')

    // Search for lodging using the destination as region hint
    const searchQuery = query.toLowerCase().includes('hotel') || query.toLowerCase().includes('hostel')
      ? query
      : `hotels ${query}`

    const results = await searchPlaceByName(searchQuery, context.plan.trip.destination)

    if (!results || results.length === 0) {
      return `No encontré alojamientos para "${query}". Intenta con un término de búsqueda diferente o una ubicación más específica.`
    }

    // Limit results
    const limitedResults = results.slice(0, maxResults)

    // Format results for display
    const formattedResults = limitedResults.map((place, idx) => {
      const rating = place.rating ? `★${place.rating.toFixed(1)}` : 'Sin calificación'
      const reviews = place.reviewCount ? `(${place.reviewCount} reseñas)` : ''
      const priceLevel = place.priceLevel ? '$'.repeat(place.priceLevel) : ''

      return `${idx + 1}. **${place.name}** ${rating} ${reviews} ${priceLevel}
   📍 ${place.location.address || 'Dirección no disponible'}
   🆔 Place ID: ${place.id}`
    }).join('\n\n')

    // Also return as JSON for potential rich rendering
    const placesJson = limitedResults.map(place => ({
      id: place.id,
      name: place.name,
      rating: place.rating,
      reviewCount: place.reviewCount,
      priceLevel: place.priceLevel,
      address: place.location.address,
      imageUrl: place.images?.[0],
      coordinates: {
        lat: place.location.lat,
        lng: place.location.lng,
      },
    }))

    return `Encontré ${limitedResults.length} alojamiento${limitedResults.length !== 1 ? 's' : ''} para "${query}":\n\n${formattedResults}\n\n\`\`\`accommodations\n${JSON.stringify(placesJson, null, 2)}\n\`\`\`\n\nPuedes agregar cualquiera de estos usando el tool add_accommodation con el nombre y Google Place ID.`
  } catch (error) {
    console.error('[executeSearchAccommodations] Error:', error)
    return `Error al buscar alojamientos. Por favor intenta de nuevo.`
  }
}

/**
 * Execute add_accommodation tool
 *
 * Adds an accommodation to the trip plan
 */
async function executeAddAccommodation(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const name = input.name as string
  const type = input.type as AccommodationType
  const area = input.area as string
  const checkIn = input.checkIn as string
  const checkOut = input.checkOut as string
  const pricePerNight = input.pricePerNight as number | undefined
  const currency = (input.currency as string) || 'USD'
  const googlePlaceId = input.googlePlaceId as string | undefined
  const notes = input.notes as string | undefined

  // Validate dates are within trip range
  const tripStart = context.plan.trip.startDate
  const tripEnd = context.plan.trip.endDate

  if (checkIn < tripStart || checkOut > tripEnd) {
    return `Error: Las fechas del hospedaje (${checkIn} - ${checkOut}) están fuera del rango del viaje (${tripStart} - ${tripEnd}). Por favor ajusta las fechas.`
  }

  // Calculate nights
  const nights = calculateNights(checkIn, checkOut)
  if (nights <= 0) {
    return `Error: La fecha de check-out (${checkOut}) debe ser posterior a la fecha de check-in (${checkIn}).`
  }

  // Create new accommodation
  const now = new Date().toISOString()
  const newAccommodation: Accommodation = {
    id: `acc-${Date.now()}`,
    name,
    type,
    area,
    checkIn,
    checkOut,
    nights,
    pricePerNight,
    totalPrice: pricePerNight ? pricePerNight * nights : undefined,
    currency,
    googlePlaceId,
    origin: 'ai_suggestion',
    status: 'pending',
    source: 'ai_generated',
    notes,
    createdAt: now,
    updatedAt: now,
  }

  // If we have a googlePlaceId, try to get place details
  if (googlePlaceId) {
    try {
      const { getPlaceDetails } = await import('@/lib/explore/google-places')
      const placeDetails = await getPlaceDetails(googlePlaceId)

      if (placeDetails) {
        newAccommodation.placeData = {
          name: placeDetails.name,
          rating: placeDetails.rating,
          reviewCount: placeDetails.reviewCount,
          coordinates: {
            lat: placeDetails.location.lat,
            lng: placeDetails.location.lng,
          },
          address: placeDetails.location.address,
          images: placeDetails.images,
          website: placeDetails.website,
          phone: placeDetails.phone,
        }
      }
    } catch (error) {
      console.error('[executeAddAccommodation] Error fetching place details:', error)
      // Continue without place data
    }
  }

  // Initialize accommodations array if needed
  if (!context.plan.accommodations) {
    context.plan.accommodations = []
  }

  // Add to plan
  context.plan.accommodations.push(newAccommodation)

  // Update plan in Supabase
  const { error, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id')

  if (error) {
    console.error('[executeAddAccommodation] Error updating plan:', error)
    return `Error: No se pudo guardar el hospedaje. Por favor intenta de nuevo.`
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('[executeAddAccommodation] No rows updated! Trip ID:', context.tripId)
    return `Error: No se pudo guardar el hospedaje. No se encontró el plan.`
  }

  const priceInfo = pricePerNight ? ` ($${pricePerNight}/noche, total ~$${pricePerNight * nights})` : ''
  return `✅ Hospedaje agregado exitosamente:\n\n**${name}**\n📍 ${area}\n📅 ${checkIn} → ${checkOut} (${nights} noche${nights !== 1 ? 's' : ''})${priceInfo}\n\nEl hospedaje aparecerá en la sección "Alojamientos" del plan.`
}

/**
 * Execute update_accommodation tool
 *
 * Updates an existing accommodation
 */
async function executeUpdateAccommodation(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const accommodationIdentifier = (input.accommodationIdentifier as string).toLowerCase()
  const updates = input.updates as {
    checkIn?: string
    checkOut?: string
    pricePerNight?: number
    status?: AccommodationStatus
    notes?: string
  }

  // Get accommodations from plan
  const accommodations = context.plan.accommodations || []

  if (accommodations.length === 0) {
    return `Error: No hay hospedajes en el plan. Primero agrega uno con add_accommodation.`
  }

  // Find the accommodation
  const accommodationIndex = accommodations.findIndex(acc =>
    acc.name.toLowerCase().includes(accommodationIdentifier) ||
    acc.area.toLowerCase().includes(accommodationIdentifier)
  )

  if (accommodationIndex === -1) {
    const availableNames = accommodations.map(a => a.name).join(', ')
    return `Error: No se encontró un hospedaje que coincida con "${accommodationIdentifier}". Hospedajes disponibles: ${availableNames}`
  }

  const accommodation = accommodations[accommodationIndex]
  const originalValues: string[] = []

  // Apply updates
  if (updates.checkIn !== undefined) {
    originalValues.push(`check-in de ${accommodation.checkIn} a ${updates.checkIn}`)
    accommodation.checkIn = updates.checkIn
  }

  if (updates.checkOut !== undefined) {
    originalValues.push(`check-out de ${accommodation.checkOut} a ${updates.checkOut}`)
    accommodation.checkOut = updates.checkOut
  }

  // Recalculate nights if dates changed
  if (updates.checkIn !== undefined || updates.checkOut !== undefined) {
    accommodation.nights = calculateNights(accommodation.checkIn, accommodation.checkOut)
    if (accommodation.pricePerNight) {
      accommodation.totalPrice = accommodation.pricePerNight * accommodation.nights
    }
  }

  if (updates.pricePerNight !== undefined) {
    originalValues.push(`precio de $${accommodation.pricePerNight || 0} a $${updates.pricePerNight}/noche`)
    accommodation.pricePerNight = updates.pricePerNight
    accommodation.totalPrice = updates.pricePerNight * accommodation.nights
  }

  if (updates.status !== undefined) {
    originalValues.push(`estado de "${accommodation.status}" a "${updates.status}"`)
    accommodation.status = updates.status
  }

  if (updates.notes !== undefined) {
    originalValues.push(`notas`)
    accommodation.notes = updates.notes
  }

  accommodation.updatedAt = new Date().toISOString()

  // Update in accommodations array
  context.plan.accommodations![accommodationIndex] = accommodation

  // Update plan in Supabase
  const { error, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id')

  if (error) {
    console.error('[executeUpdateAccommodation] Error updating plan:', error)
    return `Error: No se pudo actualizar el hospedaje. Por favor intenta de nuevo.`
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('[executeUpdateAccommodation] No rows updated! Trip ID:', context.tripId)
    return `Error: No se pudo actualizar el hospedaje. No se encontró el plan.`
  }

  return `✅ Hospedaje "${accommodation.name}" actualizado: ${originalValues.join(', ')}.`
}

/**
 * Execute remove_accommodation tool
 *
 * Removes an accommodation from the plan
 */
async function executeRemoveAccommodation(
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const accommodationIdentifier = (input.accommodationIdentifier as string).toLowerCase()
  const requireConfirmation = input.requireConfirmation as boolean

  // Get accommodations from plan
  const accommodations = context.plan.accommodations || []

  if (accommodations.length === 0) {
    return `Error: No hay hospedajes en el plan para eliminar.`
  }

  // Find the accommodation
  const accommodationIndex = accommodations.findIndex(acc =>
    acc.name.toLowerCase().includes(accommodationIdentifier) ||
    acc.area.toLowerCase().includes(accommodationIdentifier)
  )

  if (accommodationIndex === -1) {
    const availableNames = accommodations.map(a => a.name).join(', ')
    return `Error: No se encontró un hospedaje que coincida con "${accommodationIdentifier}". Hospedajes disponibles: ${availableNames}`
  }

  const accommodation = accommodations[accommodationIndex]

  // If confirmation required, return confirmation request
  if (requireConfirmation) {
    return `CONFIRMATION_REQUIRED: ¿Estás seguro de que quieres eliminar "${accommodation.name}" (${accommodation.checkIn} - ${accommodation.checkOut})? Esta acción no se puede deshacer. Por favor confirma si deseas proceder.`
  }

  // Remove from accommodations array
  context.plan.accommodations!.splice(accommodationIndex, 1)

  // Update plan in Supabase
  const { error, data: updateResult } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .select('id')

  if (error) {
    console.error('[executeRemoveAccommodation] Error updating plan:', error)
    return `Error: No se pudo eliminar el hospedaje. Por favor intenta de nuevo.`
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('[executeRemoveAccommodation] No rows updated! Trip ID:', context.tripId)
    return `Error: No se pudo eliminar el hospedaje. No se encontró el plan.`
  }

  return `✅ Hospedaje "${accommodation.name}" eliminado del plan.`
}

/**
 * Execute get_accommodations tool
 *
 * Returns the current list of accommodations with coverage info
 */
async function executeGetAccommodations(
  _input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  // Get accommodations from plan
  const accommodations = context.plan.accommodations || []

  if (accommodations.length === 0) {
    return `No hay hospedajes en el plan actualmente. Puedes buscar hoteles con search_accommodations o agregar uno manualmente con add_accommodation.`
  }

  // Group by status
  const byStatus = {
    confirmed: accommodations.filter(a => a.status === 'confirmed'),
    pending: accommodations.filter(a => a.status === 'pending'),
    suggested: accommodations.filter(a => a.status === 'suggested'),
    cancelled: accommodations.filter(a => a.status === 'cancelled'),
  }

  // Format accommodations list
  const formatAccommodation = (acc: Accommodation) => {
    const price = acc.pricePerNight ? `$${acc.pricePerNight}/noche` : 'Precio no definido'
    const total = acc.totalPrice ? `(Total: $${acc.totalPrice})` : ''
    return `- **${acc.name}** (${acc.type})
    📍 ${acc.area}
    📅 ${acc.checkIn} → ${acc.checkOut} (${acc.nights} noche${acc.nights !== 1 ? 's' : ''})
    💰 ${price} ${total}`
  }

  let response = `**Hospedajes del viaje** (${accommodations.length} total)\n\n`

  if (byStatus.confirmed.length > 0) {
    response += `### ✅ Confirmados (${byStatus.confirmed.length})\n`
    response += byStatus.confirmed.map(formatAccommodation).join('\n\n')
    response += '\n\n'
  }

  if (byStatus.pending.length > 0) {
    response += `### ⏳ Pendientes (${byStatus.pending.length})\n`
    response += byStatus.pending.map(formatAccommodation).join('\n\n')
    response += '\n\n'
  }

  if (byStatus.suggested.length > 0) {
    response += `### 💡 Sugerencias AI (${byStatus.suggested.length})\n`
    response += byStatus.suggested.map(formatAccommodation).join('\n\n')
    response += '\n\n'
  }

  // Check for coverage gaps
  const gaps = findAccommodationGaps(
    context.plan.trip.startDate,
    context.plan.trip.endDate,
    accommodations
  )

  if (gaps.length > 0) {
    response += `### ⚠️ Noches sin hospedaje\n`
    gaps.forEach(gap => {
      const gapNights = calculateNights(gap.startDate, gap.endDate)
      response += `- ${gap.startDate} → ${gap.endDate} (${gapNights} noche${gapNights !== 1 ? 's' : ''})\n`
    })
  } else {
    response += `### ✅ Cobertura completa\nTodas las noches del viaje tienen hospedaje asignado.`
  }

  return response
}

/**
 * Helper function to get icon based on category
 */
function getCategoryIcon(category: string | null): string {
  switch (category) {
    case 'attractions':
      return '🏛️'
    case 'food_drink':
      return '🍽️'
    case 'tours':
      return '🚐'
    case 'activities':
      return '🎯'
    default:
      return '📍'
  }
}

/**
 * Main tool execution router
 *
 * Routes tool calls to their respective implementation functions
 */
export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  console.log(`[executeToolCall] Tool: ${toolName}, Input:`, toolInput)

  try {
    switch (toolName) {
      case 'add_activity_to_day':
        return await executeAddActivity(toolInput, context)

      case 'update_activity':
        return await executeUpdateActivity(toolInput, context)

      case 'get_day_details':
        return await executeGetDayDetails(toolInput, context)

      case 'move_activity':
        return await executeMoveActivity(toolInput, context)

      case 'remove_activity':
        return await executeRemoveActivity(toolInput, context)

      case 'ask_for_clarification':
        return await executeAskForClarification(toolInput, context)

      case 'search_place_by_name':
        return await executeSearchPlaceByName(toolInput, context)

      case 'search_places_nearby':
        return await executeSearchPlacesNearby(toolInput, context)

      case 'get_place_details':
        return await executeGetPlaceDetails(toolInput, context)

      case 'calculate_travel_time':
        return await executeCalculateTravelTime(toolInput, context)

      case 'get_saved_ideas':
        return await executeGetSavedIdeas(toolInput, context)

      case 'add_saved_idea_to_day':
        return await executeAddSavedIdeaToDay(toolInput, context)

      case 'remove_saved_idea':
        return await executeRemoveSavedIdea(toolInput, context)

      // Accommodation management tools
      case 'search_accommodations':
        return await executeSearchAccommodations(toolInput, context)

      case 'add_accommodation':
        return await executeAddAccommodation(toolInput, context)

      case 'update_accommodation':
        return await executeUpdateAccommodation(toolInput, context)

      case 'remove_accommodation':
        return await executeRemoveAccommodation(toolInput, context)

      case 'get_accommodations':
        return await executeGetAccommodations(toolInput, context)

      default:
        return `Error: Unknown tool "${toolName}"`
    }
  } catch (error) {
    console.error(`[executeToolCall] Error executing ${toolName}:`, error)
    return `Error: Failed to execute ${toolName}. ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
