import type { Metadata } from 'next'
import Script from 'next/script'
import { Plus_Jakarta_Sans, DM_Sans, Space_Grotesk } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'
import { cn } from '@/lib/utils'

const fontSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
})

const fontTechnical = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-technical',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://covenantcollegeofhealthtech.com.ng'),
  title: 'Covenant College of Health Technology - Quality Education for Health-Filled Society',
  description: 'Premier health education institution offering quality programs in health technology. Dedicated to producing competent healthcare professionals.',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={cn(
        "min-h-screen bg-background font-sans antialiased selection:bg-primary/10 selection:text-primary",
        fontSans.variable,
        fontDisplay.variable,
        fontTechnical.variable
      )}>
        <Providers>
          {children}
        </Providers>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function (error) {
                  console.warn('Service worker registration failed:', error)
                })
              })
            }
          `}
        </Script>
      </body>
    </html>
  )
}
