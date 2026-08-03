import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering so cookies are always fresh
export const dynamic = 'force-dynamic'

/**
 * Legacy PKCE callback handler.
 *
 * Most auth flows (signup confirmation, password reset, magic link) should
 * route through `/auth/confirm` instead, which uses `verifyOtp` with a
 * `token_hash` and is robust to cross-session clicks (e.g. clicking a
 * password-reset link in a different browser).
 *
 * This `/auth/callback` route is kept for backwards compatibility with
 * OAuth providers and older email templates that still send a `code`. It
 * exchanges the code server-side and redirects to `next` (or `/login` for
 * recovery flows, since the change-password page is `/reset-password/confirm`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Redirect to the reset-password page with an error flag so the user is
  // prompted to request a fresh link rather than seeing a raw error page.
  const errorUrl = new URL('/reset-password/confirm', origin)
  errorUrl.searchParams.set('error', 'invalid_or_expired')
  return NextResponse.redirect(errorUrl)
}