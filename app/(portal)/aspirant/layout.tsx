import { PortalLayout } from '@/components/portal/portal-layout'

export const metadata = {
  title: 'Aspirant Portal - CCHT',
  description: 'Track your admission progress, uploads, and screening status',
}

export default function AspirantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayout role="aspirant">{children}</PortalLayout>
}
