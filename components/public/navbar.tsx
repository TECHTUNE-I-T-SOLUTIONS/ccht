'use client'

import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ThemeToggle } from './theme-toggle'
import {
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  BookOpen,
  Users,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import * as Collapsible from '@radix-ui/react-collapsible'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isAcademicsOpen, setIsAcademicsOpen] = useState(false)
  const [isPortalOpen, setIsPortalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const aboutItems = [
    { label: 'About the College', href: ROUTES.about },
    { label: 'Contact & Support', href: ROUTES.contact },
    { label: 'FAQs', href: ROUTES.faq },
  ]

  const academicItems = [
    { label: 'Programs', href: ROUTES.programs, icon: BookOpen },
    { label: 'Admissions', href: ROUTES.admissions, icon: GraduationCap },
  ]

  const portalItems = [
    { label: 'Applicant Portal', href: ROUTES.login, icon: BadgeCheck },
    { label: 'Student Portal', href: ROUTES.studentDashboard, icon: Users },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
      <div
        className={cn(
          'mx-auto w-full transition-all duration-500 ease-in-out px-4 py-4 lg:px-12',
          isScrolled ? 'max-w-7xl pt-4' : 'max-w-none pt-6',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center justify-between px-6 rounded-full transition-all duration-500',
            isScrolled 
              ? 'bg-background/80 backdrop-blur-md border border-border/50 shadow-lg' 
              : 'bg-transparent border-transparent'
          )}
        >
          <Link href={ROUTES.home} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-technical font-bold text-muted-foreground shadow-lg shadow-primary/20">
                <Image src="/images/logo.png" alt={SCHOOL_INFO.shortName} width={44} height={44} />
            </div>
            <span className={cn(
              "font-display font-bold text-xl tracking-tight hidden sm:block",
              !isScrolled ? "text-muted-foreground" : "text-foreground"
            )}>
              {SCHOOL_INFO.shortName}
            </span>
          </Link>

          <NavigationMenu.Root className="hidden lg:block">
            <NavigationMenu.List className="flex items-center gap-2">
              <NavItem href={ROUTES.home} label="Home" isScrolled={isScrolled} />
              
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={cn(
                  "group inline-flex items-center gap-1 rounded-full px-5 py-2 text-sm font-bold tracking-tight transition-all hover:bg-primary/10 hover:text-primary",
                  !isScrolled ? "text-muted-foreground hover:bg-white/10" : "text-foreground/80"
                )}>
                  About
                  <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute top-full mt-4 w-[280px] rounded-3xl border border-border bg-background p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  {aboutItems.map((item) => (
                    <NavigationMenu.Link asChild key={item.href}>
                      <Link href={item.href} className="block rounded-2xl px-5 py-3 text-sm font-bold text-foreground/70 transition hover:bg-primary/5 hover:text-primary">
                        {item.label}
                      </Link>
                    </NavigationMenu.Link>
                  ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={cn(
                  "group inline-flex items-center gap-1 rounded-full px-5 py-2 text-sm font-bold tracking-tight transition-all hover:bg-primary/10 hover:text-primary",
                  !isScrolled ? "text-muted-foreground hover:bg-white/10" : "text-foreground/80"
                )}>
                  Academics
                  <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute top-full mt-4 w-[300px] rounded-3xl border border-border bg-background p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  {academicItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavigationMenu.Link asChild key={item.href}>
                        <Link href={item.href} className="flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold text-foreground/70 transition hover:bg-primary/5 hover:text-primary group/item">
                          <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-muted-foreground transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          {item.label}
                        </Link>
                      </NavigationMenu.Link>
                    )
                  })}
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={cn(
                  "group inline-flex items-center gap-1 rounded-full px-5 py-2 text-sm font-bold tracking-tight transition-all hover:bg-primary/10 hover:text-primary",
                  !isScrolled ? "text-muted-foreground hover:bg-white/10" : "text-foreground/80"
                )}>
                  Portals
                  <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute top-full mt-4 w-[300px] rounded-3xl border border-border bg-background p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  {portalItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavigationMenu.Link asChild key={item.href}>
                        <Link href={item.href} className="flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold text-foreground/70 transition hover:bg-primary/5 hover:text-primary group/item">
                          <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-muted-foreground transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          {item.label}
                        </Link>
                      </NavigationMenu.Link>
                    )
                  })}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              
              <NavItem href={ROUTES.blog} label="News" isScrolled={isScrolled} />
            </NavigationMenu.List>
          </NavigationMenu.Root>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-6 w-[1px] bg-border/50 mx-2 hidden md:block" />
            <Button size="sm" variant={isScrolled ? "default" : "outline"} className={cn(
              "rounded-full px-6 font-bold tracking-tight hidden md:flex",
              !isScrolled && "border-white/30 text-muted-foreground hover:bg-white/10"
            )} asChild>
              <Link href={ROUTES.login}>Portals</Link>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsOpen(!isOpen)} className={cn(
              "lg:hidden rounded-full",
              !isScrolled && "text-muted-foreground hover:bg-white/10"
            )}>
               {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white dark:bg-black border border-border rounded-[2.5rem] overflow-hidden lg:hidden"
            >
               <div className="p-6 space-y-2">
                  <MobileNavItem href={ROUTES.home} label="Home" onClick={() => setIsOpen(false)} />
                  <Collapsible.Root open={isAboutOpen} onOpenChange={setIsAboutOpen}>
                    <Collapsible.Trigger className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-bold hover:bg-accent">
                      About
                      <ChevronDown className={cn('h-4 w-4 transition', isAboutOpen && 'rotate-180')} />
                    </Collapsible.Trigger>
                    <Collapsible.Content className="space-y-1 px-4 pb-2">
                      {aboutItems.map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary">
                          {item.label}
                        </Link>
                      ))}
                    </Collapsible.Content>
                  </Collapsible.Root>
                  {/* ... other mobile items similarly ... */}
                  <Link href={ROUTES.admissions} onClick={() => setIsOpen(false)} className="flex items-center justify-between rounded-2xl bg-primary px-6 py-5 text-sm font-bold text-muted-foreground group">
                    Start Admission <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

function NavItem({ href, label, isScrolled }: { href: string, label: string, isScrolled: boolean }) {
  return (
    <NavigationMenu.Item>
      <Link href={href} className={cn(
        "rounded-full px-5 py-2 text-sm font-bold tracking-tight transition-all hover:bg-primary/10 hover:text-primary",
        !isScrolled ? "text-muted-foreground" : "text-foreground/80"
      )}>
        {label}
      </Link>
    </NavigationMenu.Item>
  )
}

function MobileNavItem({ href, label, onClick }: { href: string, label: string, onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block rounded-2xl px-5 py-4 text-sm font-bold hover:bg-accent">
      {label}
    </Link>
  )
}
