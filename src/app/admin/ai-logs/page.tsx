'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAILogs, type AILogsFilters } from '@/hooks/useAILogs'
import { AILogsStatsCards } from '@/components/admin/AILogsStatsCards'
import { AILogsTable } from '@/components/admin/AILogsTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AILogsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [filters, setFilters] = useState<AILogsFilters>({
    page: 1,
    pageSize: 50,
  })

  const { logs, stats, pagination, loading, error, refetch } = useAILogs(filters)

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isAdmin, authLoading, router])

  // Show nothing while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Don't render if not admin (will redirect)
  if (!user || !isAdmin) {
    return null
  }

  const handleProviderChange = (value: string) => {
    setFilters((f) => ({
      ...f,
      provider: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handleStatusChange = (value: string) => {
    setFilters((f) => ({
      ...f,
      status: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters((f) => ({ ...f, page }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/trips">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">AI Request Logs</h1>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <AILogsStatsCards stats={stats} loading={loading} />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-8">
          <Select
            value={filters.provider || 'all'}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="claude-cli">Claude CLI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <AILogsTable
          logs={logs}
          pagination={pagination}
          loading={loading}
          error={error}
          onPageChange={handlePageChange}
          className="mt-6"
        />
      </main>
    </div>
  )
}
