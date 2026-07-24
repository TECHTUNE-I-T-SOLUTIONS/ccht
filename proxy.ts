import { type NextRequest, NextResponse } from 'next/server'
import { createClient, hasSupabaseAuthEnv } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that do not require authentication.
  const publicRoutes = [
    '/',
    '/about',
    '/admissions',
    '/admissions/apply',
    '/programs',
    '/blog',
    '/events',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/login',
    '/register',
    '/forgot-password',
    '/secure/admin/login',
    '/secure/admin/signup',
    '/secure/signup',
    '/sw.js',
    '/lecturer-signup',
    '/student-signup',
  ]

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Allow app startup in development when Supabase env vars are not configured yet.
  if (!hasSupabaseAuthEnv()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[proxy] Supabase auth env vars are missing. Skipping auth checks in development.',
      )
      return NextResponse.next()
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const supabase = createClient(request)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // If no session, redirect to login.
    if (!user || error) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Get user role from profiles table.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'student'

    // Check role-based access.
    if (pathname.startsWith('/student') && userRole !== 'student') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/teacher') && !['teacher', 'lecturer'].includes(userRole)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/secure/admin/login', request.url))
    }

    if (pathname.startsWith('/aspirant') && !['aspirant', 'student', 'admin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/admissions', request.url))
    }

    // Attach user info to request for use in components.
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', userRole)
    requestHeaders.set('x-user-email', user.email || '')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('[proxy] Auth guard error:', error)

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (public image assets)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|apple-icon.png|icon.svg|icon-dark-32x32.png|icon-light-32x32.png|placeholder.*).*)',
  ],
}
