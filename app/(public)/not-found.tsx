import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES } from '@/lib/constants'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-[calc(100vh-400px)] py-16">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-primary/20 mb-4">404</h1>
              <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
              <p className="text-foreground/70 mb-8">
                The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={ROUTES.home}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Home className="w-4 h-4" /> Go Home
              </Link>
              <Link
                href={ROUTES.contact}
                className="inline-flex items-center justify-center gap-2 border border-primary text-primary px-6 py-2 rounded-lg font-semibold hover:bg-primary/5 transition-colors"
              >
                <Search className="w-4 h-4" /> Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
