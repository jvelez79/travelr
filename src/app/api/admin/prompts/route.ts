import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUntypedAdminClient } from '@/lib/supabase/admin'
import type { AIPromptListResponse } from '@/types/ai-prompts'

// Check if user email is in admin list
function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

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
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Use untyped admin client (ai_prompts not in generated types yet)
    const adminClient = createUntypedAdminClient()

    // Fetch all prompts
    const { data: prompts, error } = await adminClient
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
