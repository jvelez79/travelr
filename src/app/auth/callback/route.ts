import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error_param = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Log for debugging
  console.log('[Auth Callback] URL params:', {
    code: code ? 'present' : 'missing',
    error: error_param,
    error_description,
  })

  // If there's an error from the OAuth provider
  if (error_param) {
    console.error('[Auth Callback] OAuth error:', error_param, error_description)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_param)}&message=${encodeURIComponent(error_description || '')}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Session exchange error:', error.message)
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_error&message=${encodeURIComponent(error.message)}`
      )
    }

    // Success - redirect to trips
    return NextResponse.redirect(`${origin}/trips`)
  }

  // No code provided
  console.error('[Auth Callback] No code provided')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
