'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, ExternalLink, Phone, Mail } from 'lucide-react'
import { SCHOOL_INFO } from '@/lib/constants'

export function NoticeBar() {
  const notices = [
    {
      icon: Shield,
      text: `This is the ONLY official website of ${SCHOOL_INFO.name}`,
      urgent: true,
    },
    {
      icon: AlertTriangle,
      text: 'Beware of counterfeit websites and fraudulent platforms',
      urgent: true,
    },
    {
      icon: ExternalLink,
      text: `Official URL: www.covenantcollegeofhealthtech.com.ng`,
    },
    {
      icon: Phone,
      text: `Contact: ${SCHOOL_INFO.phone} | ${SCHOOL_INFO.email}`,
    },
    {
      icon: AlertTriangle,
      text: 'Never make payments through unofficial channels',
      urgent: true,
    },
    {
      icon: Shield,
      text: 'Report any suspicious activity to the school administration',
    },
  ]

  // Duplicate notices for seamless infinite scroll
  const duplicatedNotices = [...notices, ...notices]

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 dark:from-red-700 dark:via-red-800 dark:to-red-700 text-white overflow-hidden shadow-lg mt-22">
      <div className="relative h-12 flex items-center">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-red-600 to-transparent dark:from-red-700 z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-red-600 to-transparent dark:from-red-700 z-10" />

        {/* Scrolling container */}
        <div className="flex whitespace-nowrap animate-scroll">
          {duplicatedNotices.map((notice, index) => {
            const Icon = notice.icon
            return (
              <div
                key={index}
                className={`flex items-center gap-2 px-8 text-sm font-medium ${
                  notice.urgent ? 'font-bold' : 'font-normal'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{notice.text}</span>
                <span className="mx-4 text-red-300 dark:text-red-400">•</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}