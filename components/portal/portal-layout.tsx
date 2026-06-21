'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LogOut, Home, BookOpen, BarChart3, Settings, Users, FileText, Bell, ChevronRight, Sparkles, CalendarDays, ShieldCheck, LayoutDashboard, ClipboardList, GraduationCap, ReceiptText } from 'lucide-react'
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
  const navItems = useMemo(() => {
    const roleItems = {
      student: [
        { label: 'Dashboard', href: ROUTES.studentDashboard, icon: LayoutDashboard },
        { label: 'Courses', href: '/student/courses', icon: BookOpen },
        { label: 'Results', href: '/student/results', icon: BarChart3 },
        { label: 'Payments', href: '/student/payments', icon: ReceiptText },
        { label: 'Profile', href: '/student/profile', icon: Users },
      ],
      teacher: [
        { label: 'Dashboard', href: ROUTES.teacherDashboard, icon: LayoutDashboard },
        { label: 'My Classes', href: '/teacher/courses', icon: BookOpen },
        { label: 'Students', href: '/teacher/students', icon: Users },
        { label: 'Grades', href: '/teacher/grades', icon: ClipboardList },
        { label: 'Sessions', href: '/teacher/sessions', icon: CalendarDays },
      ],
      lecturer: [
        { label: 'Dashboard', href: ROUTES.lecturerDashboard, icon: LayoutDashboard },
        { label: 'My Classes', href: '/teacher/courses', icon: BookOpen },
        { label: 'Students', href: '/teacher/students', icon: Users },
        { label: 'Grades', href: '/teacher/grades', icon: ClipboardList },
        { label: 'Sessions', href: '/teacher/sessions', icon: CalendarDays },
      ],
      admin: [
        { label: 'Dashboard', href: ROUTES.adminDashboard, icon: LayoutDashboard },
        { label: 'Admissions', href: '/admin/admissions', icon: GraduationCap },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Programs', href: '/admin/programs', icon: BookOpen },
        { label: 'Payments', href: '/admin/payments', icon: ReceiptText },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
      ],
      aspirant: [
        { label: 'Dashboard', href: ROUTES.aspirantDashboard, icon: LayoutDashboard },
        { label: 'Application', href: '/aspirant/application', icon: ClipboardList },
        { label: 'Profile', href: '/aspirant/profile', icon: Users },
        { label: 'Documents', href: '/aspirant/documents', icon: FileText },
        { label: 'Status', href: '/aspirant/status', icon: ShieldCheck },
      ],
    }

    return roleItems[role as keyof typeof roleItems] || []
  }, [role])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const pageTitle = navItems.find((item) => isActive(item.href))?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-accent xl:hidden"
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
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">Signed in</p>
                <p className="font-semibold text-foreground capitalize">{userName}</p>
              </div>
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
          className={`fixed inset-y-16 left-0 z-30 w-80 border-r border-border bg-card/95 backdrop-blur transition-transform xl:relative xl:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-b border-border/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">Portal menu</p>
            <div className="mt-3 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground capitalize">{role} portal</p>
              <p className="mt-1 text-xs leading-6 text-foreground/60">
                Secure workspace for {role === 'admin' ? 'administration and approvals' : role === 'aspirant' ? 'admission progress' : 'academic management'}.
              </p>
            </div>
          </div>
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
