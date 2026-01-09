/**
 * DELETE /api/ai/travel-agent/conversations/[conversationId]
 *
 * Delete a conversation and all its messages.
 * Validates that the user owns the trip associated with the conversation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch conversation to verify ownership
    const { data: conversation, error: conversationError } = await supabase
      .from('agent_conversations')
      .select('id, trip_id, user_id')
      .eq('id', conversationId)
      .maybeSingle()

    if (conversationError) {
      console.error('[Conversations API] Error fetching conversation:', conversationError)
      return NextResponse.json(
        { error: 'Error fetching conversation' },
        { status: 500 }
      )
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify user owns this conversation (check user_id on conversation)
    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this conversation' },
        { status: 403 }
      )
    }

    // Delete conversation (CASCADE will delete messages automatically)
    const { error: deleteError } = await supabase
      .from('agent_conversations')
      .delete()
      .eq('id', conversationId)

    if (deleteError) {
      console.error('[Conversations API] Error deleting conversation:', deleteError)
      return NextResponse.json(
        { error: 'Error deleting conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })

  } catch (error) {
    console.error('[Conversations API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
