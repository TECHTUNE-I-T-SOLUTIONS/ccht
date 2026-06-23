'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from "motion/react"
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { BookOpen, Clock3, DollarSign, ArrowRight, Microscope, Stethoscope, Check } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { TypographyH1, TypographyH2, TypographyH3, TypographyP, TypographyTechnical, TypographyLead } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function ProgramsList({ programs }: { programs: any[] }) {
  return (
    <>
        {/* HERO SECTION */}
        <section className="bg-secondary text-muted-foreground pt-40 pb-20 overflow-hidden relative">
           <div className="mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                 <Badge className="bg-primary text-muted-foreground border-none px-4 py-1 rounded-full font-technical mb-6 text-[10px]">
                    ACADEMIC OFFERINGS
                 </Badge>
                 <TypographyH1 className="text-muted-foreground text-5xl md:text-7xl max-w-5xl leading-[1.1]">
                    Programs built for healthcare <span className="text-primary-foreground/50 italic font-medium">practice</span> and growth.
                 </TypographyH1>
                 <TypographyLead className="mt-8 text-muted-foreground/70 max-w-2xl text-lg md:text-xl">
                    Explore our diverse range of health technology programs designed to equip you with the skills needed for a successful career in the health sector.
                 </TypographyLead>
                 <div className="mt-12 flex flex-wrap items-center gap-4">
                    <Button size="lg" className="rounded-full px-10 h-14 font-bold" asChild>
                       <Link href={ROUTES.admissions}>Start Admission <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-10 h-14 font-bold border-white/20 text-muted-foreground hover:bg-white/10" asChild>
                       <Link href={ROUTES.login}>Portal Login</Link>
                    </Button>
                 </div>
              </motion.div>
           </div>
           
           <div className="absolute top-0 right-0 w-1/4 h-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 400 800" className="h-full w-full fill-white" preserveAspectRatio="none">
                 <path d="M400,0 Q300,200 350,400 Q300,600 400,800 L400,0 Z" />
              </svg>
           </div>
        </section>

        {/* LIST SECTION */}
        <Section className="bg-accent-soft/30 -mt-12 relative z-20 pt-0">
          <div className="max-w-7xl mx-auto">
            {programs.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {programs.map((program, index) => (
                  <motion.div
                    key={program.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Link 
                      href={`${ROUTES.programs}/${program.slug}`} 
                      className="group block h-full p-10 rounded-[3rem] bg-background border border-border/50 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden"
                    >
                      <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                        {index % 2 === 0 ? <Microscope className="h-8 w-8" /> : <Stethoscope className="h-8 w-8" />}
                      </div>
                      
                      <TypographyTechnical className="text-primary/70 font-bold text-[10px]">
                        {program.level}
                      </TypographyTechnical>
                      
                      <TypographyH3 className="mt-4 text-2xl group-hover:text-primary transition-colors leading-tight">
                        {program.title}
                      </TypographyH3>
                      
                      <TypographyP className="mt-6 text-muted-foreground line-clamp-4 leading-relaxed text-sm">
                        {program.description}
                      </TypographyP>
                      
                      <Separator className="my-8 opacity-50" />
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                             <Clock3 className="h-3.5 w-3.5" />
                             <span className="text-[10px] font-technical font-bold uppercase tracking-widest">Duration</span>
                          </div>
                          <p className="font-bold text-sm text-foreground">{program.duration_months} {program.duration_unit}</p>
                        </div>
                        <div>
                           <div className="flex items-center gap-2 text-muted-foreground mb-1">
                             <DollarSign className="h-3.5 w-3.5" />
                             <span className="text-[10px] font-technical font-bold uppercase tracking-widest">Tuition</span>
                          </div>
                          <p className="font-bold text-sm text-foreground">₦{program.tuition_fee.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                         <BookOpen className="h-24 w-24" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-[3rem] border-2 border-dashed border-border bg-background p-20 text-center text-muted-foreground">
                <TypographyH3 className="opacity-50">Program details will be published soon.</TypographyH3>
                <TypographyP>Check back later for updates on our academic offerings.</TypographyP>
              </div>
            )}
          </div>
        </Section>

        {/* INFO SECTION */}
        <Section className="bg-background border-t border-border/50">
           <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
              <div>
                 <TypographyTechnical className="text-primary font-bold">Guidelines</TypographyTechnical>
                 <TypographyH2 className="mt-4">Accredited & Professional</TypographyH2>
                 <TypographyP className="mt-8 text-lg text-muted-foreground leading-relaxed">
                    All our programs are fully accredited by the relevant national health bodies. We maintain a strict standard of practical education to ensure our students are industry-ready.
                 </TypographyP>
                 <div className="mt-12 space-y-6">
                    <CheckItem text="National Board for Technical Education (NBTE) Accredited" />
                    <CheckItem text="Practical internship placements in top hospitals" />
                    <CheckItem text="Modern laboratory facilities and simulation labs" />
                 </div>
              </div>
              
              <div className="relative aspect-square rounded-[3rem] overflow-hidden">
                 <Image 
                   src="https://images.pexels.com/photos/35645517/pexels-photo-35645517.jpeg" 
                   alt="Accreditation" 
                   fill 
                   className="object-cover"
                 />
                 <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
              </div>
           </div>
        </Section>
    </>
  )
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex gap-4">
       <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Check className="h-3.5 w-3.5 text-primary" />
       </div>
       <span className="font-bold text-foreground text-sm">{text}</span>
    </div>
  )
}
