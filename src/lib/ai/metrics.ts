/**
 * AI Metrics and Logging Utility
 *
 * Provides timing metrics for AI operations to identify optimization opportunities.
 */

export interface StepMetrics {
  step: string
  startedAt: number
  completedAt: number
  durationMs: number
  status: 'success' | 'error'
  error?: string
  metadata?: {
    inputTokens?: number
    outputTokens?: number
    responseSize?: number
    [key: string]: unknown
  }
}

// Accumulated metrics for summary
const sessionMetrics: StepMetrics[] = []

/**
 * Format duration in human readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Log the start of a step
 */
export function logStepStart(step: string): void {
  console.log(`[AI] → Starting ${step}...`)
}

/**
 * Log the completion of a step
 */
export function logStepComplete(step: string, durationMs: number, metadata?: StepMetrics['metadata']): void {
  const tokenInfo = metadata?.inputTokens || metadata?.outputTokens
    ? ` (tokens: ${metadata.inputTokens ?? 0}/${metadata.outputTokens ?? 0})`
    : ''
  console.log(`[AI] ✓ ${step} completed in ${formatDuration(durationMs)}${tokenInfo}`)
}

/**
 * Log an error in a step
 */
export function logStepError(step: string, durationMs: number, error: string): void {
  console.error(`[AI] ✗ ${step} failed after ${formatDuration(durationMs)}: ${error}`)
}

/**
 * Wrap an async function with timing metrics
 *
 * @example
 * const result = await withMetrics('generate-day-1', async () => {
 *   return await generateDay(1)
 * })
 */
export async function withMetrics<T>(
  step: string,
  fn: () => Promise<T>,
  extractMetadata?: (result: T) => StepMetrics['metadata']
): Promise<T> {
  const startedAt = Date.now()
  logStepStart(step)

  try {
    const result = await fn()
    const completedAt = Date.now()
    const durationMs = completedAt - startedAt

    const metadata = extractMetadata?.(result)

    const metrics: StepMetrics = {
      step,
      startedAt,
      completedAt,
      durationMs,
      status: 'success',
      metadata
    }

    sessionMetrics.push(metrics)
    logStepComplete(step, durationMs, metadata)

    return result
  } catch (error) {
    const completedAt = Date.now()
    const durationMs = completedAt - startedAt
    const errorMessage = error instanceof Error ? error.message : String(error)

    const metrics: StepMetrics = {
      step,
      startedAt,
      completedAt,
      durationMs,
      status: 'error',
      error: errorMessage
    }

    sessionMetrics.push(metrics)
    logStepError(step, durationMs, errorMessage)

    throw error
  }
}

/**
 * Get all accumulated metrics for the session
 */
export function getSessionMetrics(): StepMetrics[] {
  return [...sessionMetrics]
}

/**
 * Clear accumulated metrics
 */
export function clearSessionMetrics(): void {
  sessionMetrics.length = 0
}

/**
 * Log a summary of all metrics
 */
export function logMetricsSummary(): void {
  if (sessionMetrics.length === 0) {
    console.log('[AI] No metrics recorded')
    return
  }

  const totalMs = sessionMetrics.reduce((sum, m) => sum + m.durationMs, 0)
  const successCount = sessionMetrics.filter(m => m.status === 'success').length
  const errorCount = sessionMetrics.filter(m => m.status === 'error').length

  // Group by step prefix for summary
  const byCategory: Record<string, number> = {}
  for (const m of sessionMetrics) {
    const category = m.step.replace(/-\d+$/, '') // Remove trailing numbers (e.g., "day-1" -> "day")
    byCategory[category] = (byCategory[category] || 0) + m.durationMs
  }

  const breakdown = Object.entries(byCategory)
    .map(([cat, ms]) => `${cat}: ${formatDuration(ms)}`)
    .join(', ')

  console.log(`[AI] ═══════════════════════════════════════════════`)
  console.log(`[AI] Summary: Total ${formatDuration(totalMs)} (${successCount} success, ${errorCount} errors)`)
  console.log(`[AI] Breakdown: ${breakdown}`)
  console.log(`[AI] ═══════════════════════════════════════════════`)
}

/**
 * Create a metrics collector for a specific generation session
 */
export function createMetricsCollector(sessionName: string) {
  const metrics: StepMetrics[] = []
  const sessionStart = Date.now()

  return {
    /**
     * Track a step with automatic timing
     */
    async track<T>(
      step: string,
      fn: () => Promise<T>,
      extractMetadata?: (result: T) => StepMetrics['metadata']
    ): Promise<T> {
      const startedAt = Date.now()
      logStepStart(step)

      try {
        const result = await fn()
        const completedAt = Date.now()
        const durationMs = completedAt - startedAt
        const metadata = extractMetadata?.(result)

        metrics.push({
          step,
          startedAt,
          completedAt,
          durationMs,
          status: 'success',
          metadata
        })

        logStepComplete(step, durationMs, metadata)
        return result
      } catch (error) {
        const completedAt = Date.now()
        const durationMs = completedAt - startedAt
        const errorMessage = error instanceof Error ? error.message : String(error)

        metrics.push({
          step,
          startedAt,
          completedAt,
          durationMs,
          status: 'error',
          error: errorMessage
        })

        logStepError(step, durationMs, errorMessage)
        throw error
      }
    },

    /**
     * Get all metrics for this session
     */
    getMetrics(): StepMetrics[] {
      return [...metrics]
    },

    /**
     * Log summary for this session
     */
    logSummary(): void {
      const totalMs = Date.now() - sessionStart
      const successCount = metrics.filter(m => m.status === 'success').length
      const errorCount = metrics.filter(m => m.status === 'error').length

      const byCategory: Record<string, number> = {}
      for (const m of metrics) {
        const category = m.step.replace(/-\d+$/, '')
        byCategory[category] = (byCategory[category] || 0) + m.durationMs
      }

      const breakdown = Object.entries(byCategory)
        .map(([cat, ms]) => `${cat}: ${formatDuration(ms)}`)
        .join(', ')

      console.log(`[AI] ═══════════════════════════════════════════════`)
      console.log(`[AI] ${sessionName} Complete`)
      console.log(`[AI] Total: ${formatDuration(totalMs)} (${successCount} success, ${errorCount} errors)`)
      if (breakdown) {
        console.log(`[AI] Breakdown: ${breakdown}`)
      }
      console.log(`[AI] ═══════════════════════════════════════════════`)
    }
  }
}
