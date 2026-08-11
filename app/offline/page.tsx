'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { WifiOff, RefreshCw, Home, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Redirect to previous page or home after a short delay
      setTimeout(() => {
        const previousPage = sessionStorage.getItem('lastVisitedPage')
        if (previousPage && previousPage !== '/offline') {
          router.push(previousPage)
        } else {
          router.push(ROUTES.home)
        }
      }, 500)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initial check
    checkOnlineStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Check if we're back online
    if (navigator.onLine) {
      const previousPage = sessionStorage.getItem('lastVisitedPage')
      if (previousPage && previousPage !== '/offline') {
        router.push(previousPage)
      } else {
        router.push(ROUTES.home)
      }
    } else {
      // Force page reload
      window.location.reload()
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950 px-4">
      <div className="max-w-2xl w-full">
        <div className="rounded-[2.5rem] border border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-12 text-center shadow-2xl">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg animate-pulse">
            {isOnline ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : (
              <WifiOff className="h-12 w-12" />
            )}
          </div>
          
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-600 dark:text-orange-400">
            {isOnline ? 'Connection restored' : "You're offline"}
          </p>
          <h1 className="mt-4 text-5xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {isOnline ? 'Redirecting...' : 'No internet connection'}
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-600 dark:text-slate-400">
            {isOnline 
              ? 'Your connection has been restored. Redirecting you to your previous page...'
              : 'It looks like you\'ve lost your internet connection. Please check your network settings and try again.'
            }
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing || isOnline}
              className="rounded-full px-8 py-6 text-base font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Try again
                </>
              )}
            </Button>
            <Link href={ROUTES.home}>
              <Button variant="outline" className="rounded-full px-8 py-6 text-base font-semibold">
                <Home className="mr-2 h-5 w-5" />
                Go home
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border">
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-orange-700 dark:text-orange-400">Tips:</strong>
              </p>
              <ul className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-left space-y-1">
                <li>• Check your Wi-Fi or mobile data connection</li>
                <li>• Try restarting your router or modem</li>
                <li>• Check if other devices can connect to the internet</li>
                <li>• Some features may be available offline once loaded</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
