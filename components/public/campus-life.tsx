'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Users, Award, GraduationCap, ArrowRight } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Badge } from '@/components/ui/badge'
import { TypographyH3, TypographyTechnical } from '@/components/ui/typography'

export function CampusLife() {
  const images = [
    { src: "/images/students.jpg", size: "md" },
    { src: "/images/WhatsApp Image 2026-07-10 at 6.08.44 AM.jpeg", size: "sm" },
    { src: "/images/WhatsApp Image 2026-07-10 at 6.08.36 AM.jpeg", size: "md" },
    { src: "/images/WhatsApp Image 2026-07-10 at 6.08.42 AM.jpeg", size: "sm" },
  ]

  return (
    <Section fullWidth className="px-0 py-0">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 min-h-[600px]">
        <div className="relative group overflow-hidden border-r border-blue-100 dark:border-slate-700 aspect-[4/5] md:aspect-auto">
          <Image 
            src={images[0].src} 
            alt="Campus life" 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={75}
            loading="lazy"
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">Campus Life</Badge>
          </div>
        </div>
        
        <div className="grid grid-rows-2">
          <div className="relative group overflow-hidden border-b border-blue-100 dark:border-slate-700 aspect-square md:aspect-auto">
            <Image 
              src={images[1].src} 
              alt="Campus life" 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              quality={75}
              loading="lazy"
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 flex flex-col justify-center p-12 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <TypographyTechnical className="text-blue-600 dark:text-blue-400 font-bold">Student Voice</TypographyTechnical>
            </div>
            <p className="mt-6 text-2xl md:text-3xl font-display font-medium italic leading-snug text-slate-800 dark:text-slate-200">
              "The environment here isn't just about books; it's more about finding your purpose in the health sector."
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-12 h-[2px] bg-blue-600" />
              <span className="font-bold text-sm tracking-widest uppercase font-technical text-slate-600 dark:text-slate-400">PATIENCE A.</span>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden border-r border-blue-100 dark:border-slate-700 aspect-[4/5] md:aspect-auto">
          <Image 
            src={images[2].src} 
            alt="Campus life" 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={75}
            loading="lazy"
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-blue-900/80 to-transparent">
             <TypographyH3 className="text-white text-2xl">A Community of Care</TypographyH3>
             <Link href={ROUTES.about} className="mt-4 text-white text-[10px] font-bold tracking-[0.2em] inline-block uppercase font-technical flex items-center gap-2 hover:gap-3 transition-all">
               EXPLORE CAMPUS LIFE <ArrowRight className="h-4 w-4" />
             </Link>
          </div>
        </div>

        <div className="grid grid-rows-2">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 p-12 text-white flex flex-col justify-between aspect-square md:aspect-auto">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <TypographyTechnical className="text-white/80 font-bold">Campus Stats</TypographyTechnical>
              </div>
              <div>
                <span className="text-6xl font-technical font-bold">4+</span>
                <p className="mt-2 text-white/90 font-medium">Health Programs Accredited</p>
              </div>
              <Link href={ROUTES.about} className="text-[10px] font-bold underline underline-offset-8 uppercase font-technical tracking-widest text-white/80 hover:text-white flex items-center gap-2">
                LEARN MORE ABOUT US <ArrowRight className="h-4 w-4" />
              </Link>
          </div>
          <div className="relative group overflow-hidden aspect-square md:aspect-auto">
            <Image 
              src={images[3].src} 
              alt="Campus life" 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              quality={75}
              loading="lazy"
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
