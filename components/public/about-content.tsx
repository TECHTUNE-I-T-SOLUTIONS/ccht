'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from "motion/react"
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { Award, Users, ShieldCheck, Target, Sparkles, ArrowRight, Check } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { TypographyH1, TypographyH2, TypographyH3, TypographyP, TypographyTechnical, TypographyLead } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const values = [
  { icon: Target, title: 'Integrity', text: 'We are committed to fostering a vibrant learning community where students, faculty, and staff can thrive.' },
  { icon: Award, title: 'Excellence', text: 'To be a globally recognized institution of excellence in health technology education, research, and innovation.' },
  { icon: ShieldCheck, title: 'Innovation', text: 'Our culture is built on the principles of innovation, inclusivity, and lifelong learning.' },
  { icon: Users, title: 'Collaboration', text: 'We foster a dynamic and collaborative environment that encourages creativity, critical thinking, and personal growth.' },
]

const faculty = [
  { 
    name: 'Dr. Adebayo Ilufoye', 
    role: 'Director of the School', 
    image: '/images/Doctor.jpeg' 
  },
  { 
    name: 'Elder Gideon B Oladele', 
    role: 'Provost (Acting Capacity)', 
    image: '/images/logo.png' 
  },
  { 
    name: 'Mr. A. K. Imam', 
    role: 'Head of Community Health Department', 
    image: '/images/logo.png' 
  },
]

export function AboutContent() {
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
                    OUR INSTITUTION
                 </Badge>
                 <TypographyH1 className="text-muted-foreground text-5xl md:text-7xl max-w-4xl leading-[1.1]">
                    Built around health technology, discipline, and <span className="text-primary-foreground/50 italic font-medium">practical</span> readiness.
                 </TypographyH1>
                 <TypographyLead className="mt-8 text-muted-foreground/70 max-w-2xl text-lg md:text-xl">
                    {SCHOOL_INFO.fullname} exists to prepare students for meaningful service in community health, medical laboratory technology, and public health services.
                 </TypographyLead>
                 <div className="mt-12 flex items-center gap-6">
                    <Button size="lg" className="rounded-full px-10 h-14 font-bold border border-black dark:border-white shadow-lg hover:bg-blue-300" asChild>
                       <Link href={ROUTES.admissions}>Apply for Admission <Award className="ml-2 h-4 w-4" /></Link>
                    </Button>
                 </div>
              </motion.div>
           </div>
           
           {/* Background Decoration */}
           <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 400 800" className="h-full w-full fill-white" preserveAspectRatio="none">
                 <path d="M400,0 Q300,200 350,400 Q300,600 400,800 L400,0 Z" />
              </svg>
           </div>
        </section>

        {/* MISSION & VISION */}
        <Section className="bg-accent-soft/30 -mt-12 relative z-20 pt-0">
           <div className="grid gap-8 lg:grid-cols-2 max-w-7xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-background rounded-[3rem] p-10 md:p-14 border border-border shadow-2xl shadow-primary/5 group hover:border-primary/20 transition-all"
              >
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                    <Target className="h-8 w-8" />
                 </div>
                 <TypographyH2 className="text-3xl font-bold">Mission</TypographyH2>
                 <TypographyP className="mt-6 text-muted-foreground text-lg leading-relaxed">
                    To foster a dynamic and inclusive learning environment that promotes critical thinking, collaboration, and innovation, equipping students with the knowledge and skills needed to advance healthcare delivery, improve public health outcomes, and drive sustainable community development.
                 </TypographyP>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-background rounded-[3rem] p-10 md:p-14 border border-border shadow-2xl shadow-primary/5 group hover:border-secondary/20 transition-all"
              >
                 <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-8 group-hover:scale-110 transition-transform">
                    <Award className="h-8 w-8" />
                 </div>
                 <TypographyH2 className="text-3xl font-bold">Vision</TypographyH2>
                 <TypographyP className="mt-6 text-muted-foreground text-lg leading-relaxed">
                    To be a globally recognized institution of excellence in health technology education, research, and innovation, producing skilled professionals dedicated to delivering transformative healthcare solutions and improving the quality of life for all.
                 </TypographyP>
              </motion.div>
           </div>
        </Section>

        {/* CORE VALUES */}
        <Section className="bg-background">
           <div className="text-center max-w-3xl mx-auto mb-20">
              <TypographyTechnical className="text-primary font-bold">Principles</TypographyTechnical>
              <TypographyH2 className="mt-4">Our Core Values</TypographyH2>
              <TypographyP className="mt-6 text-muted-foreground">
                 These fundamental beliefs guide our academic journey and professional conduct every single day.
              </TypographyP>
           </div>

           <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto">
              {values.map((item, index) => (
                <motion.article 
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-[2.5rem] border border-border/50 bg-card p-10 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-muted-foreground transition-colors">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <TypographyH3 className="text-xl">{item.title}</TypographyH3>
                  <TypographyP className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {item.text}
                  </TypographyP>
                </motion.article>
              ))}
           </div>
        </Section>

        {/* TEAM / LEADERSHIP PREVIEW */}
        <Section className="bg-foreground text-background dark:bg-card">
           <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-16">
              <div className="max-w-2xl">
                 <TypographyTechnical className="text-primary font-bold">Leadership</TypographyTechnical>
                 <TypographyH2 className="mt-4 text-muted-foreground">Guided by Experienced Health Professionals</TypographyH2>
              </div>
              <Button variant="outline" className="rounded-full px-8 h-12 border-white/20 text-muted-foreground hover:bg-white/10" asChild>
                 <Link href={ROUTES.contact}>Meet our faculty <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
           </div>
           
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {faculty.map((member) => (
                 <div key={member.name} className="group relative aspect-[3/4] overflow-hidden rounded-[3rem]">
                    <Image 
                      src={member.image} 
                      alt={member.name} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10">
                       <p className="text-white font-bold text-xl font-display">{member.name}</p>
                       <p className="text-white/70 text-[10px] font-technical mt-1 uppercase tracking-widest font-bold">{member.role}</p>
                    </div>
                 </div>
              ))}
           </div>
        </Section>
    </>
  )
}
