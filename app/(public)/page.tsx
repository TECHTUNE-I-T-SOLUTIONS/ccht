import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ProgramService } from '@/lib/services/program.service'
import { BlogService } from '@/lib/services/blog.service'
import { EventService } from '@/lib/services/event.service'
import { SCHOOL_INFO } from '@/lib/constants'

// Client Components
import { Hero } from '@/components/public/hero'
import { ProgramsTrack } from '@/components/public/programs-track'
import { AdmissionsGuide } from '@/components/public/admissions-guide'
import { CampusLife } from '@/components/public/campus-life'
import { NewsAndEvents } from '@/components/public/news-and-events'
import { CTASection } from '@/components/public/cta-section'

export const metadata = {
  title: `${SCHOOL_INFO.name} | Professional Health Education`,
  description: 'Covenant College of Health Technology: Discipline, practical health education, and professional excellence.',
}

async function getHomeData() {
  try {
    const [programs, blogPosts, events] = await Promise.all([
      ProgramService.getAllPrograms(6),
      BlogService.getAllBlogPosts(4),
      EventService.getUpcomingEvents(4),
    ])
    return { programs, blogPosts, events }
  } catch (error) {
    console.error('Failed to load homepage data:', error)
    return { programs: [], blogPosts: [], events: [] }
  }
}

export default async function HomePage() {
  const { programs, blogPosts, events } = await getHomeData()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <Hero />
        <ProgramsTrack programs={programs} />
        <AdmissionsGuide />
        <CampusLife />
        <NewsAndEvents blogPosts={blogPosts} events={events} />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
