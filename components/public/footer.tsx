import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-foreground text-background border-t border-border">
      <div className="mx-auto w-full max-w-none px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">
                C
              </div>
              {SCHOOL_INFO.shortName}
            </h3>
            <p className="text-md opacity-75 -mt-6 mb-2">
              {SCHOOL_INFO.fullname}
            </p>
            <p className="text-sm opacity-75">
              Quality education for health-filled society
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.home} className="opacity-75 hover:opacity-100 transition-opacity">Home</Link></li>
              <li><Link href={ROUTES.programs} className="opacity-75 hover:opacity-100 transition-opacity">Programs</Link></li>
              <li><Link href={ROUTES.about} className="opacity-75 hover:opacity-100 transition-opacity">About</Link></li>
              <li><Link href={ROUTES.contact} className="opacity-75 hover:opacity-100 transition-opacity">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.blog} className="opacity-75 hover:opacity-100 transition-opacity">Blog</Link></li>
              <li><Link href={ROUTES.events} className="opacity-75 hover:opacity-100 transition-opacity">Events</Link></li>
              <li><Link href={ROUTES.faq} className="opacity-75 hover:opacity-100 transition-opacity">FAQs</Link></li>
              <li><Link href={ROUTES.register} className="opacity-75 hover:opacity-100 transition-opacity">Admissions</Link></li>
              <li><Link href={ROUTES.login} className="opacity-75 hover:opacity-100 transition-opacity">Portal</Link></li>
            </ul>
          </div>

          {/* Portal Links */}
          <div>
            <h4 className="font-semibold mb-4">Portal Access</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.studentDashboard} className="opacity-75 hover:opacity-100 transition-opacity">Student Dashboard</Link></li>
              <li><Link href={ROUTES.lecturerDashboard} className="opacity-75 hover:opacity-100 transition-opacity">Lecturer Dashboard</Link></li>
              <li><Link href={ROUTES.adminDashboard} className="opacity-75 hover:opacity-100 transition-opacity">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="opacity-75">{SCHOOL_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href={`mailto:${SCHOOL_INFO.email}`} className="opacity-75 hover:opacity-100 transition-opacity">
                  {SCHOOL_INFO.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href={`tel:${SCHOOL_INFO.phone}`} className="opacity-75 hover:opacity-100 transition-opacity">
                  {SCHOOL_INFO.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-foreground/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs opacity-50">
            &copy; {new Date().getFullYear()} {SCHOOL_INFO.name}. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs opacity-50 mt-4 md:mt-0">
            <Link href={ROUTES.privacy} className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
            <Link href={ROUTES.terms} className="hover:opacity-100 transition-opacity">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
