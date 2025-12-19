/**
 * Linkeo Metrics Module
 *
 * Provides metrics tracking and logging for the place linking system.
 * Used to monitor the effectiveness of the linking process and identify issues.
 */

export interface LinkingMetrics {
  // Total counts
  totalActivities: number
  totalTimeline: number
  totalMeals: number

  // Match types
  linkedExact: number // matchConfidence: 'exact'
  linkedHigh: number // matchConfidence: 'high' (fallback successful)
  linkedLow: number // matchConfidence: 'low' (weak match)
  unlinked: number // matchConfidence: 'none'

  // Fallback tracking
  fallbacksAttempted: number
  fallbacksSuccessful: number

  // ID validation
  invalidIdsDetected: number
  idsUsedAsNames: number // When AI used name instead of ID

  // Performance
  processingTimeMs: number
}

/**
 * Create an empty metrics object
 */
export function createEmptyMetrics(): LinkingMetrics {
  return {
    totalActivities: 0,
    totalTimeline: 0,
    totalMeals: 0,
    linkedExact: 0,
    linkedHigh: 0,
    linkedLow: 0,
    unlinked: 0,
    fallbacksAttempted: 0,
    fallbacksSuccessful: 0,
    invalidIdsDetected: 0,
    idsUsedAsNames: 0,
    processingTimeMs: 0,
  }
}

/**
 * Calculate derived metrics
 */
interface DerivedMetrics {
  linkRate: number // Percentage of items linked (any confidence)
  exactMatchRate: number // Percentage of exact matches
  fallbackSuccessRate: number // Percentage of fallbacks that succeeded
  healthScore: number // Overall health score (0-100)
}

function calculateDerivedMetrics(metrics: LinkingMetrics): DerivedMetrics {
  const totalItems = metrics.totalActivities + metrics.totalTimeline + metrics.totalMeals
  const linkedItems = metrics.linkedExact + metrics.linkedHigh + metrics.linkedLow

  const linkRate = totalItems > 0 ? (linkedItems / totalItems) * 100 : 0
  const exactMatchRate = totalItems > 0 ? (metrics.linkedExact / totalItems) * 100 : 0
  const fallbackSuccessRate =
    metrics.fallbacksAttempted > 0
      ? (metrics.fallbacksSuccessful / metrics.fallbacksAttempted) * 100
      : 100

  // Health score: weighted combination of rates
  // - 50% weight on link rate
  // - 30% weight on exact match rate
  // - 20% weight on lack of invalid IDs
  const invalidIdPenalty =
    totalItems > 0 ? (metrics.invalidIdsDetected / totalItems) * 100 : 0

  const healthScore = Math.round(
    linkRate * 0.5 + exactMatchRate * 0.3 + Math.max(0, 100 - invalidIdPenalty) * 0.2
  )

  return {
    linkRate: Math.round(linkRate * 10) / 10,
    exactMatchRate: Math.round(exactMatchRate * 10) / 10,
    fallbackSuccessRate: Math.round(fallbackSuccessRate * 10) / 10,
    healthScore,
  }
}

/**
 * Log metrics in a structured format
 */
export function logLinkingMetrics(
  metrics: LinkingMetrics,
  context?: { destination?: string; tripId?: string }
): void {
  const derived = calculateDerivedMetrics(metrics)
  const totalItems = metrics.totalActivities + metrics.totalTimeline + metrics.totalMeals
  const linkedItems = metrics.linkedExact + metrics.linkedHigh + metrics.linkedLow

  console.log("[LINKEO METRICS]", {
    context,
    summary: {
      totalItems,
      linkedItems,
      unlinkedItems: metrics.unlinked,
      linkRate: `${derived.linkRate}%`,
      healthScore: derived.healthScore,
    },
    breakdown: {
      exact: metrics.linkedExact,
      high: metrics.linkedHigh,
      low: metrics.linkedLow,
      none: metrics.unlinked,
    },
    fallback: {
      attempted: metrics.fallbacksAttempted,
      successful: metrics.fallbacksSuccessful,
      rate: `${derived.fallbackSuccessRate}%`,
    },
    issues: {
      invalidIds: metrics.invalidIdsDetected,
      idsAsNames: metrics.idsUsedAsNames,
    },
    performance: {
      processingMs: metrics.processingTimeMs,
    },
  })

  // Log warnings for concerning metrics
  if (derived.healthScore < 70) {
    console.error(
      "[LINKEO ALERT] Health score bajo:",
      derived.healthScore,
      "- Revisar categorías faltantes o problemas de linkeo"
    )
  }

  if (derived.linkRate < 50) {
    console.warn("[LINKEO] Low link rate detected:", derived.linkRate + "%")
  }

  if (metrics.invalidIdsDetected > 5) {
    console.warn(
      "[LINKEO] High number of invalid IDs:",
      metrics.invalidIdsDetected,
      "- AI may be hallucinating"
    )
  }

  if (metrics.idsUsedAsNames > 3) {
    console.warn(
      "[LINKEO] AI using names as IDs:",
      metrics.idsUsedAsNames,
      "- Prompt may need improvement"
    )
  }
}

/**
 * Get a human-readable summary of metrics
 */
function getMetricsSummary(metrics: LinkingMetrics): string {
  const derived = calculateDerivedMetrics(metrics)
  const totalItems = metrics.totalActivities + metrics.totalTimeline + metrics.totalMeals
  const linkedItems = metrics.linkedExact + metrics.linkedHigh + metrics.linkedLow

  return `Linkeo: ${linkedItems}/${totalItems} (${derived.linkRate}%) | ` +
    `Exact: ${metrics.linkedExact} | Fallback: ${metrics.linkedHigh + metrics.linkedLow} | ` +
    `Health: ${derived.healthScore}/100`
}
