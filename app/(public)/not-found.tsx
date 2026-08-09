import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES } from '@/lib/constants'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-[calc(100vh-400px)] py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="mb-8">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                <Search className="h-10 w-10" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400 mb-2">Error 404</p>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Page Not Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                The page you're looking for doesn't exist or has been moved. Let's get you back on track.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={ROUTES.home}>
                <Button className="rounded-full px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Home className="mr-2 h-5 w-5" /> Go Home
                </Button>
              </Link>
              <Link href={ROUTES.contact}>
                <Button variant="outline" className="rounded-full px-6 py-3 text-base font-semibold">
                  <Search className="mr-2 h-5 w-5" /> Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
