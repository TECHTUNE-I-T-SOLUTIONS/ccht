'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, X, ExternalLink, Phone, Mail } from 'lucide-react'
import { SCHOOL_INFO } from '@/lib/constants'
import { Button } from '@/components/ui/button'

export function ScamWarningModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Show modal only once ever per browser (first-time visitor).
    // Uses localStorage so it persists across sessions and doesn't annoy
    // returning users.
    const hasSeenWarning = localStorage.getItem('scam-warning-seen')
    if (!hasSeenWarning) {
      // Small delay so the page loads first
      const timer = setTimeout(() => {
        setIsOpen(true)
        setHasShown(true)
        localStorage.setItem('scam-warning-seen', 'true')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-red-500 dark:border-red-600 animate-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors z-10"
          aria-label="Close warning"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Official Website Notice
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Please read carefully to avoid fraud
              </p>
            </div>
          </div>

          {/* Main warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1 sm:mb-2 text-sm sm:text-base">
                  This is the ONLY official website of {SCHOOL_INFO.name}
                </h3>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 leading-relaxed">
                  Any other website, social media page, or platform claiming to be {SCHOOL_INFO.shortName} 
                  or using our name, logo, or branding without authorization is <strong>COUNTERFEIT</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Scam warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              Warning: Risk of Scams and Fraud
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>Fraudsters may create fake websites to collect money, personal information, or credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>Never make payments through unofficial channels or unverified platforms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>Always verify the URL before entering any personal or financial information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>Report any suspicious activity to the school administration immediately</span>
              </li>
            </ul>
          </div>

          {/* Official channels */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 sm:mb-3 text-sm sm:text-base">
              Official Communication Channels
            </h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="font-mono text-xs sm:text-sm">www.covenantcollegeofhealthtech.com.ng</span>
              </div>
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{SCHOOL_INFO.email}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{SCHOOL_INFO.phone}</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            <span className="text-sm sm:text-base">I Understand — Proceed to Official Website</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
