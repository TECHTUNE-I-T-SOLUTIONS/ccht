'use client'

import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { ArrowRight, GraduationCap, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { TypographyH2, TypographyP } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'

export function CTASection() {
  return (
    <Section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-950 dark:to-slate-900 py-20 text-white text-center p-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        <Badge className="bg-white/20 text-white border-white/30 px-4 py-1.5 rounded-full font-technical text-xs mb-6">
          <Heart className="h-3 w-3 mr-1" /> Join Our Community
        </Badge>
        <TypographyH2 className="text-white">Ready to begin your medical career?</TypographyH2>
        <TypographyP className="mx-auto mt-4 max-w-2xl text-white/90">
          Join a community dedicated to excellence, discipline, and practical health service. Your journey to becoming a health professional starts here with our newly enhanced, secure platform.
        </TypographyP>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" variant="secondary" className="rounded-full border border-white bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl hover:shadow-blue-900/20" asChild>
            <Link href={ROUTES.admissions}>Apply Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50" asChild>
            <Link href={ROUTES.contact}>Contact Support</Link>
          </Button>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 items-center">
          <div className="flex items-center gap-2 text-white/80">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">Accredited Programs</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-white/80">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Student-Centered</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-white/80">
            <ArrowRight className="h-5 w-5" />
            <span className="text-sm font-medium">Career Ready</span>
          </div>
        </div>
      </motion.div>
    </Section>
  )
}
