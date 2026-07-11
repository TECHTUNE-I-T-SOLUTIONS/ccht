'use client'

import { Card } from '@/components/ui/card'
import { BadgeCheck, FileUp, Image as ImageIcon, UploadCloud } from 'lucide-react'

export default function AspirantDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Documents</p>
        <h1 className="mt-3 text-3xl font-extrabold">Upload and manage your admission files</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Add the required documents for your application. Passport photos and files are now Cloudinary-backed and validated before upload.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><ImageIcon className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Passport photo</h2>
              <p className="text-sm text-muted-foreground">Use a clear recent photograph, preferably with a plain background.</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Upload through the passport section in the dashboard. Max size: 5MB.
          </div>
        </Card>
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><FileUp className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Other documents</h2>
              <p className="text-sm text-muted-foreground">Upload certificates and identity documents for verification.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            {['O\'level result', 'Birth certificate', 'State of origin', 'NIN slip', 'Medical report', 'Passport photo'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
