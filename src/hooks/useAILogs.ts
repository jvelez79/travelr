'use client'

import { useState, useEffect, useCallback } from 'react'

export interface AIRequestLog {
  id: string
  request_id: string
  endpoint: string
  provider: string
  model: string | null
  user_id: string | null
  trip_id: string | null
  input_tokens: number
  output_tokens: number
  cost_cents: number
  duration_ms: number
  started_at: string
  completed_at: string
  status: 'success' | 'error'
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AILogsStats {
  totalRequests: number
  totalCostCents: number
  totalInputTokens: number
  totalOutputTokens: number
  errorCount: number
  avgDurationMs: number
  byProvider: Record<string, number>
  byEndpoint: Record<string, number>
}

export interface AILogsPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AILogsFilters {
  page: number
  pageSize?: number
  provider?: string
  status?: string
  startDate?: string
  endDate?: string
}

interface UseAILogsResult {
  logs: AIRequestLog[]
  stats: AILogsStats | null
  pagination: AILogsPagination
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAILogs(filters: AILogsFilters): UseAILogsResult {
  const [logs, setLogs] = useState<AIRequestLog[]>([])
  const [stats, setStats] = useState<AILogsStats | null>(null)
  const [pagination, setPagination] = useState<AILogsPagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', String(filters.page))
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
      if (filters.provider) params.set('provider', filters.provider)
      if (filters.status) params.set('status', filters.status)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const response = await fetch(`/api/admin/ai-logs?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.')
        }
        if (response.status === 401) {
          throw new Error('Not authenticated. Please log in.')
        }
        throw new Error('Failed to fetch AI logs')
      }

      const data = await response.json()

      setLogs(data.logs)
      setStats(data.stats)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLogs([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [filters.page, filters.pageSize, filters.provider, filters.status, filters.startDate, filters.endDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    stats,
    pagination,
    loading,
    error,
    refetch: fetchLogs,
  }
}
