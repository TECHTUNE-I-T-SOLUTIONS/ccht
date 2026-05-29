import { PortalLayout } from '@/components/portal/portal-layout'

export const metadata = {
  title: 'Student Portal - CCHT',
  description: 'Access your courses, results, and make fee payments',
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayout role="student">{children}</PortalLayout>
}
