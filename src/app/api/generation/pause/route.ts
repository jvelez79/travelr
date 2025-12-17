import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PauseGenerationRequest {
  tripId: string
}

/**
 * POST /api/generation/pause
 *
 * Pauses the background generation by setting status to 'paused'.
 * The Edge Function checks this status before processing each day
 * and will stop if paused.
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
    const body: PauseGenerationRequest = await request.json()
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
      .select('id, user_id, status')
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

    // 4. Check if generation can be paused
    const pausableStatuses = ['generating', 'generating_summary', 'ready_to_generate']
    if (!pausableStatuses.includes(state.status || '')) {
      return NextResponse.json(
        { error: `Cannot pause generation with status: ${state.status}` },
        { status: 400 }
      )
    }

    // 5. Update status to paused
    const { error: updateError } = await supabase
      .from('generation_states')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.id)

    if (updateError) {
      console.error('[generation/pause] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to pause generation' },
        { status: 500 }
      )
    }

    console.log('[generation/pause] Paused generation for trip:', tripId)

    return NextResponse.json({
      success: true,
      message: 'Generation paused',
      tripId,
    })
  } catch (error) {
    console.error('[generation/pause] Error:', error)
    return NextResponse.json(
      { error: 'Failed to pause generation' },
      { status: 500 }
    )
  }
}
