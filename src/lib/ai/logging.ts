/**
 * AI Request Logging Utility
 *
 * Provides functions to log AI requests to Supabase for monitoring and cost tracking.
 * Logging is asynchronous and non-blocking (fire-and-forget pattern).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { calculateCostCents, getModelForProvider } from './pricing'
import type { AIRequestLogInsert } from '@/types/database'

interface AILogData {
  endpoint: string
  provider: string
  model?: string
  userId?: string
  tripId?: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  startedAt: Date
  completedAt: Date
  status: 'success' | 'error'
  errorMessage?: string
  metadata?: Record<string, unknown>
}

/**
 * Log an AI request to the database
 *
 * This function is designed to be called in a fire-and-forget manner.
 * It should not block the main request flow.
 *
 * @example
 * ```typescript
 * logAIRequest({
 *   endpoint: '/api/ai/generate-day',
 *   provider: 'anthropic',
 *   userId: user.id,
 *   tripId: tripId,
 *   inputTokens: response.usage?.inputTokens ?? 0,
 *   outputTokens: response.usage?.outputTokens ?? 0,
 *   durationMs: Date.now() - startTime,
 *   startedAt: new Date(startTime),
 *   completedAt: new Date(),
 *   status: 'success',
 *   metadata: { dayNumber: 1 }
 * }).catch(console.error)
 * ```
 */
export async function logAIRequest(data: AILogData): Promise<void> {
  try {
    const adminClient = createAdminClient()

    const model = data.model || getModelForProvider(data.provider)
    const costCents = calculateCostCents(model, data.inputTokens, data.outputTokens)

    const insertData: AIRequestLogInsert = {
      request_id: crypto.randomUUID(),
      endpoint: data.endpoint,
      provider: data.provider,
      model: model,
      user_id: data.userId || null,
      trip_id: data.tripId || null,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      cost_cents: costCents,
      duration_ms: data.durationMs,
      started_at: data.startedAt.toISOString(),
      completed_at: data.completedAt.toISOString(),
      status: data.status,
      error_message: data.errorMessage || null,
      metadata: (data.metadata || {}) as AIRequestLogInsert['metadata'],
    }

    const { error } = await adminClient.from('ai_request_logs').insert(insertData)

    if (error) {
      console.error('[AI Logging] Failed to log request:', error.message)
    }
  } catch (error) {
    // Silently fail - logging should never break the main flow
    console.error(
      '[AI Logging] Error:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Helper to create a logging context for AI requests
 *
 * @example
 * ```typescript
 * const logContext = createLogContext('/api/ai/generate-day', user?.id, tripId)
 * const startTime = Date.now()
 *
 * try {
 *   const response = await ai.complete(...)
 *   logContext.success(response.usage?.inputTokens, response.usage?.outputTokens, startTime)
 *   return response
 * } catch (error) {
 *   logContext.error(error, startTime)
 *   throw error
 * }
 * ```
 */
function createLogContext(
  endpoint: string,
  userId?: string,
  tripId?: string,
  metadata?: Record<string, unknown>
) {
  return {
    /**
     * Log a successful AI request
     */
    success(
      provider: string,
      inputTokens: number,
      outputTokens: number,
      startTime: number,
      model?: string
    ) {
      const now = Date.now()
      logAIRequest({
        endpoint,
        provider,
        model,
        userId,
        tripId,
        inputTokens,
        outputTokens,
        durationMs: now - startTime,
        startedAt: new Date(startTime),
        completedAt: new Date(now),
        status: 'success',
        metadata,
      }).catch(console.error)
    },

    /**
     * Log a failed AI request
     */
    error(provider: string, error: unknown, startTime: number, model?: string) {
      const now = Date.now()
      const errorMessage = error instanceof Error ? error.message : String(error)
      logAIRequest({
        endpoint,
        provider,
        model,
        userId,
        tripId,
        inputTokens: 0,
        outputTokens: 0,
        durationMs: now - startTime,
        startedAt: new Date(startTime),
        completedAt: new Date(now),
        status: 'error',
        errorMessage,
        metadata,
      }).catch(console.error)
    },
  }
}
