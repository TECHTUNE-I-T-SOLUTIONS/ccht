import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Program Details',
  description: 'Detailed information about academic programs offered at Covenant College of Health Technology.',
  path: '/programs/[slug]',
})
