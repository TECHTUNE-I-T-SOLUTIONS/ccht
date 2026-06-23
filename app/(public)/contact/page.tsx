'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SCHOOL_INFO, ROUTES } from '@/lib/constants'
import { Mail, Phone, MapPin, Send, Clock, Info, Check } from 'lucide-react'
import { useState } from 'react'
import { ContactFormSchema } from '@/lib/validation'
import { Section } from '@/components/ui/section'
import { TypographyH1, TypographyH2, TypographyH3, TypographyP, TypographyTechnical, TypographyLead } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'


export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = ContactFormSchema.safeParse(formData)
      if (!result.success) {
        setMessage('Please fill in all fields correctly')
        return
      }

      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })

      if (response.ok) {
        setMessage('Thank you! We will get back to you shortly.')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setMessage('Failed to send message. Please try again.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-secondary text-muted-foreground pt-40 pb-20 overflow-hidden relative">
           <div className="mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                 <Badge className="bg-primary text-muted-foreground border-none px-4 py-1 rounded-full font-technical mb-6">
                    GET IN TOUCH
                 </Badge>
                 <TypographyH1 className="text-muted-foreground text-5xl md:text-7xl max-w-4xl leading-[1.1]">
                    We're here to <span className="text-primary-foreground/50 italic">support</span> your journey.
                 </TypographyH1>
                 <TypographyLead className="mt-8 text-muted-foreground/70 max-w-2xl text-lg md:text-xl">
                    Have questions about admissions, programs, or student life? Our team is ready to provide the guidance you need.
                 </TypographyLead>
              </motion.div>
           </div>
           
           <div className="absolute top-0 right-0 w-1/4 h-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 400 800" className="h-full w-full fill-white">
                 <path d="M400,0 Q300,200 350,400 Q300,600 400,800 L400,0 Z" />
              </svg>
           </div>
        </section>

        {/* CONTENT SECTION */}
        <Section className="bg-accent-soft/30 -mt-12 relative z-20 pt-0">
           <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
              {/* Contact Form */}
              <div className="lg:col-span-7 bg-background rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-primary/5 border border-border/50">
                 <TypographyH2 className="text-3xl mb-10">Send us a Message</TypographyH2>
                 
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                       <FormField label="Full Name">
                          <Input
                            className="input-base"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                       </FormField>
                       <FormField label="Email Address">
                          <Input
                            type="email"
                            className="input-base"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                       </FormField>
                    </div>

                    <FormField label="Subject">
                       <Input
                         className="input-base"
                         placeholder="How can we help?"
                         value={formData.subject}
                         onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                         required
                       />
                    </FormField>

                    <FormField label="Your Message">
                       <Textarea
                         rows={6}
                         className="input-base py-5 h-auto resize-none"
                         placeholder="Write your message here..."
                         value={formData.message}
                         onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                         required
                       />
                    </FormField>

                    {message && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 rounded-2xl text-sm font-bold flex items-center gap-3",
                          message.includes('Thank you') ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        )}
                      >
                         {message.includes('Thank you') ? <Check className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                         {message}
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full rounded-full h-14 font-bold shadow-xl shadow-primary/20 text-lg"
                    >
                       {loading ? 'SENDING...' : <>SEND MESSAGE <Send className="ml-2 h-4 w-4" /></>}
                    </Button>
                 </form>
              </div>

              {/* Info Column */}
              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-secondary p-10 rounded-[3rem] text-muted-foreground">
                    <TypographyTechnical className="text-primary-foreground/60 font-bold block mb-8">Contact Info</TypographyTechnical>
                    <div className="space-y-10">
                       <ContactItem icon={MapPin} label="Campus Address" value={SCHOOL_INFO.address} />
                       <ContactItem icon={Mail} label="Email Address" value={SCHOOL_INFO.email} />
                       <ContactItem icon={Phone} label="Phone Line" value={SCHOOL_INFO.phone} />
                    </div>
                    
                    <Separator className="my-10 bg-white/10" />
                    
                    <div className="flex gap-4 items-start">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                          <p className="text-[10px] font-technical font-bold text-primary-foreground/40 uppercase tracking-widest mb-1">Office Hours</p>
                          <p className="text-muted-foreground/80 text-sm leading-relaxed">
                             Mon - Fri: 8:00 AM - 5:00 PM <br />
                             Sat: 9:00 AM - 2:00 PM
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-primary p-10 rounded-[3rem] text-muted-foreground relative overflow-hidden group">
                    <div className="relative z-10">
                       <TypographyH3 className="text-2xl leading-tight">Ready to apply?</TypographyH3>
                       <TypographyP className="text-muted-foreground/70 text-sm mt-4">
                          Don't wait for answers to start your journey. You can begin your application process right now.
                       </TypographyP>
                       <Button variant="secondary" className="mt-8 rounded-full px-8 h-12 font-bold" asChild>
                          <Link href={ROUTES.admissions}>Apply Now</Link>
                       </Button>
                    </div>
                    <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:scale-110 transition-transform">
                       <Send className="h-32 w-32" />
                    </div>
                 </div>
              </div>
           </div>
        </Section>

        {/* FAQ SECTION */}
        <Section className="bg-background">
           <div className="text-center max-w-3xl mx-auto mb-16">
              <TypographyTechnical className="text-primary font-bold">Assistance</TypographyTechnical>
              <TypographyH2 className="mt-4">Frequently Asked Questions</TypographyH2>
           </div>
           
           <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                 {[
                   { q: 'What are the admission requirements?', a: 'You need a high school diploma or equivalent and meet program-specific prerequisites. Visit the Programs page for detailed info.' },
                   { q: 'Is financial aid available?', a: 'Yes, we offer flexible payment plans and merit-based scholarships for qualified students.' },
                   { q: 'Do you offer online classes?', a: 'Most of our programs are practical-based and require on-campus attendance, though some theory components may be available online.' },
                   { q: 'What is the student-to-lecturer ratio?', a: 'We maintain a favorable ratio of approximately 15:1 to ensure personalized attention and quality education.' },
                 ].map((item, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`} className="border border-border/50 rounded-[2rem] px-8 bg-card overflow-hidden">
                       <AccordionTrigger className="hover:no-underline py-6">
                          <span className="text-left font-bold text-lg">{item.q}</span>
                       </AccordionTrigger>
                       <AccordionContent className="pb-8 text-muted-foreground text-base leading-relaxed">
                          {item.a}
                       </AccordionContent>
                    </AccordionItem>
                 ))}
              </Accordion>
           </div>
        </Section>
      </main>
      <Footer />

      <style jsx global>{`
        .input-base {
          @apply w-full h-14 px-6 rounded-2xl bg-muted border-2 border-transparent focus:border-primary/30 focus:bg-background outline-none transition-all font-medium;
        }
      `}</style>
    </div>
  )
}

function FormField({ label, error, children, className }: { label: string, error?: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
       <label className="text-[10px] font-technical font-bold text-muted-foreground uppercase tracking-widest pl-4">
          {label}
       </label>
       {children}
       {error && <p className="text-[10px] text-red-500 font-bold pl-4">{error.toUpperCase()}</p>}
    </div>
  )
}

function ContactItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex gap-4 items-start group">
       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:scale-110 transition-all">
          <Icon className="h-5 w-5 text-primary group-hover:text-muted-foreground transition-colors" />
       </div>
       <div>
          <p className="text-[10px] font-technical font-bold text-primary-foreground/40 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-muted-foreground/90 text-sm font-bold leading-relaxed">{value}</p>
       </div>
    </div>
  )
}
