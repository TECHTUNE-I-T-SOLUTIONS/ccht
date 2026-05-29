# CCHT Platform - Deployment Guide

## Pre-Deployment Checklist

### 1. Database Setup (Supabase)
- [ ] Create Supabase project
- [ ] Run migrations from `supabase/migrations/001_create_schema.sql`
- [ ] Verify all tables created with RLS policies
- [ ] Test database connection

### 2. Environment Variables
Copy and fill all variables in production environment:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# Paystack (Live Keys)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx  # NOT test key!
PAYSTACK_SECRET_KEY=sk_live_xxxxx              # NOT test key!

# Email Service
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=noreply@covenantcollegeofhealthtech.com.ng
SMTP_PASS=your-app-specific-password
SMTP_SECURE=false

# Production URL
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://ccht-domain.com
```

### 3. Paystack Configuration

**Test Paystack Integration First:**
1. Create Paystack test merchant account
2. Use test keys in development
3. Test payment flow end-to-end
4. Verify webhook receiving

**Setup Paystack Live:**
1. Complete merchant KYC verification on Paystack
2. Get live API keys
3. Configure webhook URL: `https://your-domain.com/api/v1/payments/paystack-webhook`
4. Test with small transactions
5. Switch to production keys in environment

### 4. Email Configuration

**Gmail Setup (Recommended for testing):**
```bash
1. Enable 2-factor authentication
2. Create App Password (16-character)
3. Use App Password in SMTP_PASS
4. SMTP_HOST=smtp.gmail.com
5. SMTP_PORT=587
6. SMTP_SECURE=false
```

**Production Email (e.g., SendGrid, AWS SES):**
1. Create account and verify domain
2. Get SMTP credentials
3. Set up SPF/DKIM records for domain
4. Update environment variables

### 5. Domain & SSL

- [ ] Register domain (e.g., ccht-platform.com)
- [ ] Point DNS to hosting provider
- [ ] SSL certificate auto-configured by Vercel
- [ ] Test HTTPS connection

## Deployment to Vercel

### Option A: GitHub Integration (Recommended)

1. **Push Code to GitHub**
```bash
git init
git add .
git commit -m "Initial CCHT platform commit"
git branch -M main
git remote add origin https://github.com/your-org/ccht-platform.git
git push -u origin main
```

2. **Connect to Vercel**
- Go to https://vercel.com/new
- Select "GitHub" and authenticate
- Choose the repository
- Click "Import"

3. **Configure Environment Variables**
- In Vercel dashboard → Settings → Environment Variables
- Add all variables from `.env.local`
- Select appropriate environments (Production, Preview, Development)

4. **Deploy**
- Vercel auto-deploys on push to main
- Wait for build to complete
- Test production deployment

### Option B: Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables interactively
# Follow prompts to configure
```

## Database Schema Application

### Method 1: Supabase Dashboard
1. Login to Supabase dashboard
2. Go to SQL Editor
3. Paste content from `supabase/migrations/001_create_schema.sql`
4. Execute query
5. Verify all tables created

### Method 2: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Reset database (development only)
supabase db reset
```

## Post-Deployment Verification

### 1. Test Public Website
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Dark/light mode toggles
- [ ] Contact form sends emails
- [ ] Images load properly

### 2. Test Authentication
- [ ] Register new user (test@example.com)
- [ ] Confirm email verification email received
- [ ] Login with test user
- [ ] Check user profile created in database

### 3. Test Content Management
- [ ] Create test program in admin
- [ ] Create test blog post
- [ ] Create test event
- [ ] Verify appears on public pages

### 4. Test Payments
- [ ] Initiate payment as test student
- [ ] Complete Paystack test payment
- [ ] Verify payment recorded in database
- [ ] Check confirmation email received

### 5. Verify Monitoring
- [ ] Setup error tracking (Sentry, Rollbar)
- [ ] Enable Vercel analytics
- [ ] Monitor database performance
- [ ] Setup uptime monitoring

## Monitoring & Maintenance

### Daily Tasks
- Check error logs
- Monitor failed payments
- Review contact form submissions
- Check email delivery

### Weekly Tasks
- Review analytics
- Check database storage usage
- Audit user activity logs
- Test backup restoration

### Monthly Tasks
- Security audit
- Performance optimization
- Database maintenance
- Cost analysis

## Performance Optimization

### Database
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM programs WHERE is_active = true;

-- Monitor slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC;

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Application
- Monitor Core Web Vitals in Vercel dashboard
- Use Lighthouse for performance audits
- Optimize images with next/image
- Enable caching strategies

### Scale Considerations
- Enable Supabase autoscaling
- Configure connection pooling
- Setup CDN for static assets
- Implement rate limiting

## Backup & Recovery

### Supabase Backups
1. Supabase automatically backs up daily
2. Keep backups for 7 days (free tier)
3. Export critical data regularly:

```sql
-- Export users
SELECT * FROM profiles;

-- Export payments
SELECT * FROM payments WHERE status = 'success';
```

### Version Control
```bash
# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

## Troubleshooting

### Build Fails
1. Check build logs in Vercel
2. Verify all environment variables set
3. Check TypeScript errors: `pnpm run build`
4. Clear Vercel cache and redeploy

### Database Connection Issues
```bash
# Test connection
psql "postgresql://user:password@host:port/database"

# Check Supabase status
supabase status
```

### Email Not Sending
1. Check SMTP credentials
2. Review email logs in application
3. Verify SPF/DKIM records
4. Test with test@mailinator.com

### Payment Webhook Not Received
1. Verify webhook URL in Paystack dashboard
2. Check webhook logs in Paystack
3. Test webhook with Paystack dashboard
4. Verify firewall allows Paystack IPs

## Security Hardening

### Pre-Production
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Setup WAF (Vercel DDoS protection)
- [ ] Configure CORS properly
- [ ] Enable RLS on all database tables
- [ ] Audit authentication flow
- [ ] Test SQL injection prevention
- [ ] Review sensitive data exposure

### Production
- [ ] Monitor for unusual activity
- [ ] Setup security alerts
- [ ] Enable database backups
- [ ] Implement rate limiting
- [ ] Setup API key rotation schedule
- [ ] Enable audit logging

## Rollback Procedure

If issues occur in production:

```bash
# Identify previous working version
vercel list

# Rollback to previous deployment
vercel rollback

# Or redeploy specific commit
git checkout <commit-hash>
git push origin main
```

## Cost Optimization

### Vercel (Hosting)
- Free tier includes good monthly limits
- Pay-as-you-go for overages
- Monitor usage in dashboard

### Supabase (Database)
- Free tier: 500MB storage, good for starting
- Scale as needed
- Monitor metrics in dashboard

### Email (SMTP)
- Gmail free: Limited sends
- SendGrid: 100 emails/day free
- Upgrade as user base grows

### Paystack (Payments)
- Transaction fee: 1.5% + ₦100
- Monthly invoice settlement

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Paystack Docs**: https://paystack.com/docs

## Launch Checklist

- [ ] Domain configured and DNS updated
- [ ] SSL certificate verified
- [ ] All environment variables set
- [ ] Database schema applied
- [ ] Email service configured
- [ ] Paystack account verified (live keys)
- [ ] Public website tested
- [ ] Auth flow tested
- [ ] Payment flow tested
- [ ] Monitoring/analytics setup
- [ ] Backups configured
- [ ] Security hardening complete
- [ ] Team trained on deployment
- [ ] Launch announcement planned

---

**Ready to launch? Go through checklist above and you're good to go!**
