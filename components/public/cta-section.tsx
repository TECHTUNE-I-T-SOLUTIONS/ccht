'use client'

import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { TypographyH2, TypographyP } from '@/components/ui/typography'

export function CTASection() {
  return (
    <Section className="bg-primary py-20 text-primary-foreground text-center p-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <TypographyH2 className="text-muted-foreground">Ready to begin your medical career?</TypographyH2>
        <TypographyP className="mx-auto mt-4 max-w-2xl text-muted-foreground/80">
          Join a community dedicated to excellence, discipline, and practical health service. Your journey to becoming a health professional starts here.
        </TypographyP>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" variant="secondary" className="rounded-full" asChild>
            <Link href={ROUTES.admissions}>Apply Now</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-white text-muted-foreground hover:bg-white/10" asChild>
            <Link href={ROUTES.contact}>Contact Support</Link>
          </Button>
        </div>
      </motion.div>
    </Section>
  )
}
