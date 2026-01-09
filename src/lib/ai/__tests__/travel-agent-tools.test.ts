/**
 * Unit tests for Travel Agent Tools Module
 */

import { describe, it, expect } from 'vitest'
import { TRAVEL_AGENT_TOOLS, getToolByName, validateToolInput } from '../travel-agent-tools'

describe('TRAVEL_AGENT_TOOLS', () => {
  it('should have 6 tools defined', () => {
    expect(TRAVEL_AGENT_TOOLS).toHaveLength(6)
  })

  it('should have all required tools', () => {
    const toolNames = TRAVEL_AGENT_TOOLS.map(t => t.name)
    expect(toolNames).toContain('add_activity_to_day')
    expect(toolNames).toContain('move_activity')
    expect(toolNames).toContain('remove_activity')
    expect(toolNames).toContain('get_day_details')
    expect(toolNames).toContain('search_places')
    expect(toolNames).toContain('ask_for_clarification')
  })

  it('should have valid schemas for all tools', () => {
    TRAVEL_AGENT_TOOLS.forEach(tool => {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.input_schema).toBeTruthy()
      expect(tool.input_schema.type).toBe('object')
      expect(tool.input_schema.properties).toBeTruthy()
      expect(Array.isArray(tool.input_schema.required)).toBe(true)
    })
  })
})

describe('getToolByName', () => {
  it('should return tool by name', () => {
    const tool = getToolByName('add_activity_to_day')
    expect(tool).toBeTruthy()
    expect(tool?.name).toBe('add_activity_to_day')
  })

  it('should return undefined for unknown tool', () => {
    const tool = getToolByName('unknown_tool')
    expect(tool).toBeUndefined()
  })
})

describe('validateToolInput', () => {
  it('should validate add_activity_to_day input', () => {
    const validInput = {
      dayNumber: 2,
      activity: {
        time: '09:00',
        activity: 'Breakfast',
        location: 'Hotel Restaurant',
        icon: '🍳',
      },
    }

    expect(validateToolInput('add_activity_to_day', validInput)).toBe(true)
  })

  it('should reject add_activity_to_day with missing required fields', () => {
    const invalidInput = {
      dayNumber: 2,
      // missing activity
    }

    expect(validateToolInput('add_activity_to_day', invalidInput)).toBe(false)
  })

  it('should validate move_activity input', () => {
    const validInput = {
      activityIdentifier: 'lunch',
      currentDay: 2,
      newDayNumber: 3,
      newTime: '13:00',
    }

    expect(validateToolInput('move_activity', validInput)).toBe(true)
  })

  it('should validate remove_activity input', () => {
    const validInput = {
      activityIdentifier: 'dinner',
      dayNumber: 5,
      requireConfirmation: true,
    }

    expect(validateToolInput('remove_activity', validInput)).toBe(true)
  })

  it('should validate get_day_details input', () => {
    const validInput = {
      dayNumber: 1,
    }

    expect(validateToolInput('get_day_details', validInput)).toBe(true)
  })

  it('should validate search_places input', () => {
    const validInput = {
      query: 'italian restaurants',
    }

    expect(validateToolInput('search_places', validInput)).toBe(true)
  })

  it('should validate ask_for_clarification input', () => {
    const validInput = {
      question: 'Which day would you like?',
    }

    expect(validateToolInput('ask_for_clarification', validInput)).toBe(true)
  })

  it('should reject unknown tool', () => {
    expect(validateToolInput('unknown_tool', {})).toBe(false)
  })
})
