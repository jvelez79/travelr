'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AIRequestLog, AILogsPagination } from '@/hooks/useAILogs'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { ReactNode } from 'react'

interface AILogsTableProps {
  logs: AIRequestLog[]
  pagination: AILogsPagination
  loading: boolean
  error: string | null
  onPageChange: (page: number) => void
  className?: string
  filters?: ReactNode
}

export function AILogsTable({
  logs,
  pagination,
  loading,
  error,
  onPageChange,
  className,
  filters,
}: AILogsTableProps) {
  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
        <Inbox className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">
        No requests yet
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        AI requests will appear here as your app makes calls to AI providers.
        Try generating an itinerary to see activity.
      </p>
    </div>
  )

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
        <Inbox className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">
        Failed to load logs
      </h3>
      <p className="text-sm text-destructive text-center max-w-sm">
        {error}
      </p>
    </div>
  )

  // Table header row (reused in loading and normal state)
  const TableHeaderRow = () => (
    <TableRow>
      <TableHead>Timestamp</TableHead>
      <TableHead>Endpoint</TableHead>
      <TableHead>Provider</TableHead>
      <TableHead className="text-right">Tokens</TableHead>
      <TableHead className="text-right">Cost</TableHead>
      <TableHead className="text-right">Duration</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  )

  // Loading skeleton rows
  const LoadingRows = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-16" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )

  // Filters bar component
  const FiltersBar = () => (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex items-center gap-3">
        {filters}
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">
        {loading ? '...' : `${pagination.total} requests`}
      </span>
    </div>
  )

  return (
    <div className={className}>
      <div className="rounded-lg border bg-card">
        {/* Integrated filters bar */}
        {filters && <FiltersBar />}

        {/* Content area */}
        {error ? (
          <ErrorState />
        ) : loading ? (
          <Table>
            <TableHeader>
              <TableHeaderRow />
            </TableHeader>
            <TableBody>
              <LoadingRows />
            </TableBody>
          </Table>
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableHeaderRow />
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(log.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {formatEndpoint(log.endpoint)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {log.input_tokens.toLocaleString()}/{log.output_tokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    ${(log.cost_cents / 100).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {(log.duration_ms / 1000).toFixed(1)}s
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status === 'success' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination - only show when there are logs */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-muted-foreground">
            Showing {logs.length} of {pagination.total} requests
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2 tabular-nums">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEndpoint(endpoint: string): string {
  // Remove /api/ai/ prefix for cleaner display
  return endpoint.replace(/^\/api\/ai\//, '')
}
