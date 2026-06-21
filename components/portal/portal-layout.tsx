'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LogOut, Home, BookOpen, BarChart3, Settings, Users, FileText, Bell, ChevronRight } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ThemeToggle } from '@/components/public/theme-toggle'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface PortalLayoutProps {
  children: React.ReactNode
  role: string
  userName?: string
}

export function PortalLayout({ children, role, userName = 'User' }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      toast.success('You have been signed out.')
      router.push(ROUTES.login)
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('We could not sign you out. Please try again.')
    }
  }

  // Define navigation items based on user role
  const getNavItems = () => {
    const roleSegment = role === 'lecturer' ? 'teacher' : role
    const baseItems = [
      { label: 'Dashboard', href: `${ROUTES.portal}/${roleSegment}/dashboard`, icon: Home },
      { label: 'Profile', href: `${ROUTES.portal}/${roleSegment}/profile`, icon: Users },
      { label: 'Settings', href: `${ROUTES.portal}/${roleSegment}/settings`, icon: Settings },
    ]

    const roleItems = {
      student: [
        { label: 'Courses', href: `${ROUTES.portal}/student/courses`, icon: BookOpen },
        { label: 'Results', href: `${ROUTES.portal}/student/results`, icon: BarChart3 },
        { label: 'Fees', href: `${ROUTES.portal}/student/fees`, icon: FileText },
      ],
      teacher: [
        { label: 'Courses', href: `${ROUTES.portal}/teacher/courses`, icon: BookOpen },
        { label: 'Grades', href: `${ROUTES.portal}/teacher/grades`, icon: BarChart3 },
        { label: 'Students', href: `${ROUTES.portal}/teacher/students`, icon: Users },
      ],
      lecturer: [
        { label: 'Courses', href: `${ROUTES.portal}/teacher/courses`, icon: BookOpen },
        { label: 'Grades', href: `${ROUTES.portal}/teacher/grades`, icon: BarChart3 },
        { label: 'Students', href: `${ROUTES.portal}/teacher/students`, icon: Users },
      ],
      admin: [
        { label: 'Users', href: `${ROUTES.portal}/admin/users`, icon: Users },
        { label: 'Content', href: `${ROUTES.portal}/admin/content`, icon: FileText },
        { label: 'Payments', href: `${ROUTES.portal}/admin/payments`, icon: BarChart3 },
        { label: 'Reports', href: `${ROUTES.portal}/admin/reports`, icon: BarChart3 },
      ],
    }

    return [...baseItems, ...(roleItems[role as keyof typeof roleItems] || [])]
  }

  const navItems = getNavItems()

  const isActive = (href: string) => pathname === href
  const pageTitle = navItems.find((item) => isActive(item.href))?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-accent lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href={ROUTES.home} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                CCHT
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{SCHOOL_INFO.shortName}</p>
                <p className="text-xs text-foreground/50">{pageTitle}</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden rounded-xl border border-border bg-card p-2 text-foreground/70 transition hover:text-primary sm:inline-flex" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-foreground/70">Welcome,</span>
              <span className="font-semibold text-foreground capitalize">{userName}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of your portal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to continue. Unsaved changes may be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay signed in</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Sign out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside
          className={`fixed inset-y-16 left-0 z-30 w-72 border-r border-border bg-card/95 backdrop-blur transition-transform lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="flex h-full flex-col gap-2 overflow-y-auto p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/75 hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
                </Link>
              )
            })}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
