import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TravelPreferences } from '@/types/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface StartGenerationRequest {
  tripId: string
  preferences: TravelPreferences
  fullPlaces?: Record<string, unknown>[] // Places data from prefetch
}

/**
 * POST /api/generation/start
 *
 * Starts background generation of travel itinerary via Edge Function.
 * This is fire-and-forget - the Edge Function runs asynchronously.
 * Client should subscribe to Realtime for progress updates.
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
    const body: StartGenerationRequest = await request.json()
    const { tripId, preferences, fullPlaces } = body

    if (!tripId) {
      return NextResponse.json(
        { error: 'tripId is required' },
        { status: 400 }
      )
    }

    // 3. Verify trip belongs to user
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id, status')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (trip.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - trip belongs to another user' },
        { status: 403 }
      )
    }

    // 4. Check if generation is already in progress
    const { data: existingState } = await supabase
      .from('generation_states')
      .select('status')
      .eq('trip_id', tripId)
      .single()

    if (existingState?.status === 'generating' || existingState?.status === 'generating_summary') {
      return NextResponse.json(
        { error: 'Generation already in progress' },
        { status: 409 }
      )
    }

    // 5. Invoke Edge Function (fire and forget)
    const adminClient = createAdminClient()

    // Using fetch directly to invoke Edge Function for more control
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
        action: 'start',
        preferences,
        fullPlaces,
      }),
    }).catch((err) => {
      // Log but don't fail - Edge Function handles its own errors
      console.error('[generation/start] Edge Function invocation error:', err)
    })

    console.log('[generation/start] Started generation for trip:', tripId)

    return NextResponse.json({
      success: true,
      message: 'Generation started. Subscribe to Realtime for updates.',
      tripId,
    })
  } catch (error) {
    console.error('[generation/start] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    )
  }
}
