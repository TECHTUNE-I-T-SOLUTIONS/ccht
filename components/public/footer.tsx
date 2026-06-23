import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import { TypographyTechnical, TypographyH3, TypographyP } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="bg-foreground text-background dark:bg-card border-t border-white/5">
      <div className="mx-auto w-full max-w-none px-6 py-20 sm:px-12 md:px-16 lg:px-24 xl:px-32">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-10">
            <Link href={ROUTES.home} className="inline-flex items-center gap-4 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-base font-technical font-bold text-muted-foreground shadow-xl shadow-primary/20">
                CCHT
              </div>
              <span className="font-display font-bold text-2xl tracking-tighter text-muted-foreground">
                {SCHOOL_INFO.shortName}
              </span>
            </Link>
            
            <TypographyP className="text-muted-foreground/60 text-lg leading-relaxed max-w-sm p-2">
              Dedicated to excellence in health technology education. Shaping future leaders through discipline, skill, and professional ethics.
            </TypographyP>

            <div className="space-y-4 pt-4 p-2">
               <TypographyTechnical className="text-primary font-bold block mb-4">Newsletter</TypographyTechnical>
               <div className="flex gap-2">
                 <input 
                   type="email" 
                   placeholder="Enter your email" 
                   className="bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm flex-1 outline-none focus:border-primary/50 transition-colors" 
                 />
                 <Button size="icon" className="rounded-full h-12 w-12 shrink-0">
                    <ArrowRight className="h-4 w-4" />
                 </Button>
               </div>
               <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest pl-4">Receive monthly college updates & news</p>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-12 sm:grid-cols-3 lg:gap-8">
            <div className="space-y-6">
              <TypographyTechnical className="text-muted-foreground font-bold opacity-40">Institution</TypographyTechnical>
              <ul className="space-y-4">
                <li><FooterLink href={ROUTES.home}>Home</FooterLink></li>
                <li><FooterLink href={ROUTES.about}>About Us</FooterLink></li>
                <li><FooterLink href={ROUTES.programs}>Programs</FooterLink></li>
                <li><FooterLink href={ROUTES.admissions}>Admissions</FooterLink></li>
              </ul>
            </div>

            <div className="space-y-6">
              <TypographyTechnical className="text-muted-foreground font-bold opacity-40">Resources</TypographyTechnical>
              <ul className="space-y-4">
                <li><FooterLink href={ROUTES.blog}>Latest News</FooterLink></li>
                <li><FooterLink href={ROUTES.events}>Upcoming Events</FooterLink></li>
                <li><FooterLink href={ROUTES.faq}>FAQ Support</FooterLink></li>
                <li><FooterLink href={ROUTES.contact}>Contact Us</FooterLink></li>
              </ul>
            </div>

            <div className="space-y-6">
              <TypographyTechnical className="text-muted-foreground font-bold opacity-40">Portals</TypographyTechnical>
              <ul className="space-y-4">
                <li><FooterLink href={ROUTES.login}>Applicant</FooterLink></li>
                <li><FooterLink href={ROUTES.studentDashboard}>Student</FooterLink></li>
                <li><FooterLink href={ROUTES.lecturerDashboard}>Lecturer</FooterLink></li>
                <li><FooterLink href={ROUTES.adminDashboard}>Admin</FooterLink></li>
              </ul>
            </div>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3 space-y-10">
            <div className="bg-white/5 rounded-[2.5rem] p-4 border border-white/10">
               <TypographyTechnical className="text-primary font-bold block mb-6 text-sm">Connect</TypographyTechnical>
               <div className="space-y-4">
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <span className="text-sm text-muted-foreground/70 leading-relaxed">{SCHOOL_INFO.address}</span>
                  </div>
                  <div className="flex gap-4">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <a href={`mailto:${SCHOOL_INFO.email}`} className="text-sm md:text-sm lg:text-xs text-muted-foreground/70 hover:text-primary transition-colors">
                      {SCHOOL_INFO.email}
                    </a>
                  </div>
                  <div className="flex gap-4">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <a href={`tel:${SCHOOL_INFO.phone}`} className="text-sm text-muted-foreground/70 hover:text-primary transition-colors">
                      {SCHOOL_INFO.phone}
                    </a>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <Separator className="my-16 bg-white/10" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-[11px] font-technical tracking-widest text-muted-foreground/30 uppercase">
             &copy; {new Date().getFullYear()} {SCHOOL_INFO.name}. All rights reserved.
           </div>
           <div className="flex gap-8 text-[11px] font-technical tracking-widest text-muted-foreground/30 uppercase">
             <Link href={ROUTES.privacy} className="hover:text-primary transition-colors">Privacy Policy</Link>
             <Link href={ROUTES.terms} className="hover:text-primary transition-colors">Terms of Use</Link>
             <Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link>
           </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-sm font-bold text-muted-foreground/60 hover:text-primary transition-all flex items-center group"
    >
      <div className="w-0 group-hover:w-3 h-[2px] bg-primary mr-0 group-hover:mr-2 transition-all duration-300" />
      {children}
    </Link>
  )
}
