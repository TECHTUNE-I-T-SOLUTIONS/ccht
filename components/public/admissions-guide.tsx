'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { Section } from '@/components/ui/section'
import { 
  TypographyH2, 
  TypographyH3, 
  TypographyP, 
  TypographyTechnical 
} from '@/components/ui/typography'
import { Button } from '@/components/ui/button'

export function AdmissionsGuide() {
  const steps = [
    {
      num: "01",
      title: "Online Application",
      desc: "Begin your journey by filling out our intuitive online application form. It takes less than 15 minutes.",
    },
    {
      num: "02",
      title: "Document Verification",
      desc: "Upload your credentials for a swift verification process by our professional admissions board.",
    },
    {
      num: "03",
      title: "Entrance Evaluation",
      desc: "A brief assessment to understand your passion and potential in the health technology field.",
    }
  ]

  return (
    <Section className="bg-foreground text-background dark:bg-card p-4">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-24">
          <div>
            <TypographyTechnical className="text-primary font-bold">Admissions Guide</TypographyTechnical>
            <TypographyH2 className="mt-4 text-muted-foreground">Disciplined Steps to <br /> Your Future</TypographyH2>
          </div>

          <div className="space-y-32">
            {steps.map((step) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0.3 }}
                whileInView={{ opacity: 1 }}
                viewport={{ margin: "-100px" }}
                className="relative group"
              >
                <span className="absolute -top-12 -left-4 text-9xl font-technical font-bold text-muted-foreground/5 pointer-events-none group-hover:text-primary/10 transition-colors">
                  {step.num}
                </span>
                <TypographyH3 className="text-muted-foreground text-3xl">{step.title}</TypographyH3>
                <TypographyP className="mt-4 text-muted-foreground/60 text-lg leading-relaxed max-w-md">
                  {step.desc}
                </TypographyP>
              </motion.div>
            ))}
          </div>
          
          <Button size="lg" className="rounded-full px-12 h-16 text-lg" asChild>
            <Link href={ROUTES.admissions}>Start Admission Now</Link>
          </Button>
        </div>

        <div className="sticky top-32 hidden lg:block">
           <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem] border-8 border-white/5">
             <Image
               src="https://images.pexels.com/photos/7942517/pexels-photo-7942517.jpeg"
               alt="Student at CCHT"
               fill
               sizes="40vw"
               className="object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <div className="absolute bottom-10 left-10 right-10">
                <TypographyTechnical className="text-primary text-xs font-bold">Direct Admission</TypographyTechnical>
                <TypographyH3 className="text-muted-foreground mt-2">Simplifying the journey from interest to enrollment.</TypographyH3>
             </div>
           </div>
        </div>
      </div>
    </Section>
  )
}
