'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ROUTES } from '@/lib/constants'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Something went wrong</p>
        <h1 className="mt-4 text-4xl font-extrabold">We hit an unexpected error</h1>
        <p className="mt-3 text-sm leading-7 text-foreground/70">
          Please try again. If the issue continues, return to the home page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Try again
          </button>
          <Link href={ROUTES.home} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
