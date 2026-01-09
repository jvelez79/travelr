/**
 * Unit tests for Travel Agent Prompts Module
 */

import { describe, it, expect } from 'vitest'
import { buildTravelAgentSystemPrompt, buildConversationMessages, formatToolCallForDisplay } from '../travel-agent-prompts'
import type { TripContext } from '@/types/ai-agent'

describe('buildTravelAgentSystemPrompt', () => {
  it('should build a system prompt with trip context', () => {
    const tripContext: TripContext = {
      destination: 'Costa Rica',
      origin: 'Puerto Rico',
      startDate: '2026-12-07',
      endDate: '2026-12-13',
      travelers: 9,
      currentDayCount: 6,
    }

    const prompt = buildTravelAgentSystemPrompt(tripContext)

    // Check that key information is included
    expect(prompt).toContain('Costa Rica')
    expect(prompt).toContain('Puerto Rico')
    expect(prompt).toContain('9 people')
    expect(prompt).toContain('6 days')

    // Check that capabilities are mentioned
    expect(prompt).toContain('add_activity_to_day')
    expect(prompt).toContain('move_activity')
    expect(prompt).toContain('remove_activity')
    expect(prompt).toContain('get_day_details')

    // Check that limitations are mentioned
    expect(prompt).toContain('cannot')
  })

  it('should handle single traveler correctly', () => {
    const tripContext: TripContext = {
      destination: 'Paris',
      origin: 'London',
      startDate: '2026-01-01',
      endDate: '2026-01-03',
      travelers: 1,
      currentDayCount: 2,
    }

    const prompt = buildTravelAgentSystemPrompt(tripContext)
    expect(prompt).toContain('1 person')
  })
})

describe('buildConversationMessages', () => {
  it('should convert history to Anthropic format', () => {
    const history = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
      { role: 'user' as const, content: 'Add a restaurant' },
    ]

    const messages = buildConversationMessages(history, 'Where is it?')

    // Should have 4 messages (3 from history + 1 new)
    expect(messages).toHaveLength(4)

    // Check format
    expect(messages[0]).toEqual({ role: 'user', content: 'Hello' })
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Hi there!' })
    expect(messages[2]).toEqual({ role: 'user', content: 'Add a restaurant' })
    expect(messages[3]).toEqual({ role: 'user', content: 'Where is it?' })
  })

  it('should filter out system messages', () => {
    const history = [
      { role: 'system' as const, content: 'System message' },
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi!' },
    ]

    const messages = buildConversationMessages(history, 'New message')

    // Should have 3 messages (system filtered out, 2 from history + 1 new)
    expect(messages).toHaveLength(3)
    expect(messages.every(m => m.role !== 'system')).toBe(true)
  })

  it('should work with empty history', () => {
    const messages = buildConversationMessages([], 'First message')

    expect(messages).toHaveLength(1)
    expect(messages[0]).toEqual({ role: 'user', content: 'First message' })
  })
})

describe('formatToolCallForDisplay', () => {
  it('should format add_activity_to_day', () => {
    const result = formatToolCallForDisplay('add_activity_to_day', { dayNumber: 3 })
    expect(result).toBe('Added activity to Day 3')
  })

  it('should format move_activity', () => {
    const result = formatToolCallForDisplay('move_activity', { newDayNumber: 5 })
    expect(result).toBe('Moved activity to Day 5')
  })

  it('should format remove_activity', () => {
    const result = formatToolCallForDisplay('remove_activity', {})
    expect(result).toBe('Removed activity')
  })

  it('should format get_day_details', () => {
    const result = formatToolCallForDisplay('get_day_details', { dayNumber: 2 })
    expect(result).toBe('Retrieved Day 2 details')
  })

  it('should format search_places', () => {
    const result = formatToolCallForDisplay('search_places', { query: 'restaurants' })
    expect(result).toBe('Searched for: restaurants')
  })

  it('should handle unknown tool', () => {
    const result = formatToolCallForDisplay('unknown_tool', {})
    expect(result).toBe('Executed unknown_tool')
  })
})
