'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { TypographyH2, TypographyH3, TypographyP, TypographyTechnical } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function NewsAndEvents({ blogPosts, events }: { blogPosts: any[], events: any[] }) {
  return (
    <Section className="bg-background">
      <div className="grid lg:grid-cols-12 gap-16">
        {/* News Column */}
        <div className="lg:col-span-7">
          <div className="flex items-end justify-between mb-12">
            <div>
              <TypographyTechnical className="text-primary font-bold">Bulletins</TypographyTechnical>
              <TypographyH2 className="mt-4">Latest from CCHT</TypographyH2>
            </div>
            <Button variant="link" className="font-bold text-primary" asChild>
              <Link href={ROUTES.blog}>Read all news</Link>
            </Button>
          </div>

          <div className="space-y-12">
            {blogPosts.length > 0 ? (
              <>
                <article className="group relative">
                   <div className="relative aspect-video overflow-hidden rounded-[2.5rem] mb-8">
                     <Image 
                       src="/images/CONVENT3.jpg.jpeg" 
                       alt={blogPosts[0].title} 
                       fill 
                       sizes="(max-width: 1024px) 100vw, 60vw"
                       className="object-cover transition-transform duration-700 group-hover:scale-105"
                     />
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-technical text-muted-foreground font-bold">
                      <span>{blogPosts[0].published_at ? new Date(blogPosts[0].published_at).toLocaleDateString() : 'LATEST NEWS'}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-primary">COLLEGE UPDATE</span>
                   </div>
                   <TypographyH3 className="mt-4 text-3xl group-hover:text-primary transition-colors cursor-pointer leading-tight">
                     <Link href={`${ROUTES.blog}/${blogPosts[0].slug}`}>{blogPosts[0].title}</Link>
                   </TypographyH3>
                   <TypographyP className="mt-4 text-muted-foreground line-clamp-2 max-w-2xl text-base">
                     {blogPosts[0].summary || "Stay updated with the latest happenings, academic breakthroughs, and college community announcements."}
                   </TypographyP>
                </article>

                <div className="grid md:grid-cols-2 gap-8 pt-12 border-t border-border/50">
                  {blogPosts.slice(1, 3).map((post) => (
                    <Link key={post.id} href={`${ROUTES.blog}/${post.slug}`} className="group block">
                      <span className="text-[10px] font-technical text-muted-foreground font-bold">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'NEWS'}
                      </span>
                      <h4 className="mt-2 text-lg font-bold group-hover:text-primary transition-colors leading-snug">{post.title}</h4>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-12 border-2 border-dashed border-border rounded-[2.5rem] text-center text-muted-foreground">
                No news articles published yet.
              </div>
            )}
          </div>
        </div>

        {/* Events Column */}
        <div className="lg:col-span-5">
           <div className="bg-card border border-border/50 rounded-[3rem] p-10 xl:p-14">
              <div className="flex items-center justify-between mb-10">
                <TypographyH3 className="text-xl">Upcoming Events</TypographyH3>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-10">
                {events.length > 0 ? events.map((event) => {
                  const date = new Date(event.event_date)
                  return (
                    <Link key={event.id} href={`${ROUTES.events}/${event.slug}`} className="flex gap-8 group">
                      <div className="flex flex-col items-center justify-center h-20 w-16 bg-accent-soft rounded-2xl border border-primary/5 group-hover:bg-primary group-hover:text-muted-foreground transition-colors shrink-0">
                        <span className="text-2xl font-technical font-bold">{date.getDate()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          {date.toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 text-[10px] font-technical text-primary font-bold mb-2">
                           <Clock className="h-3 w-3" />
                           <span>{event.event_time || "09:00 AM"}</span>
                        </div>
                        <h4 className="text-base font-bold group-hover:text-primary transition-colors leading-tight truncate">
                          {event.title}
                        </h4>
                        <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                           <MapPin className="h-3 w-3" />
                           <span>{event.location || "College Campus"}</span>
                        </div>
                      </div>
                    </Link>
                  )
                }) : (
                  <p className="text-muted-foreground text-center py-10">No upcoming events scheduled.</p>
                )}
              </div>

              <Button variant="outline" className="w-full mt-12 rounded-full h-14 border-primary/20 text-primary hover:bg-primary hover:text-muted-foreground transition-all font-bold" asChild>
                <Link href={ROUTES.events}>View All Events</Link>
              </Button>
           </div>
        </div>
      </div>
    </Section>
  )
}
