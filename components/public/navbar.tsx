'use client'

import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ThemeToggle } from './theme-toggle'
import {
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
  FileText,
  BookOpen,
  Users,
  BadgeCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import * as Collapsible from '@radix-ui/react-collapsible'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isAcademicsOpen, setIsAcademicsOpen] = useState(false)
  const [isPortalOpen, setIsPortalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
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
    { label: 'News & Events', href: ROUTES.events, icon: FileText },
  ]

  const portalItems = [
    { label: 'Applicant Portal', href: ROUTES.login, icon: BadgeCheck },
    { label: 'Student Portal', href: ROUTES.studentDashboard, icon: Users },
  ]

  return (
    <nav className="sticky top-0 z-50 px-2 py-2 sm:px-4">
      <div
        className={cn(
          'mx-auto w-full transition-all duration-500 ease-out',
          isScrolled
            ? 'max-w-[1200px] rounded-2xl border border-border/80 bg-background/70 shadow-xl backdrop-blur-xl'
            : 'max-w-none border-b border-border bg-background/92',
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <Link href={ROUTES.home} className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              CCHT
            </div>
            <span className="hidden sm:inline">{SCHOOL_INFO.shortName}</span>
          </Link>

          <NavigationMenu.Root className="hidden lg:block">
            <NavigationMenu.List className="flex items-center gap-1">
              <NavigationMenu.Item>
                <Link href={ROUTES.home} className="rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-foreground">
                  Home
                </Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className="group inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-foreground">
                  About
                  <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute top-full mt-3 w-[320px] rounded-2xl border border-border bg-popover p-2 shadow-2xl">
                  {aboutItems.map((item) => (
                    <NavigationMenu.Link asChild key={item.href}>
                      <Link href={item.href} className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground">
                        {item.label}
                      </Link>
                    </NavigationMenu.Link>
                  ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className="group inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-foreground">
                  Academics
                  <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute top-full mt-3 w-[340px] rounded-2xl border border-border bg-popover p-2 shadow-2xl">
                  {academicItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavigationMenu.Link asChild key={item.href}>
                        <Link href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground">
                          <Icon className="h-4 w-4 text-primary" />
                          {item.label}
                        </Link>
                      </NavigationMenu.Link>
                    )
                  })}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className="group inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-foreground">
                  Portal
                  <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute top-full mt-3 w-[320px] rounded-2xl border border-border bg-popover p-2 shadow-2xl">
                  {portalItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavigationMenu.Link asChild key={item.href}>
                        <Link href={item.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground">
                          <Icon className="h-4 w-4 text-primary" />
                          {item.label}
                        </Link>
                      </NavigationMenu.Link>
                    )
                  })}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <Link href={ROUTES.blog} className="rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-foreground">
                  News
                </Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <Link href={ROUTES.contact} className="rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition hover:bg-accent hover:text-foreground">
                  Contact
                </Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu.Root>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href={ROUTES.login}
              className="hidden md:inline-flex rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground/80 transition hover:border-primary/40 hover:text-primary"
            >
              Portal Login
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent lg:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-border px-4 pb-4 lg:hidden sm:px-6">
            <div className="space-y-2 pt-3">
              <Link href={ROUTES.home} onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent">
                Home
              </Link>
              <Collapsible.Root open={isAboutOpen} onOpenChange={setIsAboutOpen}>
                <Collapsible.Trigger className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-accent">
                  About
                  <ChevronDown className={cn('h-4 w-4 transition', isAboutOpen && 'rotate-180')} />
                </Collapsible.Trigger>
                <Collapsible.Content className="space-y-1 px-2 pb-1">
                  {aboutItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="block rounded-lg px-4 py-2 text-sm text-foreground/75 hover:bg-accent">
                      {item.label}
                    </Link>
                  ))}
                </Collapsible.Content>
              </Collapsible.Root>
              <Collapsible.Root open={isAcademicsOpen} onOpenChange={setIsAcademicsOpen}>
                <Collapsible.Trigger className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-accent">
                  Academics
                  <ChevronDown className={cn('h-4 w-4 transition', isAcademicsOpen && 'rotate-180')} />
                </Collapsible.Trigger>
                <Collapsible.Content className="space-y-1 px-2 pb-1">
                  {academicItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="block rounded-lg px-4 py-2 text-sm text-foreground/75 hover:bg-accent">
                      {item.label}
                    </Link>
                  ))}
                </Collapsible.Content>
              </Collapsible.Root>
              <Collapsible.Root open={isPortalOpen} onOpenChange={setIsPortalOpen}>
                <Collapsible.Trigger className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-accent">
                  Portal
                  <ChevronDown className={cn('h-4 w-4 transition', isPortalOpen && 'rotate-180')} />
                </Collapsible.Trigger>
                <Collapsible.Content className="space-y-1 px-2 pb-1">
                  {portalItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="block rounded-lg px-4 py-2 text-sm text-foreground/75 hover:bg-accent">
                      {item.label}
                    </Link>
                  ))}
                </Collapsible.Content>
              </Collapsible.Root>
              <Link href={ROUTES.blog} onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent">
                News
              </Link>
              <Link href={ROUTES.contact} onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent">
                Contact
              </Link>
              <Link href={ROUTES.login} onClick={() => setIsOpen(false)} className="mt-2 block rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                Portal Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
