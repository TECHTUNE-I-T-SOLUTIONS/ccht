'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LogOut, BookOpen, BarChart3, Settings, Users, FileText, Bell, ChevronRight, CalendarDays, ShieldCheck, LayoutDashboard, ClipboardList, GraduationCap, ReceiptText, ChevronsLeft, ChevronsRight, BellDot } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ThemeToggle } from '@/components/public/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
}

type PortalUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  avatarUrl?: string
}

export function PortalLayout({ children, role }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState<PortalUser | null>(null)
  const [passportUploaded, setPassportUploaded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadUser = async () => {
      const response = await fetch('/api/v1/auth/me')
      const data = await response.json().catch(() => null)
      setUser(data?.user || null)

      if ((data?.user?.role || role) === 'aspirant') {
        const [photoRes, notificationRes] = await Promise.all([
          fetch('/api/v1/admissions/profile-photo'),
          fetch('/api/v1/notifications/aspirant'),
        ])
        const photoData = await photoRes.json().catch(() => null)
        const notificationData = await notificationRes.json().catch(() => null)
        setPassportUploaded(Boolean(photoData?.data?.length))
        setUnreadCount((notificationData?.data || []).filter((item: { is_read?: boolean }) => !item.is_read).length)
      }
    }

    loadUser()

    const refreshHandler = async () => {
      const response = await fetch('/api/v1/auth/me')
      const data = await response.json().catch(() => null)
      setUser(data?.user || null)

      if ((data?.user?.role || role) === 'aspirant') {
        const [photoRes, notificationRes] = await Promise.all([
          fetch('/api/v1/admissions/profile-photo'),
          fetch('/api/v1/notifications/aspirant'),
        ])
        const photoData = await photoRes.json().catch(() => null)
        const notificationData = await notificationRes.json().catch(() => null)
        setPassportUploaded(Boolean(photoData?.data?.length))
        setUnreadCount((notificationData?.data || []).filter((item: { is_read?: boolean }) => !item.is_read).length)
      }
    }

    window.addEventListener('portal-profile-updated', refreshHandler)
    return () => window.removeEventListener('portal-profile-updated', refreshHandler)
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/v1/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Logout failed')
      toast.success('You have been signed out.')
      router.replace(ROUTES.login)
      router.refresh()
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
        { label: 'Upload passport', href: '/aspirant/dashboard#passport-photo', icon: FileText },
        { label: 'Documents', href: '/aspirant/dashboard#documents', icon: FileText },
        { label: 'Profile', href: '/aspirant/profile', icon: Users },
        { label: 'Status', href: '/aspirant/status', icon: ShieldCheck },
      ],
    }

    return roleItems[role as keyof typeof roleItems] || []
  }, [role])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const pageTitle = navItems.find((item) => isActive(item.href))?.label || 'Dashboard'
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ ['--sidebar-width' as never]: sidebarCollapsed ? '5rem' : '18rem' }}
    >
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
            {role === 'aspirant' ? (
              <button
                type="button"
                onClick={() => router.push('/aspirant/notifications')}
                className="hidden rounded-xl border border-border bg-card p-2 text-foreground/70 transition hover:text-primary sm:inline-flex"
                aria-label="Notifications"
              >
                {unreadCount > 0 ? <BellDot className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            ) : null}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-sm transition hover:border-primary/40">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/50">Signed in</p>
                    <p className="max-w-32 truncate font-semibold text-foreground">{displayName}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-border bg-white text-foreground shadow-2xl dark:bg-black">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-xs text-foreground/60">{user?.email || ''}</p>
                      <p className="text-[11px] capitalize text-foreground/50">{user?.role || role}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.home}>Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={role === 'student' ? '/student/profile' : role === 'teacher' ? '/teacher/courses' : role === 'admin' ? '/admin/dashboard' : '/aspirant/profile'}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <AlertDialogContent className="border-border bg-white dark:bg-zinc-950">
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
          className={`fixed inset-y-16 left-0 z-30 overflow-hidden border-r border-border bg-white/95 dark:bg-black/95 backdrop-blur transition-all duration-300 xl:fixed xl:top-16 xl:h-[calc(100vh-4rem)] ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
          } ${sidebarCollapsed ? 'w-[4.75rem]' : 'w-[18rem]'}`}
          style={{ width: 'var(--sidebar-width)' }}
        >
          <div className="border-b border-border/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">Portal menu</p>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border p-0 text-foreground/70 transition hover:border-primary/40 hover:text-primary xl:inline-flex"
                aria-label="Collapse sidebar"
              >
                {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            </div>
            <div className={`mt-3 rounded-2xl border border-border bg-background p-4 ${sidebarCollapsed ? 'xl:hidden' : ''}`}>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={user?.avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground capitalize">{displayName}</p>
                  <p className="text-xs capitalize text-foreground/60">{user?.role || role}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-6 text-foreground/60">
                Secure workspace for {role === 'admin' ? 'administration and approvals' : role === 'aspirant' ? 'admission progress' : 'academic management'}.
              </p>
              {role === 'aspirant' && passportUploaded && (
                <div className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Passport uploaded
                </div>
              )}
            </div>
          </div>
          <nav className="flex h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const navLink = (
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex w-full items-center rounded-2xl px-4 py-3 font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/75 hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={`ml-3 truncate ${sidebarCollapsed ? 'xl:hidden' : ''}`}>{item.label}</span>
                  {!sidebarCollapsed && <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-40" />}
                </Link>
              )

              return (
                <div key={item.href} className="relative">
                  {sidebarCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                      <TooltipContent side="right" className="border border-border bg-white text-foreground dark:bg-black dark:text-foreground">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    navLink
                  )}
                </div>
              )
            })}
            <div className={`mt-4 rounded-2xl border border-border bg-background p-4 ${sidebarCollapsed ? 'xl:hidden' : ''}`}>
              <p className="text-xs uppercase tracking-[0.22em] text-foreground/45">Account</p>
              <p className="mt-2 text-sm font-semibold text-foreground capitalize">{displayName}</p>
              <p className="text-xs text-foreground/55">{user?.email || ''}</p>
              <p className="mt-1 text-xs capitalize text-foreground/55">Status: {user?.role || role}</p>
              {role === 'aspirant' && passportUploaded && (
                <div className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Passport uploaded
                </div>
              )}
            </div>
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-white/50 dark:bg-black/60 xl:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto xl:pl-[var(--sidebar-width)]">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
