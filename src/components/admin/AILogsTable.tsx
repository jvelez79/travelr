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
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AILogsTableProps {
  logs: AIRequestLog[]
  pagination: AILogsPagination
  loading: boolean
  error: string | null
  onPageChange: (page: number) => void
  className?: string
}

export function AILogsTable({
  logs,
  pagination,
  loading,
  error,
  onPageChange,
  className,
}: AILogsTableProps) {
  if (error) {
    return (
      <div className={`rounded-md border p-8 text-center ${className}`}>
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`rounded-md border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className={`rounded-md border p-8 text-center ${className}`}>
        <p className="text-muted-foreground">No AI requests logged yet.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
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
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
