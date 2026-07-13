'use client'

import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ProgramService } from '@/lib/services/program.service'
import { SCHOOL_INFO } from '@/lib/constants'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Clock, Users, Award } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { TypographyH1, TypographyH2, TypographyH3, TypographyP, TypographyTechnical, TypographyLead } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'

export default function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [program, setProgram] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProgram() {
      const { slug } = await params
      const data = await ProgramService.getProgramBySlug(slug)
      setProgram(data)
      setLoading(false)
    }
    loadProgram()
  }, [params])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading program details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <TypographyH2 className="text-4xl font-bold mb-4">Program Not Found</TypographyH2>
            <TypographyP className="text-muted-foreground mb-8">The program you're looking for doesn't exist.</TypographyP>
            <Button size="lg" className="rounded-full px-10 h-14 font-bold" asChild>
              <Link href="/programs">Back to Programs</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-secondary text-muted-foreground pt-32 pb-20 overflow-hidden relative">
          <div className="mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 relative z-10">
            <div
              className="animate-fadeIn"
            >
              <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-primary" asChild>
                <Link href="/programs">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Programs
                </Link>
              </Button>
              
              <Badge className="bg-primary text-muted-foreground border-none px-4 py-1 rounded-full font-technical mb-6 text-[10px]">
                {program.level.toUpperCase()}
              </Badge>
              
              <TypographyH1 className="text-muted-foreground text-5xl md:text-7xl max-w-4xl leading-[1.1]">
                {program.title}
              </TypographyH1>
              
              <TypographyLead className="mt-8 text-muted-foreground/70 max-w-2xl text-lg md:text-xl">
                {program.description}
              </TypographyLead>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <svg viewBox="0 0 400 800" className="h-full w-full fill-white" preserveAspectRatio="none">
              <path d="M400,0 Q300,200 350,400 Q300,600 400,800 L400,0 Z" />
            </svg>
          </div>
        </section>

        {/* PROGRAM DETAILS */}
        <Section className="bg-accent-soft/30 -mt-12 relative z-20 pt-0">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Overview */}
                <div 
                  className="bg-background rounded-[3rem] p-10 md:p-14 border border-border shadow-2xl shadow-primary/5"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <TypographyH2 className="text-3xl font-bold">Program Overview</TypographyH2>
                  </div>
                  <TypographyP className="text-muted-foreground text-lg leading-relaxed">
                    {program.description}
                  </TypographyP>
                  
                  {program.overview && (
                    <>
                      <Separator className="my-8" />
                      <TypographyH3 className="text-xl font-bold mb-4">What You Will Learn</TypographyH3>
                      <TypographyP className="text-muted-foreground leading-relaxed">
                        {program.overview}
                      </TypographyP>
                    </>
                  )}
                </div>

                {/* Entry Requirements */}
                {program.entry_requirements && (
                  <div 
                    className="bg-background rounded-[3rem] p-10 md:p-14 border border-border shadow-2xl shadow-primary/5"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Award className="h-6 w-6 text-primary" />
                      <TypographyH2 className="text-3xl font-bold">Entry Requirements</TypographyH2>
                    </div>
                    <TypographyP className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {program.entry_requirements}
                    </TypographyP>
                  </div>
                )}

                {/* Career Prospects */}
                {program.career_prospects && (
                  <div 
                    className="bg-background rounded-[3rem] p-10 md:p-14 border border-border shadow-2xl shadow-primary/5"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Users className="h-6 w-6 text-primary" />
                      <TypographyH2 className="text-3xl font-bold">Career Prospects</TypographyH2>
                    </div>
                    <TypographyP className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {program.career_prospects}
                    </TypographyP>
                  </div>
                )}

                {/* Curriculum */}
                {program.curriculum && (
                  <div 
                    className="bg-background rounded-[3rem] p-10 md:p-14 border border-border shadow-2xl shadow-primary/5"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <BookOpen className="h-6 w-6 text-primary" />
                      <TypographyH2 className="text-3xl font-bold">Curriculum</TypographyH2>
                    </div>
                    <TypographyP className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {program.curriculum}
                    </TypographyP>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Program Info Card */}
                <div 
                  className="bg-background rounded-[3rem] p-8 border border-border shadow-2xl shadow-primary/5 sticky top-24"
                >
                  <TypographyH3 className="text-2xl font-bold mb-6">Program Details</TypographyH3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-technical font-bold uppercase tracking-widest text-muted-foreground mb-1">Duration</p>
                        <p className="font-bold text-lg text-foreground">{program.duration_months} {program.duration_unit}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-technical font-bold uppercase tracking-widest text-muted-foreground mb-1">Level</p>
                        <p className="font-bold text-lg text-foreground capitalize">{program.level}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-technical font-bold uppercase tracking-widest text-muted-foreground mb-1">Max Students</p>
                        <p className="font-bold text-lg text-foreground">{program.max_students || 'Unlimited'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  <Button size="lg" className="w-full rounded-full h-14 font-bold" asChild>
                    <Link href="/admissions/apply">
                      Apply for this Program <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                    </Link>
                  </Button>

                  <Button size="lg" variant="outline" className="w-full rounded-full h-14 font-bold mt-4" asChild>
                    <Link href="/contact">
                      Contact Admissions
                    </Link>
                  </Button>

                  <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs text-muted-foreground text-center">
                      💡 Tuition fees will be communicated after admission based on your specific program and level.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  )
}
