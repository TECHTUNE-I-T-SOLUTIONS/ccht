import { PortalLayout } from '@/components/portal/portal-layout'

export const metadata = {
  title: 'Teacher Portal - CCHT',
  description: 'Manage courses, grades, and student information',
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayout role="teacher">{children}</PortalLayout>
}
