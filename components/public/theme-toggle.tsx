'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const handleToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    if (typeof document === 'undefined' || !buttonRef.current) {
      setTheme(nextTheme)
      return
    }

    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const overlay = document.createElement('div')
    const radius = Math.hypot(window.innerWidth, window.innerHeight)
    const overlayBackground = nextTheme === 'dark'
      ? 'radial-gradient(circle at center, rgba(13, 13, 13, 0.94) 0%, rgba(13, 13, 13, 0.82) 42%, rgba(13, 13, 13, 0.12) 74%, rgba(13, 13, 13, 0) 100%)'
      : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.82) 42%, rgba(255, 255, 255, 0.16) 74%, rgba(255, 255, 255, 0) 100%)'

    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.zIndex = '9999'
    overlay.style.pointerEvents = 'none'
    overlay.style.background = overlayBackground
    overlay.style.backdropFilter = 'blur(10px)'
    overlay.style.opacity = '0.98'
    overlay.style.clipPath = `circle(0px at ${centerX}px ${centerY}px)`
    overlay.style.transition = 'clip-path 760ms cubic-bezier(0.16, 1, 0.3, 1), opacity 760ms ease-out'

    document.body.appendChild(overlay)

    requestAnimationFrame(() => {
      setTheme(nextTheme)
      overlay.style.clipPath = `circle(${radius}px at ${centerX}px ${centerY}px)`
      overlay.style.opacity = '0'
    })

    window.setTimeout(() => {
      overlay.remove()
    }, 820)
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-border bg-card text-foreground transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
      aria-label="Toggle theme"
    >
      <span className="absolute inset-0 bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Sun className="relative h-5 w-5 rotate-0 scale-100 text-amber-500 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 text-sky-400 transition-all duration-300 dark:rotate-0 dark:scale-100" />
    </button>
  )
}
