'use client'

import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ThemeToggle } from './theme-toggle'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Home', href: ROUTES.home },
    { label: 'About', href: ROUTES.about },
    { label: 'FAQ', href: ROUTES.faq },
    { label: 'Programs', href: ROUTES.programs },
    { label: 'Blog', href: ROUTES.blog },
    { label: 'Events', href: ROUTES.events },
    { label: 'Contact', href: ROUTES.contact },
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
          {/* Logo */}
          <Link href={ROUTES.home} className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black dark:text-white text-sm font-bold">
              C
            </div>
            <span className="hidden sm:inline">{SCHOOL_INFO.shortName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href={ROUTES.login}
              className="hidden md:inline-flex rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground/80 transition hover:border-primary/40 hover:text-primary"
            >
              Portal Login
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-accent text-foreground"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t border-border px-4 pb-4 md:hidden sm:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-accent/50 transition-colors rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={ROUTES.login}
              className="mt-2 block rounded-md px-4 py-2 text-sm font-semibold text-primary hover:bg-accent/40"
              onClick={() => setIsOpen(false)}
            >
              Portal Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
