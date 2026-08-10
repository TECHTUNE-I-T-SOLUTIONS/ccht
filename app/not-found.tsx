'use client'

import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Search, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 px-4">
      <div className="max-w-2xl w-full">
        <div className="rounded-[2.5rem] border border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-12 text-center shadow-2xl">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
            <Search className="h-12 w-12" />
          </div>
          
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">Error 404</p>
          <h1 className="mt-4 text-5xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Page not found
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-600 dark:text-slate-400">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href={ROUTES.home}>
              <Button className="rounded-full px-8 py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Home className="mr-2 h-5 w-5" />
                Go home
              </Button>
            </Link>
            <Link href={ROUTES.login}>
              <Button variant="outline" className="rounded-full px-8 py-6 text-base font-semibold">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Portal login
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Looking for something specific?{' '}
              <a href="mailto:info@covenantcollegeofhealthtech.com.ng" className="text-primary hover:underline">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
