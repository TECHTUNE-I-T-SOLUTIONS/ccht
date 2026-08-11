'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Track the last visited page (except offline page)
    if (pathname !== '/offline') {
      sessionStorage.setItem('lastVisitedPage', pathname)
    }
  }, [pathname])

  return null
}