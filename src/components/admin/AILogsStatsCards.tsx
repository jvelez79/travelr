'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AILogsStats } from '@/hooks/useAILogs'

interface AILogsStatsCardsProps {
  stats: AILogsStats | null
  loading: boolean
}

export function AILogsStatsCards({ stats, loading }: AILogsStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const costUSD = (stats?.totalCostCents || 0) / 100
  const errorRate = stats?.totalRequests
    ? ((stats.errorCount / stats.totalRequests) * 100).toFixed(1)
    : '0.0'
  const avgDurationSec = ((stats?.avgDurationMs || 0) / 1000).toFixed(1)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.totalRequests.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Object.entries(stats?.byProvider || {})
              .map(([p, c]) => `${p}: ${c}`)
              .join(', ') || 'No data'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${costUSD.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {((stats?.totalInputTokens || 0) / 1000).toFixed(1)}K in /{' '}
            {((stats?.totalOutputTokens || 0) / 1000).toFixed(1)}K out
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Error Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{errorRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.errorCount || 0} errors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgDurationSec}s</div>
          <p className="text-xs text-muted-foreground mt-1">per request</p>
        </CardContent>
      </Card>
    </div>
  )
}
