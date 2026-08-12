import { Metadata } from 'next'
import { SCHOOL_INFO } from './constants'

/**
 * Generate consistent metadata for public pages
 */
export function generatePageMetadata(params: {
  title: string
  description: string
  path: string
}): Metadata {
  const fullTitle = `${params.title} | ${SCHOOL_INFO.name}`
  
  return {
    title: fullTitle,
    description: params.description,
    openGraph: {
      title: fullTitle,
      description: params.description,
      url: `https://covenantcollegeofhealthtech.com.ng${params.path}`,
      siteName: SCHOOL_INFO.name,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: '/images/logo.png',
          width: 1200,
          height: 630,
          alt: `${SCHOOL_INFO.name} Logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: params.description,
      images: ['/images/logo.png'],
    },
  }
}
