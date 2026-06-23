'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TypographyH1, TypographyLead } from '@/components/ui/typography'

export function Hero() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[85vh] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Content Area */}
      <div className="flex-1 bg-secondary text-muted relative z-10 flex items-center pt-32 pb-20 lg:py-0">
        <div className="mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Badge className="bg-primary text-muted border-none px-4 py-1.5 rounded-full font-technical mb-6 text-[10px]">
              Now Admitting for 2026/2027
            </Badge>
            <TypographyH1 className="text-muted-foreground text-5xl md:text-7xl xl:text-8xl leading-[1.05] tracking-tight">
              Fluid <br /> <span className="text-primary-foreground/60 italic font-medium">Precision</span> <br /> in Medicine.
            </TypographyH1>
            <TypographyLead className="mt-8 text-muted-foreground/80 max-w-xl text-lg md:text-xl leading-relaxed">
              We merge the discipline of medical science with modern practical education. Preparing the next generation of health service leaders.
            </TypographyLead>
            <div className="mt-12 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold transition-all hover:scale-105" asChild>
                <Link href={ROUTES.admissions}>
                  Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-base font-semibold border-white/20 text-muted-foreground hover:bg-white/10" asChild>
                <Link href={ROUTES.programs}>Explore Programs</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Media Area */}
      <div className="relative flex-[1.2] min-h-[400px] lg:min-h-0 bg-muted m-4">
        <Image
          src="/images/hero-bg1.jpg"
          alt="Nursing simulation lab at CCHT"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
        
        {/* Tsunami Wave SVG - Morphing Shape */}
        <div className="absolute top-0 -left-[1px] bottom-0 w-24 xl:w-48 z-20 hidden lg:block overflow-hidden">
          <motion.svg
            viewBox="0 0 100 800"
            className="h-full w-full fill-secondary preserve-3d"
            preserveAspectRatio="none"
          >
            <motion.path
              initial={{ d: "M0,0 Q20,200 10,400 Q20,600 0,800 L0,0 Z" }}
              animate={{ 
                d: [
                  "M0,0 Q20,200 10,400 Q20,600 0,800 L0,0 Z",
                  "M0,0 Q60,200 40,400 Q60,600 0,800 L0,0 Z",
                  "M0,0 Q20,200 10,400 Q20,600 0,800 L0,0 Z"
                ] 
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </motion.svg>
        </div>

        {/* Mobile Wave */}
        <div className="absolute -top-12 left-0 right-0 h-12 z-20 lg:hidden">
           <svg viewBox="0 0 1440 120" className="w-full h-full fill-secondary">
             <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
           </svg>
        </div>
      </div>
    </section>
  )
}
