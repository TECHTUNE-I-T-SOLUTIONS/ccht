import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { ServerCrash, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ServerErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-red-950 px-4">
      <div className="max-w-2xl w-full">
        <div className="rounded-[2.5rem] border border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-12 text-center shadow-2xl">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg">
            <ServerCrash className="h-12 w-12" />
          </div>
          
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-400">Error 500</p>
          <h1 className="mt-4 text-5xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Server error
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-600 dark:text-slate-400">
            Our servers are experiencing technical difficulties. Our team has been notified and is working to resolve the issue as quickly as possible.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={() => window.location.reload()}
              className="rounded-full px-8 py-6 text-base font-semibold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try again
            </Button>
            <Link href={ROUTES.home}>
              <Button variant="outline" className="rounded-full px-8 py-6 text-base font-semibold">
                <Home className="mr-2 h-5 w-5" />
                Go home
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border">
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-red-700 dark:text-red-400">What you can do:</strong>
              </p>
              <ul className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-left space-y-1">
                <li>• Refresh the page or try again later</li>
                <li>• Check your internet connection</li>
                <li>• If the problem persists, contact support</li>
                <li>• Our team is actively working on a fix</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
