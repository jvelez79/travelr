import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIPromptListResponse } from '@/types/ai-prompts'

/**
 * GET /api/admin/prompts
 * List all AI prompts (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch all prompts
    const { data: prompts, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[admin/prompts] Error fetching prompts:', error)
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
    }

    const response: AIPromptListResponse = { prompts: prompts || [] }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[admin/prompts] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
