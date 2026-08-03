# Password Reset Fix — Setup Guide

This document explains the fix for the password-reset `ERR_SOCKET_NOT_CONNECTED` / `Failed to fetch` error and the **one manual step** required in the Supabase dashboard to complete it.

## The Problem

When a user clicked the password-reset link in the email and submitted a new password, the page threw:

```
POST https://<project>.supabase.co/auth/v1/token?grant_type=pkce net::ERR_SOCKET_NOT_CONNECTED
TypeError: Failed to fetch
  at rV._exchangeCodeForSession
  at async rV._getSessionFromURL
  at async rV._initialize
```

Every reset link "expired" / failed, no matter how recently it was issued.

### Root cause

The app uses `@supabase/ssr`, which configures the **PKCE auth flow**. In the PKCE flow, the recovery email is supposed to send a **`token_hash`** that is verified server-side via `verifyOtp`. But the previous implementation:

1. Called `resetPasswordForEmail` with `redirectTo: /reset-password/confirm` (a **client** page).
2. Supabase's default email template sent a **`code`** (not a `token_hash`) pointing at that client page.
3. When the user clicked the link, the browser Supabase client auto-ran `_initialize()` → `_getSessionFromURL()` → `_exchangeCodeForSession(code)`.
4. That browser-side exchange requires the **`code_verifier`** that was generated in the *server* session that called `resetPasswordForEmail`. The user clicks the email link in a **different** browser session, so the `code_verifier` is missing → the PKCE exchange fails with `Failed to fetch` / `ERR_SOCKET_NOT_CONNECTED`.

So the links weren't actually "expiring" — they were being exchanged in the wrong context (browser instead of server), where the PKCE verifier didn't exist.

## The Fix

The code changes in this commit implement the **official Supabase PKCE flow** for password reset:

| File | Change |
| --- | --- |
| `app/auth/confirm/route.ts` | **New.** Server-side token-exchange endpoint. Calls `supabase.auth.verifyOtp({ token_hash, type })` (PKCE) and falls back to `exchangeCodeForSession(code)` for legacy templates. Sets the session cookie server-side, then redirects to `/reset-password/confirm`. |
| `app/api/v1/auth/reset-password/route.ts` | `redirectTo` now points to `/auth/confirm?next=/reset-password/confirm` so the token is verified server-side. |
| `app/reset-password/confirm/page.tsx` | No longer calls `exchangeCodeForSession` in the browser. Verifies the server-set session, then calls `updateUser({ password })`. Shows a clear "invalid/expired" error for stale links. |
| `app/auth/callback/route.ts` | Legacy PKCE `code` callback now redirects failures to the reset page with an error flag instead of a raw `/auth/error`. |
| `proxy.ts` | `/auth/callback` and `/auth/confirm` added to public routes so the middleware doesn't redirect them to `/login`. |
| `public/sw.js` | Service worker no longer caches `/auth/*`, `/reset-password/*`, `/forgot-password`, `/login`, `/secure/*`, or `/api/*` routes — stale cached auth pages were serving expired tokens. |

## Required Manual Step — Update the Supabase Email Template

> **This step is mandatory.** Without it, Supabase will keep sending a `code` (not a `token_hash`) and the browser-side exchange will still fail.

1. Go to the Supabase dashboard:
   **Authentication → Email Templates → Reset Password**.
   (Direct link: `https://supabase.com/dashboard/project/_/auth/templates`)
2. Replace the link in the template body with:

   ```html
   <h2>Reset your password</h2>

   <p>We received a request to reset your password. Follow the link below to choose a new one.</p>
   <p>
     <a
       href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}"
       >Reset password</a
     >
   </p>
   ```

3. **Save** the template.

### Also add the Redirect URL

Go to **Authentication → URL Configuration → Redirect URLs** and make sure these are listed (the app URL is `https://www.covenantcollegeofhealthtech.com.ng`):

- `https://www.covenantcollegeofhealthtech.com.ng/auth/confirm`
- `https://www.covenantcollegeofhealthtech.com.ng/auth/callback`
- `https://www.covenantcollegeofhealthtech.com.ng/reset-password/confirm`

(Or use the wildcard `https://www.covenantcollegeofhealthtech.com.ng/**`.)

## (Optional) Update the Confirm Signup template too

For the same reason, the **Confirm Signup** email template should be:

```html
<h2>Confirm your email address</h2>

<p>Follow the link below to confirm this email address and finish signing up.</p>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}"
    >Confirm email address</a
  >
</p>
```

This routes signup confirmation through the same server-side `/auth/confirm` endpoint and avoids the same class of bug for email confirmation.

## Deploying

1. Deploy the app (the code changes are already in this commit).
2. Update the email templates in the Supabase dashboard (above).
3. Add the redirect URLs (above).
4. Test: request a password reset, click the link, set a new password, and sign in.

## Why the links seemed to "all expire"

They didn't actually expire — the PKCE `code` is single-use, so the *first* click failed (no `code_verifier` in the browser), and any subsequent click also failed because the code had already been consumed on the server's first attempt. The fix moves the exchange to the server, where the `token_hash` flow doesn't depend on a browser-side `code_verifier`.