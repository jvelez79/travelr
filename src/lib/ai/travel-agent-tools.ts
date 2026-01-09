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
    description: 'Adds a new activity to a specific day in the itinerary. Use this when the user wants to add something to their schedule (restaurant, attraction, activity, etc.)',
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
    name: 'move_activity',
    description: 'Moves an existing activity from one day/time to another. Use this when the user wants to reschedule something.',
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
    name: 'search_places',
    description: 'Search for places near the destination using Google Places API. Use this when the user asks for recommendations or wants to find specific types of places (restaurants, attractions, etc.). NOTE: This tool is not yet fully implemented - use ask_for_clarification to inform the user.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query. Be specific. Examples: "italian restaurants", "coffee shops", "museums", "beaches"',
        },
        category: {
          type: 'string',
          description: 'Optional category filter. Examples: "restaurant", "attraction", "lodging", "cafe"',
        },
        dayNumber: {
          type: 'number',
          description: 'Optional day number context - if searching for places to add to a specific day',
        },
      },
      required: ['query'],
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

  // 5. Update plan in Supabase
  const { error } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .eq('user_id', context.userId)

  if (error) {
    console.error('[executeAddActivity] Error updating plan:', error)
    return `Error: Failed to save the activity. Please try again.`
  }

  return `Successfully added "${activity.activity}" at ${activity.time} on Day ${dayNumber} (${day.title}). The activity has been added to your itinerary.`
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

  // 7. Update plan in Supabase
  const { error } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .eq('user_id', context.userId)

  if (error) {
    console.error('[executeMoveActivity] Error updating plan:', error)
    return `Error: Failed to move the activity. Please try again.`
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

  // 1. Validate day exists
  const day = context.plan.itinerary.find(d => d.day === dayNumber)
  if (!day) {
    return `Error: Day ${dayNumber} does not exist in the itinerary.`
  }

  // 2. Find activity to remove
  const activityIndex = day.timeline.findIndex(entry =>
    entry.activity.toLowerCase().includes(activityIdentifier) ||
    entry.location.toLowerCase().includes(activityIdentifier)
  )

  if (activityIndex === -1) {
    return `Error: Could not find an activity matching "${activityIdentifier}" on Day ${dayNumber}. Available activities: ${day.timeline.map(e => e.activity).join(', ')}`
  }

  const activityToRemove = day.timeline[activityIndex]

  // 3. If confirmation required, return confirmation request
  if (requireConfirmation) {
    return `CONFIRMATION_REQUIRED: Are you sure you want to remove "${activityToRemove.activity}" (${activityToRemove.time}) from Day ${dayNumber}? This action cannot be undone. Please confirm if you'd like to proceed.`
  }

  // 4. Remove the activity
  day.timeline.splice(activityIndex, 1)

  // 5. Update plan in Supabase
  const { error } = await context.supabase
    .from('plans')
    .update({
      data: context.plan as any,
      version: (context.plan.version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('trip_id', context.tripId)
    .eq('user_id', context.userId)

  if (error) {
    console.error('[executeRemoveActivity] Error updating plan:', error)
    return `Error: Failed to remove the activity. Please try again.`
  }

  return `Successfully removed "${activityToRemove.activity}" from Day ${dayNumber}.`
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
 * Execute search_places tool
 *
 * Placeholder for future Google Places integration
 */
async function executeSearchPlaces(
  input: Record<string, unknown>,
  _context: ToolExecutionContext
): Promise<string> {
  const query = input.query as string
  // TODO: Integrate with Google Places API in future milestone
  return `The search feature is not yet fully implemented. However, I can help you add activities manually if you tell me the name, location, and time you'd like to add them. What would you like to add for "${query}"?`
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

      case 'get_day_details':
        return await executeGetDayDetails(toolInput, context)

      case 'move_activity':
        return await executeMoveActivity(toolInput, context)

      case 'remove_activity':
        return await executeRemoveActivity(toolInput, context)

      case 'ask_for_clarification':
        return await executeAskForClarification(toolInput, context)

      case 'search_places':
        return await executeSearchPlaces(toolInput, context)

      default:
        return `Error: Unknown tool "${toolName}"`
    }
  } catch (error) {
    console.error(`[executeToolCall] Error executing ${toolName}:`, error)
    return `Error: Failed to execute ${toolName}. ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
