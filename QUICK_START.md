# CCHT Platform - Quick Start Guide

Get your premium educational platform live in 10 minutes!

## Prerequisites

- Vercel account (free tier works)
- Supabase account (free tier)
- Paystack account (free tier for testing)
- GitHub account (to deploy)

## Step 1: Prepare the Code (2 minutes)

1. Push this code to GitHub:
   ```bash
   git clone <this-repo>
   cd ccht-platform
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

## Step 2: Set Up Supabase Database (3 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** → click **New Query**
4. Copy the entire content from `supabase/migrations/001_create_schema.sql`
5. Paste and click **Run**
6. Wait for completion (you'll see "success" message)
7. Go to **Project Settings** → **API** and copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Deploy to Vercel (3 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<from-supabase>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase>
   PAYSTACK_PUBLIC_KEY=pk_test_xxx (get from Paystack)
   PAYSTACK_SECRET_KEY=sk_test_xxx (get from Paystack)
   ```
4. Click **Deploy**
5. Wait for build to complete (5-10 minutes)
6. Your site is now live! 🎉

## Step 4: Set Up Paystack Webhook (2 minutes)

1. Go to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Go to **Settings** → **Webhooks**
3. Add webhook URL:
   ```
   https://your-vercel-app.vercel.app/api/v1/payments/paystack-webhook
   ```
4. Select all events
5. Save

## Step 5: Test Everything (5 minutes)

### Public Site
- [ ] Visit homepage and check dark/light mode toggle
- [ ] Navigate all pages (About, Programs, Blog, Events, Contact)
- [ ] Fill contact form - check email
- [ ] Verify responsive design on mobile

### Student Portal
- [ ] Register a student account
- [ ] Login and view dashboard
- [ ] Navigate all student pages
- [ ] Try "Make Payment" (use Paystack test card)

### Admin Portal
- [ ] Register with email: `admin@ccht.edu.ng`
- [ ] Go to database and manually set role to "admin"
- [ ] Login to admin dashboard
- [ ] Add a test program
- [ ] Add a test blog post
- [ ] View payment tracking

### Test Paystack Card
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Date: Any future date

## Troubleshooting

### "Metadata error" on deploy
- Solution: Already fixed in code. If you see it, clear Vercel cache and redeploy

### "Connection refused" to Supabase
- Check `NEXT_PUBLIC_SUPABASE_URL` in Vercel Environment Variables

### Payment not processing
- Verify Paystack keys are correct in Vercel env vars
- Check webhook configuration points to your live URL

### Dark mode not working
- Clear browser cache and restart server

## Going Live

### Before Live Launch

1. **Switch Paystack to Live Keys**
   - Go to Paystack dashboard
   - Copy live keys (not test keys)
   - Update in Vercel env vars
   - Redeploy

2. **Configure Email Notifications**
   - Add SMTP credentials to env vars (Gmail, SendGrid, etc.)
   - Test email delivery

3. **Add Real School Logo**
   - Replace `public/images/hero-bg1.jpg` with your logo
   - Update any hardcoded school info in database

4. **Custom Domain**
   - In Vercel project settings → Domains
   - Add your domain (ccht.edu.ng)
   - Point DNS records as instructed

5. **SSL Certificate**
   - Automatically included with Vercel

## Admin First Login

After deploying, create admin account:

1. Go to `/register`
2. Enter: `admin@ccht.edu.ng` + strong password
3. Select "Teacher" role (you'll upgrade in DB)
4. In Supabase, go to `profiles` table
5. Find your admin user and change `role` to `admin`
6. Logout and login again - now you have admin dashboard!

## Daily Operations

### Add Programs
- Admin → Programs → "Add Program"
- Fill in details, fees, duration
- Click Save

### Create Blog Posts
- Admin → Blog → "New Post"
- Write content, set status to "Published"
- It appears on public blog page

### View Student Payments
- Admin → Payments
- See all transactions and revenue

### Manage Users
- Admin → Users
- View, edit, or deactivate accounts

## Monitoring

Check these regularly:

1. **Vercel Deployments**: vercel.com → Your Project → Deployments
2. **Supabase Database**: supabase.com → Your Project → Table Editor
3. **Paystack Transactions**: dashboard.paystack.com → Transactions
4. **Email Logs**: (if using SMTP provider)

## Need Help?

- Supabase issues: https://supabase.com/docs
- Vercel issues: https://vercel.com/support
- Paystack issues: https://paystack.com/support
- Code issues: Check GitHub issues or create one

## What's Included

- ✅ Complete responsive website
- ✅ Student portal with grades and payments
- ✅ Teacher portal with grade management
- ✅ Admin CMS with content management
- ✅ Paystack payment processing
- ✅ Dark/Light theme
- ✅ Database with RLS security
- ✅ Email service ready
- ✅ Mobile responsive design
- ✅ Professional healthcare branding

## Quick Reference

| Feature | Location | Time to Setup |
|---------|----------|--------------|
| Website | Public `/` | Ready! |
| Student Portal | `/student/dashboard` | Ready! |
| Teacher Portal | `/teacher/dashboard` | Ready! |
| Admin Dashboard | `/admin/dashboard` | Ready! |
| Payments | Paystack integrated | ~5 minutes |
| Email | Needs SMTP config | ~10 minutes |
| Custom Domain | Vercel settings | ~15 minutes |

---

**You're all set! Your platform is live!** 🚀

For detailed documentation, see:
- `README.md` - Full technical documentation
- `COMPLETION_SUMMARY.md` - What's been built
- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps
