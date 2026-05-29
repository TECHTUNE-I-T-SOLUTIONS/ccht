'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LogOut, Home, BookOpen, BarChart3, Settings, Users, FileText } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ThemeToggle } from '@/components/public/theme-toggle'

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
      router.push(ROUTES.login)
    } catch (error) {
      console.error('Logout error:', error)
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href={ROUTES.home} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">
                C
              </div>
              <span className="hidden sm:inline text-lg font-bold text-primary">{SCHOOL_INFO.shortName}</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-foreground/70">Welcome,</span>
              <span className="font-semibold text-foreground capitalize">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-16 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
