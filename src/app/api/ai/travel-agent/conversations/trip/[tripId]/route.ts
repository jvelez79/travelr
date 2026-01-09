/**
 * GET /api/ai/travel-agent/conversations/[tripId]
 *
 * List all conversations for a specific trip.
 * Returns conversations ordered by most recently updated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .maybeSingle()

    if (tripError) {
      console.error('[Conversations API] Error fetching trip:', tripError)
      return NextResponse.json(
        { error: 'Error fetching trip' },
        { status: 500 }
      )
    }

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (trip.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this trip' },
        { status: 403 }
      )
    }

    // Fetch conversations for this trip
    const { data: conversations, error: conversationsError } = await supabase
      .from('agent_conversations')
      .select('id, trip_id, user_id, title, created_at, updated_at')
      .eq('trip_id', tripId)
      .order('updated_at', { ascending: false })

    if (conversationsError) {
      console.error('[Conversations API] Error fetching conversations:', conversationsError)
      return NextResponse.json(
        { error: 'Error fetching conversations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      conversations: conversations || []
    })

  } catch (error) {
    console.error('[Conversations API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
