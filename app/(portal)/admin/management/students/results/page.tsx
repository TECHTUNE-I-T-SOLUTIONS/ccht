'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, CheckCircle, ArrowRight } from 'lucide-react'

export default function StudentResultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Results Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage student results, assessment entries, and publish final exams</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/admin/management/students/results/all-students">
          <Card className="group p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-2">Manage All Students' Results</h3>
            <p className="text-sm text-muted-foreground">
              View and manage all registered students' assessment and exam results for each course. Edit and modify results as needed.
            </p>
          </Card>
        </Link>

        <Link href="/admin/management/students/results/assessment-entries">
          <Card className="group p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-2">Manage Assessment Entries</h3>
            <p className="text-sm text-muted-foreground">
              Enter and manage student CAs, assessments, and test scores. Create and modify assessment records for each student.
            </p>
          </Card>
        </Link>

        <Link href="/admin/management/students/results/publish-exams">
          <Card className="group p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <CheckCircle className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-2">Publish Final Exams</h3>
            <p className="text-sm text-muted-foreground">
              Publish final exam results so students can view their complete results for all courses in the student results page.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
