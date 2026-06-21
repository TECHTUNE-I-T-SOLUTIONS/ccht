import type { MetadataRoute } from 'next'

const routes = [
  '/',
  '/about',
  '/admissions',
  '/blog',
  '/contact',
  '/events',
  '/faq',
  '/programs',
  '/privacy',
  '/terms',
  '/login',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://covenantcollegeofhealthtech.com.ng'
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))
}
