'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { CalendarDays, Clock, MapPin, Newspaper, Bell } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Badge } from '@/components/ui/badge'
import { TypographyH2, TypographyH3, TypographyP, TypographyTechnical } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function NewsAndEvents({ blogPosts, events }: { blogPosts: any[], events: any[] }) {
  return (
    <Section className="bg-gradient-to-b from-white to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="grid lg:grid-cols-12 gap-16">
        {/* News Column */}
        <div className="lg:col-span-7">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge className="bg-blue-600 text-white border-none px-3 py-1 rounded-full font-technical text-xs mb-4 w-fit">
                <Newspaper className="h-3 w-3 mr-1" /> Bulletins
              </Badge>
              <TypographyTechnical className="text-blue-600 dark:text-blue-400 font-bold">Latest Updates</TypographyTechnical>
              <TypographyH2 className="mt-4 text-slate-900 dark:text-white">Latest from CCHT</TypographyH2>
            </div>
            <Button variant="link" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" asChild>
              <Link href={ROUTES.blog}>Read all news <Bell className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="space-y-12">
            {blogPosts.length > 0 ? (
              <>
                <article className="group relative">
                   <div className="relative aspect-video overflow-hidden rounded-2xl mb-8 border border-blue-100 dark:border-slate-700">
                     <Image 
                       src="/images/CONVENT3.jpg.jpeg" 
                       alt={blogPosts[0].title} 
                       fill 
                       sizes="(max-width: 1024px) 100vw, 60vw"
                       className="object-cover transition-transform duration-700 group-hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-technical text-slate-600 dark:text-slate-400 font-bold">
                      <span>{blogPosts[0].published_at ? new Date(blogPosts[0].published_at).toLocaleDateString() : 'LATEST NEWS'}</span>
                      <Separator orientation="vertical" className="h-3 bg-blue-200 dark:bg-slate-700" />
                      <span className="text-blue-600 dark:text-blue-400">COLLEGE UPDATE</span>
                   </div>
                   <TypographyH3 className="mt-4 text-3xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer leading-tight text-slate-900 dark:text-white">
                     <Link href={`${ROUTES.blog}/${blogPosts[0].slug}`}>{blogPosts[0].title}</Link>
                   </TypographyH3>
                   <TypographyP className="mt-4 text-slate-600 dark:text-slate-400 line-clamp-2 max-w-2xl text-base">
                     {blogPosts[0].summary || "Stay updated with the latest happenings, academic breakthroughs, and college community announcements."}
                   </TypographyP>
                </article>

                <div className="grid md:grid-cols-2 gap-8 pt-12 border-t border-blue-100 dark:border-slate-700">
                  {blogPosts.slice(1, 3).map((post) => (
                    <Link key={post.id} href={`${ROUTES.blog}/${post.slug}`} className="group block">
                      <span className="text-[10px] font-technical text-slate-600 dark:text-slate-400 font-bold">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'NEWS'}
                      </span>
                      <h4 className="mt-2 text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug text-slate-900 dark:text-white">{post.title}</h4>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-12 border-2 border-dashed border-blue-200 dark:border-slate-700 rounded-2xl text-center text-slate-600 dark:text-slate-400">
                No news articles published yet.
              </div>
            )}
          </div>
        </div>

        {/* Events Column */}
        <div className="lg:col-span-5">
           <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-3xl p-10 xl:p-14 shadow-lg shadow-blue-700/10">
              <div className="flex items-center justify-between mb-10">
                <TypographyH3 className="text-xl text-slate-900 dark:text-white">Upcoming Events</TypographyH3>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-10">
                {events.length > 0 ? events.map((event) => {
                  const date = new Date(event.event_date)
                  return (
                    <Link key={event.id} href={`${ROUTES.events}/${event.slug}`} className="flex gap-8 group">
                      <div className="flex flex-col items-center justify-center h-20 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                        <span className="text-2xl font-technical font-bold">{date.getDate()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          {date.toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 text-[10px] font-technical text-blue-600 dark:text-blue-400 font-bold mb-2">
                           <Clock className="h-3 w-3" />
                           <span>{event.event_time || "09:00 AM"}</span>
                        </div>
                        <h4 className="text-base font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate text-slate-900 dark:text-white">
                          {event.title}
                        </h4>
                        <div className="mt-2 flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                           <MapPin className="h-3 w-3" />
                           <span>{event.location || "College Campus"}</span>
                        </div>
                      </div>
                    </Link>
                  )
                }) : (
                  <p className="text-slate-600 dark:text-slate-400 text-center py-10">No upcoming events scheduled.</p>
                )}
              </div>

              <Button variant="outline" className="w-full mt-12 rounded-full h-14 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-slate-900 transition-all font-bold" asChild>
                <Link href={ROUTES.events}>View All Events</Link>
              </Button>
           </div>
        </div>
      </div>
    </Section>
  )
}
