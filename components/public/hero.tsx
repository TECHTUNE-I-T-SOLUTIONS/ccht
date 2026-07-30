'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ArrowRight, Shield, Lock, Zap, CheckCircle, GraduationCap, Stethoscope, Microscope, HeartPulse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TypographyH1, TypographyLead } from '@/components/ui/typography'

export function Hero() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[85vh] flex flex-col lg:flex-row overflow-hidden pt-24">
      {/* Left Content Area */}
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 relative z-10 flex items-center pt-20 pb-20 lg:py-0">
        <div className="mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 max-w-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge className="bg-blue-600 text-white border-none px-4 py-1.5 rounded-full font-technical text-xs">
                Now Admitting for 2026/2027
              </Badge>
              <Badge className="bg-emerald-600 text-white border-none px-4 py-1.5 rounded-full font-technical text-xs flex items-center gap-1">
                <Shield className="h-3 w-3" /> New Secure Platform
              </Badge>
            </div>
            <TypographyH1 className="text-slate-900 dark:text-white text-5xl md:text-7xl xl:text-8xl leading-[1.05] tracking-tight">
              {SCHOOL_INFO.name}
            </TypographyH1>
            <TypographyLead className="mt-8 text-slate-700 dark:text-slate-300 max-w-xl text-lg md:text-xl leading-relaxed">
              Experience our newly enhanced, secure platform. We merge the discipline of medical science with modern practical education, preparing the next generation of health service leaders with cutting-edge technology.
            </TypographyLead>
            
            {/* Feature Highlights */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Lock className="h-4 w-4 text-blue-600" />
                <span>Secure Login</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Zap className="h-4 w-4 text-blue-600" />
                <span>Fast Access</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span>Verified Data</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Privacy First</span>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-4 mb-12">
              <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold transition-all hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:shadow-lg hover:shadow-blue-700" asChild>
                <Link href={ROUTES.admissions}>
                  Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-base font-semibold border-blue-600 text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-lg hover:shadow-blue-700" asChild>
                <Link href={ROUTES.programs}>Explore Programs</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Media Area */}
      <div className="relative flex-[1.2] min-h-[400px] lg:min-h-0 bg-blue-100 dark:bg-slate-700 m-4 rounded-2xl overflow-hidden">
        <Image
          src="/images/hero-bg1.jpg"
          alt="Nursing simulation lab at CCHT"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDsABAP/XA"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent mix-blend-multiply" />
        
        {/* Floating Icons */}
        <div className="absolute top-8 right-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <GraduationCap className="h-6 w-6 text-blue-600" />
        </div>
        <div className="absolute bottom-8 left-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <Stethoscope className="h-6 w-6 text-blue-600" />
        </div>
        <div className="absolute top-1/2 right-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <Microscope className="h-6 w-6 text-blue-600" />
        </div>
        <div className="absolute bottom-1/3 right-24 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <HeartPulse className="h-6 w-6 text-blue-600" />
        </div>
        
        {/* Tsunami Wave SVG - Morphing Shape */}
        <div className="absolute top-0 -left-[1px] bottom-0 w-24 xl:w-48 z-20 hidden lg:block overflow-hidden">
          <motion.svg
            viewBox="0 0 100 800"
            className="h-full w-full fill-blue-50 dark:fill-slate-800 preserve-3d"
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
           <svg viewBox="0 0 1440 120" className="w-full h-full fill-blue-50 dark:fill-slate-800">
             <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
           </svg>
        </div>
      </div>
    </section>
  )
}
