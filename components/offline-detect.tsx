'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function OfflineDetect() {
  const router = useRouter()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      router.push('/offline')
    }

    const handleOnline = () => {
      setIsOffline(false)
      // If we're on the offline page and come back online, go home
      if (window.location.pathname === '/offline') {
        router.push('/')
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Check initial status
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [router])

  return null
}
