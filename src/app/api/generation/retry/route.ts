import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FailedDay } from '@/types/database'
import type { Json } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RetryGenerationRequest {
  tripId: string
  dayNumber?: number // Optional - if not provided, retries all failed days
}

/**
 * POST /api/generation/retry
 *
 * Retries failed day(s) by invoking the Edge Function.
 * Can retry a specific day or all failed days.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body: RetryGenerationRequest = await request.json()
    const { tripId, dayNumber } = body

    if (!tripId) {
      return NextResponse.json(
        { error: 'tripId is required' },
        { status: 400 }
      )
    }

    // 3. Verify generation state exists and belongs to user
    const { data: state, error: stateError } = await supabase
      .from('generation_states')
      .select('id, user_id, status, failed_days')
      .eq('trip_id', tripId)
      .single()

    if (stateError || !state) {
      return NextResponse.json(
        { error: 'Generation state not found' },
        { status: 404 }
      )
    }

    if (state.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // 4. Check if there are failed days to retry
    const failedDays = (state.failed_days as unknown as FailedDay[]) || []
    if (failedDays.length === 0) {
      return NextResponse.json(
        { error: 'No failed days to retry' },
        { status: 400 }
      )
    }

    // 5. If specific day requested, verify it's in failed days
    if (dayNumber !== undefined) {
      const dayExists = failedDays.some(d => d.dayNumber === dayNumber)
      if (!dayExists) {
        return NextResponse.json(
          { error: `Day ${dayNumber} is not in the failed days list` },
          { status: 400 }
        )
      }
    }

    // 6. Check generation is not already in progress
    if (state.status === 'generating') {
      return NextResponse.json(
        { error: 'Generation already in progress. Wait for it to complete or pause it first.' },
        { status: 409 }
      )
    }

    // 7. If retrying specific day, reset its retry count
    if (dayNumber !== undefined) {
      const updatedFailedDays = failedDays.map(d =>
        d.dayNumber === dayNumber
          ? { ...d, attempts: 0 }
          : d
      )

      await supabase
        .from('generation_states')
        .update({
          failed_days: updatedFailedDays as unknown as Json,
          retry_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)
    }

    // 8. Invoke Edge Function (fire and forget)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-itinerary`

    // Fire and forget - don't await
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        tripId,
        userId: user.id,
        action: 'retry',
        dayNumber, // Optional - Edge Function will retry all if not specified
      }),
    }).catch((err) => {
      console.error('[generation/retry] Edge Function invocation error:', err)
    })

    console.log('[generation/retry] Retrying generation for trip:', tripId,
      dayNumber ? `day ${dayNumber}` : 'all failed days')

    return NextResponse.json({
      success: true,
      message: dayNumber
        ? `Retrying day ${dayNumber}. Subscribe to Realtime for updates.`
        : 'Retrying all failed days. Subscribe to Realtime for updates.',
      tripId,
      dayNumber,
    })
  } catch (error) {
    console.error('[generation/retry] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retry generation' },
      { status: 500 }
    )
  }
}
