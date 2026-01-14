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
import { RefreshCw, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function AILogsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [filters, setFilters] = useState<AILogsFilters>({
    page: 1,
    pageSize: 50,
  })
  const [dateRange, setDateRange] = useState('all')

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

  // Filters component to pass to table
  const FiltersComponent = (
    <>
      <Select
        value={filters.provider || 'all'}
        onValueChange={handleProviderChange}
      >
        <SelectTrigger className="w-[140px] h-8 text-sm">
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
        <SelectTrigger className="w-[120px] h-8 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/trips">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold">AI Request Logs</h1>
              <p className="text-xs text-muted-foreground">Monitor AI provider usage and costs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading} className="h-8">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <AILogsStatsCards stats={stats} loading={loading} />

        {/* Table with integrated filters */}
        <AILogsTable
          logs={logs}
          pagination={pagination}
          loading={loading}
          error={error}
          onPageChange={handlePageChange}
          filters={FiltersComponent}
          className="mt-8"
        />

        {/* Admin Navigation */}
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Admin Tools</h3>
          <div className="flex gap-3">
            <Link href="/admin/prompts">
              <Button variant="outline" size="sm">
                AI Prompts
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
