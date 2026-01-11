'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, DollarSign, AlertTriangle, Clock } from 'lucide-react'
import type { AILogsStats } from '@/hooks/useAILogs'
import { cn } from '@/lib/utils'

interface AILogsStatsCardsProps {
  stats: AILogsStats | null
  loading: boolean
}

export function AILogsStatsCards({ stats, loading }: AILogsStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero card skeleton */}
        <Card className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
        {[2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-7 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const costUSD = (stats?.totalCostCents || 0) / 100
  const errorRateNum = stats?.totalRequests
    ? (stats.errorCount / stats.totalRequests) * 100
    : 0
  const errorRate = errorRateNum.toFixed(1)
  const avgDurationSec = ((stats?.avgDurationMs || 0) / 1000).toFixed(1)
  const hasErrors = errorRateNum > 0

  // Format provider breakdown
  const providerBreakdown = Object.entries(stats?.byProvider || {})
    .map(([p, c]) => `${p}: ${c}`)
    .join(', ')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Hero Card - Total Requests */}
      <Card className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Requests
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {stats?.totalRequests.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {providerBreakdown || 'All time'}
          </p>
        </CardContent>
      </Card>

      {/* Cost Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Cost
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            ${costUSD.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="tabular-nums">{((stats?.totalInputTokens || 0) / 1000).toFixed(1)}K</span> input
            {' / '}
            <span className="tabular-nums">{((stats?.totalOutputTokens || 0) / 1000).toFixed(1)}K</span> output
          </p>
        </CardContent>
      </Card>

      {/* Error Rate Card */}
      <Card className={cn(hasErrors && 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20')}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              'p-1.5 rounded-md',
              hasErrors ? 'bg-red-500/10' : 'bg-slate-500/10'
            )}>
              <AlertTriangle className={cn(
                'h-4 w-4',
                hasErrors ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
              )} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Error Rate
            </span>
          </div>
          <div className={cn(
            'text-2xl font-semibold tracking-tight',
            hasErrors && 'text-red-600 dark:text-red-400'
          )}>
            {errorRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats?.errorCount || 0} {stats?.errorCount === 1 ? 'error' : 'errors'} total
          </p>
        </CardContent>
      </Card>

      {/* Avg Duration Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-blue-500/10">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Avg Duration
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {avgDurationSec}s
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            per request
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
