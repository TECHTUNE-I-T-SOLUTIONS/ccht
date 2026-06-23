import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SCHOOL_INFO } from '@/lib/constants'
import { AboutContent } from '@/components/public/about-content'

export const metadata = {
  title: `About | ${SCHOOL_INFO.name}`,
  description: 'Mission, vision, values, and the learning environment at the college.',
}

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
