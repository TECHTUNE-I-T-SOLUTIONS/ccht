'use client'

import * as React from "react"
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { ArrowRight, Microscope, Stethoscope } from 'lucide-react'
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

export function ProgramsTrack({ programs }: { programs: any[] }) {
  return (
    <Section className="bg-accent-soft/30 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/4 lg:sticky lg:top-32 h-fit">
          <TypographyTechnical className="text-primary font-bold">Academic Offerings</TypographyTechnical>
          <TypographyH2 className="mt-4">Programs Designed for Excellence</TypographyH2>
          <TypographyP className="mt-6 text-muted-foreground">
            Our curriculum is built on practical exposure and moral discipline, ensuring every student is ready for the real-world health sector.
          </TypographyP>
          <Button variant="link" className="mt-8 p-0 h-auto font-bold text-primary" asChild>
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
                    className="group h-full flex flex-col p-8 rounded-[2rem] bg-background border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                      {index % 2 === 0 ? <Stethoscope className="h-6 w-6" /> : <Microscope className="h-6 w-6" />}
                    </div>
                    <TypographyTechnical className="text-primary/70 text-[10px] font-bold">
                      {program.level}
                    </TypographyTechnical>
                    <TypographyH3 className="mt-3 group-hover:text-primary transition-colors text-xl leading-tight">{program.title}</TypographyH3>
                    <TypographyP className="mt-4 text-sm text-muted-foreground line-clamp-4 flex-1">
                      {program.description}
                    </TypographyP>
                    <Separator className="my-6 opacity-50" />
                    <Link 
                      href={`${ROUTES.programs}/${program.slug}`}
                      className="inline-flex items-center text-xs font-bold tracking-tight hover:gap-2 transition-all"
                    >
                      EXPLORE PROGRAM <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-2 mt-8 lg:mt-12">
              <CarouselPrevious className="static translate-y-0 h-12 w-12" />
              <CarouselNext className="static translate-y-0 h-12 w-12" />
            </div>
          </Carousel>
        </div>
      </div>
    </Section>
  )
}
