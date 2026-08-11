'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { WifiOff, RefreshCw, Home, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null)

  // Function to check actual internet connectivity (not just navigator.onLine)
  const checkRealConnection = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to check real connectivity
      const response = await fetch('/api/v1/auth/me', { 
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Function to redirect to previous page
  const redirectToPreviousPage = () => {
    console.log('[OfflinePage] Attempting to redirect to previous page')
    
    // Try multiple strategies in order
    const strategies = [
      // Strategy 1: Use sessionStorage last visited page
      () => {
        const previousPage = sessionStorage.getItem('lastVisitedPage')
        if (previousPage && previousPage !== '/offline') {
          console.log('[OfflinePage] Strategy 1: Using sessionStorage:', previousPage)
          router.push(previousPage)
          return true
        }
        return false
      },
      // Strategy 2: Use document.referrer
      () => {
        const referrer = document.referrer
        if (referrer && !referrer.includes('/offline') && referrer !== window.location.href) {
          console.log('[OfflinePage] Strategy 2: Using document.referrer:', referrer)
          window.location.href = referrer
          return true
        }
        return false
      },
      // Strategy 3: Use browser history
      () => {
        if (window.history.length > 1) {
          console.log('[OfflinePage] Strategy 3: Using browser history')
          window.history.back()
          return true
        }
        return false
      },
      // Strategy 4: Go to home page
      () => {
        console.log('[OfflinePage] Strategy 4: Going to home page')
        router.push(ROUTES.home)
        return true
      }
    ]

    // Try each strategy
    for (const strategy of strategies) {
      if (strategy()) {
        break
      }
    }
  }

  useEffect(() => {
    // Check online status immediately
    const checkOnlineStatus = async () => {
      const realOnline = await checkRealConnection()
      setIsOnline(realOnline)
      console.log('[OfflinePage] Connection check:', realOnline)
      return realOnline
    }

    // Initial check
    checkOnlineStatus()

    // Periodic connection check (every 2 seconds)
    connectionCheckInterval.current = setInterval(async () => {
      const online = await checkOnlineStatus()
      if (online && !isOnline) {
        // Connection just came back
        console.log('[OfflinePage] Connection restored, starting redirect')
        setIsOnline(true)
        setRedirectCountdown(3)
        
        // Clear any existing redirect timeout
        if (redirectTimeout.current) {
          clearTimeout(redirectTimeout.current)
        }
        
        // Start countdown and redirect
        redirectTimeout.current = setTimeout(() => {
          redirectToPreviousPage()
        }, 3000)
      } else if (!online && isOnline) {
        // Connection just went down
        console.log('[OfflinePage] Connection lost')
        setIsOnline(false)
        setRedirectCountdown(0)
        if (redirectTimeout.current) {
          clearTimeout(redirectTimeout.current)
        }
      }
    }, 2000)

    // Also listen to browser online/offline events as backup
    const handleOnline = () => {
      console.log('[OfflinePage] Browser online event fired')
      checkOnlineStatus()
    }

    const handleOffline = () => {
      console.log('[OfflinePage] Browser offline event fired')
      setIsOnline(false)
      setRedirectCountdown(0)
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current)
      }
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current)
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    console.log('[OfflinePage] Manual refresh triggered')
    
    try {
      const online = await checkRealConnection()
      if (online) {
        console.log('[OfflinePage] Online, redirecting...')
        redirectToPreviousPage()
      } else {
        // Force page reload to recheck connection
        console.log('[OfflinePage] Still offline, reloading page')
        window.location.reload()
      }
    } catch (error) {
      console.error('[OfflinePage] Check failed:', error)
      window.location.reload()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleGoBack = () => {
    console.log('[OfflinePage] Manual go back triggered')
    // Use browser history directly
    if (window.history.length > 1) {
      window.history.back()
    } else {
      router.push(ROUTES.home)
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
            {isOnline 
              ? redirectCountdown > 0 
                ? `Redirecting in ${redirectCountdown}...` 
                : 'Redirecting...' 
              : 'No internet connection'
            }
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-600 dark:text-slate-400">
            {isOnline 
              ? 'Your connection has been restored. Taking you back to where you were...'
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
            <Button 
              onClick={handleGoBack}
              variant="outline" 
              className="rounded-full px-8 py-6 text-base font-semibold"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go back
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
