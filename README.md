# Covenant College of Health Technology (CCHT) - Premium Education Platform

A modern, responsive, fully-featured educational management platform for Covenant College of Health Technology built with Next.js 16, Supabase, and Tailwind CSS.

## 🎯 Overview

CCHT Platform provides a complete solution for health technology education with:

- **Premium Public Website**: Modern homepage, about, programs, blog, events, and contact pages
- **Student Portal**: Enrollment management, course tracking, results, and online fee payment
- **Teacher Portal**: Course and grade management, student tracking
- **Admin CMS**: Complete content and system management
- **Payment Integration**: Secure Paystack payment gateway integration
- **Dark/Light Mode**: Full theme switching with persistence
- **Responsive Design**: Mobile-first, fully responsive across all devices
- **Database-Driven Content**: All content stored in Supabase PostgreSQL with RLS policies

## ✨ Features

### Public Website
- ✅ Modern hero section with school image
- ✅ Featured programs showcase
- ✅ Blog and news updates
- ✅ Event calendar
- ✅ Contact form with email notifications
- ✅ Comprehensive about/mission pages
- ✅ SEO optimized
- ✅ Accessibility compliant

### Authentication & Security
- ✅ Email/password authentication
- ✅ Role-based access control (Student, Teacher, Admin)
- ✅ Protected routes with middleware
- ✅ Email verification
- ✅ Password reset functionality
- ✅ Row-Level Security (RLS) policies on all data

### Student Portal
- Dashboard with enrolled courses and stats
- Course listing and enrollment
- Academic results/grades viewing
- Payment history
- Fee payment with Paystack
- Profile management

### Admin CMS
- Program management (CRUD)
- Blog post management
- Event management
- User management and role assignment
- Fee and payment settings
- School info settings
- Payment tracking and reports

### Payment Integration
- Paystack payment gateway
- Payment history tracking
- Receipt generation
- Webhook handlers for payment verification
- Transaction logging and reconciliation

## 🛠 Tech Stack

```
Frontend:
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- React 19+
- Lucide React (Icons)
- next-themes (Dark mode)

Backend:
- Next.js API Routes (/api/v1/*)
- Service Layer Architecture

Database:
- Supabase PostgreSQL
- Row-Level Security (RLS)
- Real-time subscriptions ready

Authentication:
- Supabase Auth
- Email verification
- Password reset

External Services:
- Nodemailer (Email)
- Paystack (Payments)
```

## 📋 Project Structure

```
app/
  layout.tsx                          # Root layout with theme provider
  (public)/                           # Public pages
    page.tsx                          # Home
    about/page.tsx                    # About
    programs/page.tsx                 # Programs listing
    blog/page.tsx                     # Blog listing
    events/page.tsx                   # Events listing
    contact/page.tsx                  # Contact form
    not-found.tsx                     # 404 page
  (auth)/                             # Auth pages
    login/page.tsx
    register/page.tsx
  (portal)/                           # Protected portal
    student/
    teacher/
    admin/
  api/
    v1/
      auth/                           # Auth routes
      programs/                       # Program CRUD
      blog/                           # Blog CRUD
      events/                         # Event CRUD
      contact/                        # Contact form
      payments/                       # Payment endpoints

components/
  public/                             # Public site components
    navbar.tsx
    footer.tsx
    theme-toggle.tsx
  admin/                              # Admin components
  portal/                             # Portal components

lib/
  constants.ts                        # App-wide constants
  validation.ts                       # Zod schemas
  services/                           # Business logic
    program.service.ts
    blog.service.ts
    event.service.ts
    user.service.ts
    payment.service.ts
    email.service.ts
    school-settings.service.ts
  supabase/
    client.ts                         # Browser client
    server.ts                         # Server client
    proxy.ts                          # Auth proxy

supabase/
  migrations/
    001_create_schema.sql             # Database schema

public/
  images/                             # Static images
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account (free tier works)
- SMTP server credentials for email
- Paystack merchant account (for payments)

### Installation

1. **Clone & Install Dependencies**
```bash
git clone <repo-url>
cd ccht-platform
pnpm install
```

2. **Setup Supabase**
```bash
# Create a Supabase project at https://supabase.com
# Copy credentials to .env.local (see below)

# Run migrations to setup database schema
# Connect via Supabase dashboard and execute:
cat supabase/migrations/001_create_schema.sql
```

3. **Configure Environment Variables**
```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false

# Auth Redirect (for local development)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

4. **Run Development Server**
```bash
pnpm dev
# Open http://localhost:3000
```

## 📱 Key Pages

### Public Pages
- `/` - Home page with hero, programs, blog preview
- `/about` - School mission, vision, team, facilities
- `/programs` - All programs with filters and details
- `/blog` - Blog posts listing and reading
- `/events` - Upcoming events calendar
- `/contact` - Contact form and FAQs

