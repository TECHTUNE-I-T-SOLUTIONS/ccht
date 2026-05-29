import { PortalLayout } from '@/components/portal/portal-layout'

export const metadata = {
  title: 'Admin Dashboard - CCHT',
  description: 'Manage school operations, users, and content',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayout role="admin">{children}</PortalLayout>
}
