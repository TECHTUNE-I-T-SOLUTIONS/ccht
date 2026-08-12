import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { AboutContent } from '@/components/public/about-content'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'About',
  description: 'Mission, vision, values, and the learning environment at the college.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AboutContent />
      </main>
      <Footer />
    </div>
  )
}
