import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { EventService } from '@/lib/services/event.service'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight, Clock } from 'lucide-react'

export const metadata = { title: 'Events - Covenant College of Health Technology' }

export default async function EventsPage() {
  const events = await EventService.getAllEvents()

  return (
    <>
      <Navbar />
      <main>
        <section className="animated-bg-surface relative overflow-hidden py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Upcoming Events</h1>
            <p className="text-lg text-foreground/70">Join us for workshops, seminars, and special events</p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {events.length > 0 ? (
              <div className="space-y-6">
                {events.map((event) => (
                  <Link key={event.id} href={`${ROUTES.events}/${event.slug}`}>
                    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary transition-all cursor-pointer group">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{event.title}</h2>
                          <p className="text-foreground/70 mb-4 line-clamp-2">{event.description}</p>
                          <div className="flex flex-col gap-3 text-sm">
                            <div className="flex items-center gap-2 text-primary">
                              <Clock className="w-4 h-4" />
                              {new Date(event.event_date).toLocaleString()}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-foreground/60">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-end justify-end">
                          <span className="text-primary font-semibold text-sm flex items-center gap-1">
                            Learn More <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <p className="text-foreground/60 text-lg">No upcoming events</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
