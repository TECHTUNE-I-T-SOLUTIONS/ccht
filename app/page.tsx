import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { Suspense } from 'react'
import { SCHOOL_INFO } from '@/lib/constants'

// Client Components
import { Hero } from '@/components/public/hero'
import { AdmissionsGuide } from '@/components/public/admissions-guide'
import { CampusLife } from '@/components/public/campus-life'
import { CTASection } from '@/components/public/cta-section'
import { NoticeBar } from '@/components/public/notice-bar'
import { ScamWarningModal } from '@/components/public/scam-warning-modal'

// Server Components with Suspense
import { ProgramsTrack } from '@/components/public/programs-track'
import { NewsAndEvents } from '@/components/public/news-and-events'

// Loading Components
function ProgramsLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-4xl">
        <div className="h-8 bg-blue-100 dark:bg-slate-700 rounded w-1/4" />
        <div className="h-12 bg-blue-100 dark:bg-slate-700 rounded w-1/2" />
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-blue-100 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function NewsEventsLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full">
        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-8">
            <div className="h-8 bg-blue-100 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-64 bg-blue-100 dark:bg-slate-700 rounded-2xl" />
            <div className="h-6 bg-blue-100 dark:bg-slate-700 rounded w-1/2" />
          </div>
          <div className="lg:col-span-5">
            <div className="h-96 bg-blue-100 dark:bg-slate-700 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

async function ProgramsData() {
  const { ProgramService } = await import('@/lib/services/program.service')
  const programs = await ProgramService.getAllPrograms(6)
  return <ProgramsTrack programs={programs} />
}

async function NewsEventsData() {
  const { BlogService } = await import('@/lib/services/blog.service')
  const { EventService } = await import('@/lib/services/event.service')
  const [blogPosts, events] = await Promise.all([
    BlogService.getAllBlogPosts(4),
    EventService.getUpcomingEvents(4),
  ])
  return <NewsAndEvents blogPosts={blogPosts} events={events} />
}

export const metadata = {
  title: `${SCHOOL_INFO.name} | Professional Health Education`,
  description: 'Covenant College of Health Technology: Discipline, practical health education, and professional excellence.',
}

export default async function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <NoticeBar />
      <main className="flex-1 overflow-hidden">
        <Hero />
        <Suspense fallback={<ProgramsLoading />}>
          <ProgramsData />
        </Suspense>
        <AdmissionsGuide />
        <CampusLife />
        <Suspense fallback={<NewsEventsLoading />}>
          <NewsEventsData />
        </Suspense>
        <CTASection />
      </main>
      <Footer />
      <ScamWarningModal />
    </div>
  )
}
