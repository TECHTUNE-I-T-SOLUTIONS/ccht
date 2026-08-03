import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering so cookies are always fresh
export const dynamic = 'force-dynamic'

/**
 * Server-side token exchange endpoint for the PKCE auth flow.
 *
 * Supabase email templates (confirmation, password reset, magic link) should
 * link here with `token_hash` and `type` query parameters. This endpoint
 * verifies the OTP server-side — where the code verifier / token hash is
 * always available — and then redirects the user to the `next` page with a
 * fully established session cookie.
 *
 * This avoids the browser-side `_exchangeCodeForSession` call that fails
 * with `ERR_SOCKET_NOT_CONNECTED` / `Failed to fetch` when the PKCE
 * `code_verifier` is missing from localStorage (which is always the case
 * for password-reset emails, since the user clicks the link in a different
 * browser session than the one that initiated the reset).
 *
 * Expected email template link (PKCE flow):
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/reset-password/confirm'
  const code = searchParams.get('code') // Legacy PKCE code (fallback)

  const redirectTo = new URL(next, origin)
  const errorUrl = new URL('/reset-password/confirm', origin)
  errorUrl.searchParams.set('error', 'invalid_or_expired')

  // --- PKCE flow: token_hash + verifyOtp (recommended) ---
  if (tokenHash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      // Session cookie is now set server-side; redirect to the change-password
      // (or other `next`) page. Strip auth params from the URL.
      redirectTo.searchParams.delete('token_hash')
      redirectTo.searchParams.delete('type')
      redirectTo.searchParams.delete('code')
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }

    console.error('[auth/confirm] verifyOtp error:', error.message)
    return NextResponse.redirect(errorUrl)
  }

  // --- Legacy fallback: PKCE code exchange ---
  // This path is hit when the Supabase email template has NOT been updated to
  // use `token_hash` and still sends a `code`. The exchange may fail if the
  // code_verifier is missing from the cookie jar (different session), but we
  // attempt it anyway so that same-session flows (e.g. email confirmation in
  // the same browser) still work.
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      redirectTo.searchParams.delete('token_hash')
      redirectTo.searchParams.delete('type')
      redirectTo.searchParams.delete('code')
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }

    console.error('[auth/confirm] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(errorUrl)
  }

  // No usable parameters — redirect to error
  return NextResponse.redirect(errorUrl)
}