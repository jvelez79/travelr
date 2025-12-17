import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Check if user email is in admin list
function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

interface AILogStats {
  totalRequests: number
  totalCostCents: number
  totalInputTokens: number
  totalOutputTokens: number
  errorCount: number
  avgDurationMs: number
  byProvider: Record<string, number>
  byEndpoint: Record<string, number>
}

/**
 * GET /api/admin/ai-logs
 *
 * Fetches AI request logs with pagination and aggregated stats.
 * Only accessible to admin users.
 *
 * Query params:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50, max: 100)
 * - provider: Filter by provider (optional)
 * - status: Filter by status (optional)
 * - startDate: Filter from date (optional, ISO string)
 * - endDate: Filter to date (optional, ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify admin access
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 4. Build queries using admin client (bypasses RLS)
    const adminClient = createAdminClient()

    // Build base query for logs
    let logsQuery = adminClient
      .from('ai_request_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (provider) {
      logsQuery = logsQuery.eq('provider', provider)
    }
    if (status) {
      logsQuery = logsQuery.eq('status', status)
    }
    if (startDate) {
      logsQuery = logsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      logsQuery = logsQuery.lte('created_at', endDate)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    logsQuery = logsQuery.range(from, to)

    // Execute logs query
    const { data: logs, count, error: logsError } = await logsQuery

    if (logsError) {
      console.error('[admin/ai-logs] Query error:', logsError)
      throw logsError
    }

    // 5. Calculate stats (separate query for all data matching filters)
    let statsQuery = adminClient.from('ai_request_logs').select('*')

    if (provider) {
      statsQuery = statsQuery.eq('provider', provider)
    }
    if (status) {
      statsQuery = statsQuery.eq('status', status)
    }
    if (startDate) {
      statsQuery = statsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      statsQuery = statsQuery.lte('created_at', endDate)
    }

    const { data: allLogs } = await statsQuery

    const stats = calculateStats(allLogs || [])

    // 6. Return response
    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      stats,
    })
  } catch (error) {
    console.error('[admin/ai-logs] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch AI logs' }, { status: 500 })
  }
}

function calculateStats(logs: Array<{
  cost_cents: number | null
  input_tokens: number | null
  output_tokens: number | null
  duration_ms: number | null
  status: string | null
  provider: string | null
  endpoint: string | null
}>): AILogStats {
  if (logs.length === 0) {
    return {
      totalRequests: 0,
      totalCostCents: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      errorCount: 0,
      avgDurationMs: 0,
      byProvider: {},
      byEndpoint: {},
    }
  }

  const totalRequests = logs.length
  const totalCostCents = logs.reduce((sum, l) => sum + (l.cost_cents || 0), 0)
  const totalInputTokens = logs.reduce((sum, l) => sum + (l.input_tokens || 0), 0)
  const totalOutputTokens = logs.reduce((sum, l) => sum + (l.output_tokens || 0), 0)
  const errorCount = logs.filter((l) => l.status === 'error').length
  const totalDuration = logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0)
  const avgDurationMs = Math.round(totalDuration / totalRequests)

  // Group by provider
  const byProvider: Record<string, number> = {}
  for (const log of logs) {
    const provider = log.provider || 'unknown'
    byProvider[provider] = (byProvider[provider] || 0) + 1
  }

  // Group by endpoint (top 10)
  const byEndpoint: Record<string, number> = {}
  for (const log of logs) {
    const endpoint = log.endpoint || 'unknown'
    byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1
  }

  return {
    totalRequests,
    totalCostCents,
    totalInputTokens,
    totalOutputTokens,
    errorCount,
    avgDurationMs,
    byProvider,
    byEndpoint,
  }
}
