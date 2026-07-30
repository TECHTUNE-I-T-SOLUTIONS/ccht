'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from "motion/react"
import { ROUTES } from '@/lib/constants'
import { FileText, CheckCircle, ClipboardCheck, ArrowRight } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Badge } from '@/components/ui/badge'
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
      icon: <FileText className="h-6 w-6" />
    },
    {
      num: "02",
      title: "Document Verification",
      desc: "Upload your credentials for a swift verification process by our professional admissions board.",
      icon: <CheckCircle className="h-6 w-6" />
    },
    {
      num: "03",
      title: "Entrance Evaluation",
      desc: "A brief assessment to understand your passion and potential in the health technology field.",
      icon: <ClipboardCheck className="h-6 w-6" />
    }
  ]

  return (
    <Section className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-slate-900 text-white p-4">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-24">
          <div>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 rounded-full font-technical text-xs mb-4 w-fit">
              Easy Process
            </Badge>
            <TypographyTechnical className="text-blue-200 dark:text-blue-300 font-bold">Admissions Guide</TypographyTechnical>
            <TypographyH2 className="mt-4 text-white">Disciplined Steps to <br /> Your Future</TypographyH2>
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
                <span className="absolute -top-12 -left-4 text-9xl font-technical font-bold text-white/5 pointer-events-none group-hover:text-white/10 transition-colors">
                  {step.num}
                </span>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 group-hover:bg-white/20 transition-colors flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <TypographyH3 className="text-white text-3xl">{step.title}</TypographyH3>
                    <TypographyP className="mt-4 text-white/70 text-lg leading-relaxed max-w-md">
                      {step.desc}
                    </TypographyP>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <Button size="lg" className="rounded-full px-12 h-16 text-lg bg-white text-blue-600 hover:bg-blue-50 border border-white hover:shadow-lg hover:shadow-white/20" asChild>
            <Link href={ROUTES.admissions}>Start Admission Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>

        <div className="sticky top-32 hidden lg:block">
           <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem] border-8 border-white/10">
             <Image
               src="/images/flyer1.jpeg"
               alt="Student at CCHT"
               fill
               sizes="30vw"
               className="object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
             <div className="absolute bottom-10 left-10 right-10">
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 rounded-full font-technical text-xs mb-2 w-fit">
                  Direct Admission
                </Badge>
                <TypographyH3 className="text-white mt-2">Simplifying the journey from interest to enrollment.</TypographyH3>
             </div>
           </div>
        </div>
      </div>
    </Section>
  )
}