### Authentication
- `/login` - User login
- `/register` - New user registration
- `/forgot-password` - Password reset

### Portals (Protected)
- `/portal/student/dashboard` - Student dashboard
- `/portal/teacher/dashboard` - Teacher dashboard
- `/portal/admin/dashboard` - Admin dashboard

## 🔐 Security Features

✅ **Row-Level Security (RLS)**: All database tables have RLS policies
✅ **Password Hashing**: Supabase Auth handles secure password storage
✅ **Email Verification**: Required before account activation
✅ **Protected Routes**: Middleware validates authentication
✅ **CSRF Protection**: Built-in with Next.js
✅ **SQL Injection Prevention**: Parameterized queries via Supabase client
✅ **Role-Based Access**: Admin/Teacher/Student role enforcement

## 📊 Database Schema

**Tables:**
- `profiles` - User profiles linked to auth.users
- `programs` - Course/program offerings
- `enrollments` - Student enrollments
- `results` - Academic grades and results
- `blog_posts` - Blog article content
- `events` - School events
- `payments` - Payment transactions (Paystack)
- `fees` - Fee types and amounts
- `announcements` - School announcements
- `school_settings` - App configuration

All tables have:
- ✅ RLS policies for row-level security
- ✅ Proper indexes for performance
- ✅ Timestamps (created_at, updated_at)
- ✅ Foreign key constraints

## 🌙 Dark Mode

Full dark mode support with:
- Toggle button in navbar
- Persistent preference (localStorage)
- Smooth transitions
- All components styled for both modes
- Accessible color contrasts (WCAG AA)

## 📧 Email Notifications

Automated emails for:
- User registration and email verification
- Password reset
- Payment confirmations
- Enrollment confirmations
- Contact form submissions
- Admin notifications

## 💳 Payment Integration

### Paystack Workflow
1. Student initiates payment from portal
2. Redirected to Paystack checkout
3. Payment processed
4. Webhook verifies transaction
5. Payment recorded in database
6. Confirmation email sent

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Connect GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# Auto-deploys on push to main

vercel deploy
```

### Environment Setup
1. Set all environment variables in production dashboard
2. Ensure Supabase project is configured for production
3. Use Paystack live keys (not test keys)
4. Configure SMTP for production email service

## 📈 Performance Optimization

- ✅ Image optimization with next/image
- ✅ Code splitting and lazy loading
- ✅ Database query optimization with indexes
- ✅ Caching strategies
- ✅ CSS-in-JS minimization
- ✅ SEO meta tags optimization

**Target Lighthouse Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

## 🧪 Testing

Run tests with:
```bash
pnpm test
```

Test coverage includes:
- API endpoint tests
- Form validation tests
- Authentication flow tests
- Service layer tests

## 📚 API Documentation

### Auth Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

### Program Endpoints
- `GET /api/v1/programs` - List all programs
- `POST /api/v1/programs` - Create program (admin)
- `GET /api/v1/programs/[id]` - Get program details
- `PUT /api/v1/programs/[id]` - Update program
- `DELETE /api/v1/programs/[id]` - Delete program

### Blog Endpoints
- `GET /api/v1/blog` - List all posts
- `POST /api/v1/blog` - Create post (admin)
- Similar CRUD endpoints for blog

### Payment Endpoints
- `POST /api/v1/payments/initiate` - Start Paystack payment
- `POST /api/v1/payments/paystack-webhook` - Webhook handler
- `GET /api/v1/payments` - Payment history

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check Supabase credentials in .env.local
# Verify database schema was created (check SQL migrations)
# Test connection: supabase status
```

### Email Not Sending
```bash
# Verify SMTP credentials
# Check SMTP_PORT and SMTP_SECURE settings
# Test with SMTP server (gmail requires app password)
```

### Payment Issues
```bash
# Use Paystack test keys for development
# Test webhook delivery in Paystack dashboard
# Check payment logs in database (payments table)
```

## 📞 Support

For issues or questions:
- Email: info@covenantcollegeofhealthtech.com.ng
- Phone: +234 7066 3698 18
- Location: Igbon, Oyo, Nigeria

## 📄 License

© 2026 Covenant College of Health Technology. All rights reserved.

## 🎨 Design

- **Color Scheme**: Professional red (#e03a3c) + teals for healthcare
- **Typography**: Geist font family
- **Components**: Custom + Shadcn/ui
- **Spacing**: Tailwind scale system
- **Breakpoints**: Responsive from 320px (mobile) to 1920px (desktop)

## 🔄 Version History

- **v1.0.0** (Current) - Initial release with Phases 1-3 complete

## 🤝 Contributing

Contributions welcome! Please:
1. Create feature branches
2. Follow existing code patterns
3. Test changes thoroughly
4. Submit pull requests with clear descriptions

---

**Built with ❤️ for quality health education**
