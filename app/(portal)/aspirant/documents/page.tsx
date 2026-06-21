'use client'

import { Card } from '@/components/ui/card'
import { FileUp, Image as ImageIcon, UploadCloud } from 'lucide-react'

export default function AspirantDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Documents</p>
        <h1 className="mt-3 text-3xl font-extrabold">Upload and manage documents</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><ImageIcon className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Passport photo</h2>
              <p className="text-sm text-muted-foreground">Use a clear recent photograph.</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><FileUp className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Other documents</h2>
              <p className="text-sm text-muted-foreground">Upload certificates and identity documents.</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Document upload forms can be placed here and connected to the existing storage service.
          </div>
        </Card>
      </div>
    </div>
  )
}
