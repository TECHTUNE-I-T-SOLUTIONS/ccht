'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail, FileText, Clock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function ExamThankYouPage() {
  const router = useRouter()

  useEffect(() => {
    // Show success message
    toast.success('Exam submitted successfully!', {
      description: 'Your entrance exam has been submitted for review.',
    })

    // Auto-navigate to dashboard after 10 seconds
    const timer = setTimeout(() => {
      router.push('/aspirant/dashboard')
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Card className="space-y-8 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">Thank You!</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Your entrance exam has been submitted successfully
          </p>
        </div>

        <div className="space-y-6 rounded-2xl bg-slate-50 p-8 dark:bg-slate-800/50">
          <h3 className="text-xl font-bold text-foreground">What happens next?</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Application Review</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our admissions team will carefully review your application, documents, and exam results.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Email Notification</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  You will receive an email at your registered email address with your admission status update.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Processing Time</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  The review process typically takes 7-14 business days. You can check your status anytime on this portal.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Stay Informed</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check your dashboard regularly for updates. We will notify you if we need any additional information or documents.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 dark:bg-blue-500/10">
          <h4 className="mb-2 font-semibold text-foreground">Important Information</h4>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Keep your login credentials safe for future access</li>
            <li>Monitor your email (including spam/junk folder) for updates</li>
            <li>Your exam has been recorded for quality assurance</li>
            <li>If you have any questions, contact the admissions office</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            You will be redirected to your dashboard in 10 seconds...
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Thank you for choosing CCHT. We wish you the best!</p>
          <p className="mt-1">For inquiries, contact: admissions@ccht.edu.ng</p>
        </div>
      </Card>
    </div>
  )
}