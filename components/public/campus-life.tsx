'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Section } from '@/components/ui/section'
import { TypographyH3, TypographyTechnical } from '@/components/ui/typography'

export function CampusLife() {
  const images = [
    { src: "https://images.pexels.com/photos/7683897/pexels-photo-7683897.jpeg", size: "lg" },
    { src: "https://images.pexels.com/photos/14082032/pexels-photo-14082032.jpeg", size: "sm" },
    { src: "https://images.unsplash.com/photo-1737785138561-204bc46538b6?crop=entropy&cs=srgb&fm=jpg&q=85", size: "md" },
    { src: "https://images.pexels.com/photos/36380795/pexels-photo-36380795.jpeg", size: "sm" },
  ]

  return (
    <Section fullWidth className="px-0 py-0">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 min-h-[600px]">
        <div className="relative group overflow-hidden border-r border-background aspect-[4/5] md:aspect-auto">
          <Image 
            src={images[0].src} 
            alt="Campus life" 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="grid grid-rows-2">
          <div className="relative group overflow-hidden border-b border-background aspect-square md:aspect-auto">
            <Image 
              src={images[1].src} 
              alt="Campus life" 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="bg-primary flex flex-col justify-center p-12 text-muted-foreground">
            <TypographyTechnical className="text-muted-foreground/70 font-bold">Student Voice</TypographyTechnical>
            <p className="mt-6 text-2xl md:text-3xl font-display font-medium italic leading-snug">
              "The environment here isn't just about books; it's about finding your purpose in the health sector."
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-12 h-[2px] bg-white/30" />
              <span className="font-bold text-sm tracking-widest uppercase font-technical">CHIDERA A.</span>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden border-r border-background aspect-[4/5] md:aspect-auto">
          <Image 
            src={images[2].src} 
            alt="Campus life" 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 to-transparent">
             <TypographyH3 className="text-muted-foreground text-2xl">A Community of Care</TypographyH3>
             <Link href="#" className="mt-4 text-primary text-[10px] font-bold tracking-[0.2em] inline-block uppercase font-technical">EXPLORE CAMPUS LIFE</Link>
          </div>
        </div>

        <div className="grid grid-rows-2">
          <div className="bg-secondary p-12 text-muted-foreground flex flex-col justify-between aspect-square md:aspect-auto">
              <TypographyTechnical className="text-muted-foreground/60 font-bold">Campus Stats</TypographyTechnical>
              <div>
                <span className="text-6xl font-technical font-bold">12+</span>
                <p className="mt-2 text-muted-foreground/70 font-medium">Health Programs Accredited</p>
              </div>
              <Link href={ROUTES.about} className="text-[10px] font-bold underline underline-offset-8 uppercase font-technical tracking-widest">LEARN MORE ABOUT US</Link>
          </div>
          <div className="relative group overflow-hidden aspect-square md:aspect-auto">
            <Image 
              src={images[3].src} 
              alt="Campus life" 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </Section>
  )
}
