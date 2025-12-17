import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ResumeGenerationRequest {
  tripId: string
}

/**
 * POST /api/generation/resume
 *
 * Resumes a paused generation by invoking the Edge Function.
 * The Edge Function will continue from where it left off.
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
    const body: ResumeGenerationRequest = await request.json()
    const { tripId } = body

    if (!tripId) {
      return NextResponse.json(
        { error: 'tripId is required' },
        { status: 400 }
      )
    }

    // 3. Verify generation state exists and belongs to user
    const { data: state, error: stateError } = await supabase
      .from('generation_states')
      .select('id, user_id, status, pending_days')
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

    // 4. Check if generation can be resumed
    if (state.status !== 'paused') {
      return NextResponse.json(
        { error: `Cannot resume generation with status: ${state.status}. Must be 'paused'.` },
        { status: 400 }
      )
    }

    // 5. Check there are pending days to generate
    const pendingDays = state.pending_days || []
    if (pendingDays.length === 0) {
      return NextResponse.json(
        { error: 'No pending days to generate' },
        { status: 400 }
      )
    }

    // 6. Invoke Edge Function (fire and forget)
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
        action: 'resume',
      }),
    }).catch((err) => {
      console.error('[generation/resume] Edge Function invocation error:', err)
    })

    console.log('[generation/resume] Resumed generation for trip:', tripId)

    return NextResponse.json({
      success: true,
      message: 'Generation resumed. Subscribe to Realtime for updates.',
      tripId,
    })
  } catch (error) {
    console.error('[generation/resume] Error:', error)
    return NextResponse.json(
      { error: 'Failed to resume generation' },
      { status: 500 }
    )
  }
}
