import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { EventService } from '@/lib/services/event.service'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const event = await EventService.getEventBySlug(resolvedParams.slug)
  if (!event) return { title: 'Event Not Found - CCHT' }
  return {
    title: `${event.title} - CCHT Events`,
    description: event.description,
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const event = await EventService.getEventBySlug(resolvedParams.slug)

  if (!event) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 md:px-8 lg:px-12">
          <Link href={ROUTES.events} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Link>
          
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-6">{event.title}</h1>
            
            <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-4 sm:gap-6 text-sm text-muted-foreground bg-card border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Date & Time</p>
                  <p>{new Date(event.event_date).toLocaleString()}</p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Location</p>
                    <p>{event.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {event.featured_image_url && (
            <div className="mb-12 overflow-hidden rounded-2xl bg-muted aspect-video relative">
              <img src={event.featured_image_url} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
            <h2 className="text-2xl font-bold mb-4">About this Event</h2>
            <div dangerouslySetInnerHTML={{ __html: event.description }} />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
