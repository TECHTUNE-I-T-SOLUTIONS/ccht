import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Page not found</p>
        <h1 className="mt-4 text-4xl font-extrabold">We could not find that page</h1>
        <p className="mt-3 text-sm leading-7 text-foreground/70">
          The page may have moved, or the link may be outdated.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={ROUTES.home} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Go home
          </Link>
          <Link href={ROUTES.login} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">
            Portal login
          </Link>
        </div>
      </div>
    </main>
  )
}
