import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    const response = NextResponse.json({ success: true }, { status: 200 })

    if (error) {
      console.error('[ccht] Logout error:', error)
    }

    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb:token',
      'supabase-auth-token.0',
      'supabase-auth-token.1',
    ]

    cookieNames.forEach((name) => {
      response.cookies.set(name, '', { path: '/', maxAge: 0, expires: new Date(0) })
    })
    return response
  } catch (error) {
    console.error('[ccht] Logout route error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
