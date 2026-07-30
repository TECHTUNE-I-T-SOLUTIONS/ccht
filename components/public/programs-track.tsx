'use client'

import * as React from "react"
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { ArrowRight, Microscope, Stethoscope, GraduationCap, BookOpen, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { 
  TypographyH2, 
  TypographyH3, 
  TypographyP, 
  TypographyTechnical 
} from '@/components/ui/typography'
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const programIcons = [
  <Stethoscope className="h-6 w-6" />,
  <Microscope className="h-6 w-6" />,
  <GraduationCap className="h-6 w-6" />,
  <BookOpen className="h-6 w-6" />,
  <Award className="h-6 w-6" />,
  <Stethoscope className="h-6 w-6" />,
]

export function ProgramsTrack({ programs }: { programs: any[] }) {
  return (
    <Section className="bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/4 lg:sticky lg:top-32 h-fit">
          <Badge className="bg-blue-600 text-white border-none px-3 py-1 rounded-full font-technical text-xs mb-4 w-fit">
            Academic Excellence
          </Badge>
          <TypographyTechnical className="text-blue-600 dark:text-blue-400 font-bold">Academic Offerings</TypographyTechnical>
          <TypographyH2 className="mt-4 text-slate-900 dark:text-white">Programs Designed for Excellence</TypographyH2>
          <TypographyP className="mt-6 text-slate-600 dark:text-slate-400">
            Our curriculum is built on practical exposure and moral discipline, ensuring every student is ready for the real-world health sector.
          </TypographyP>
          <Button variant="link" className="mt-8 p-0 h-auto font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" asChild>
            <Link href={ROUTES.programs}>View all programs <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="lg:w-3/4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {programs.map((program, index) => (
                <CarouselItem key={program.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group h-full flex flex-col p-8 rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-xl hover:shadow-blue-700/10"
                  >
                    <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                      {programIcons[index % programIcons.length]}
                    </div>
                    <TypographyTechnical className="text-blue-600/70 dark:text-blue-400/70 text-[10px] font-bold">
                      {program.level}
                    </TypographyTechnical>
                    <TypographyH3 className="mt-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xl leading-tight text-slate-900 dark:text-white">{program.title}</TypographyH3>
                    <TypographyP className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-4 flex-1">
                      {program.description}
                    </TypographyP>
                    <Separator className="my-6 opacity-50" />
                    <Link 
                      href={`${ROUTES.programs}/${program.slug}`}
                      className="inline-flex items-center text-xs font-bold tracking-tight text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:gap-2 transition-all"
                    >
                      EXPLORE PROGRAM <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-2 mt-8 lg:mt-12">
              <CarouselPrevious className="static translate-y-0 h-12 w-12 border-blue-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700" />
              <CarouselNext className="static translate-y-0 h-12 w-12 border-blue-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700" />
            </div>
          </Carousel>
        </div>
      </div>
    </Section>
  )
}
