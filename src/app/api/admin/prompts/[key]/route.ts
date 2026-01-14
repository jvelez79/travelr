import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AIPromptResponse, AIPromptUpdate } from '@/types/ai-prompts'

interface RouteParams {
  params: Promise<{ key: string }>
}

// Check if user email is in admin list
function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

/**
 * GET /api/admin/prompts/[key]
 * Get a specific AI prompt by key (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params
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

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Fetch prompt by key
    const { data: prompt, error } = await adminClient
      .from('ai_prompts')
      .select('*')
      .eq('key', key)
      .single()

    if (error || !prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const response: AIPromptResponse = { prompt }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[admin/prompts/key] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/prompts/[key]
 * Update an AI prompt (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params
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

    // Parse request body
    const body: AIPromptUpdate = await request.json()

    // Validate that at least one field is being updated
    if (!body.name && !body.description && !body.system_prompt && !body.user_prompt && body.is_active === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Check prompt exists
    const { data: existing, error: fetchError } = await adminClient
      .from('ai_prompts')
      .select('version')
      .eq('key', key)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Update prompt with incremented version
    const { data: prompt, error: updateError } = await adminClient
      .from('ai_prompts')
      .update({
        ...body,
        version: existing.version + 1,
        updated_by: user.id,
      })
      .eq('key', key)
      .select()
      .single()

    if (updateError) {
      console.error('[admin/prompts/key] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
    }

    const response: AIPromptResponse = { prompt }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[admin/prompts/key] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
