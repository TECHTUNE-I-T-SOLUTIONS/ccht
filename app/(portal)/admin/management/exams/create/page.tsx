'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Save, X, ChevronRight, Shield, Settings, CheckCircle2, Loader2 } from 'lucide-react'
import { toNigerianTime, formatNigerianTime } from '@/lib/timezone'

type Course = {
  id: string
  code: string
  title: string
  program?: {
    title: string
    department?: {
      name: string
    }
  }
}

type AcademicSession = {
  id: string
  name: string
}

type AcademicSemester = {
  id: string
  semester_name: string
}

type ProctoringConfig = {
  exam_type: string
  max_violations: number
  auto_submit_on_max_violations: boolean
  record_screen: boolean
  require_webcam: boolean
  require_microphone: boolean
  require_fullscreen: boolean
  block_copy_paste: boolean
  block_right_click: boolean
  block_devtools: boolean
  detect_tab_switch: boolean
  detect_visibility_change: boolean
}

export default function AdminCreateExamPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [semesters, setSemesters] = useState<AcademicSemester[]>([])

  const [formData, setFormData] = useState({
    course_id: '',
    session_id: '',
    semester_id: '',
    exam_title: '',
    exam_description: '',
    exam_type: 'regular',
    start_date: '',
    end_date: '',
    duration_minutes: 60,
    total_marks: 100,
    passing_marks: 60,
    instructions: '',
    is_published: false,
    allow_review: true,
    review_start_date: '',
    review_end_date: '',
    proctoring_enabled: true,
    proctoring_mode: 'default',
    proctoring_config: {
      exam_type: 'regular',
      max_violations: 5,
      auto_submit_on_max_violations: true,
      record_screen: true,
      require_webcam: true,
      require_microphone: false,
      require_fullscreen: true,
      block_copy_paste: true,
      block_right_click: true,
      block_devtools: true,
      detect_tab_switch: true,
      detect_visibility_change: true,
    } as ProctoringConfig,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [coursesRes, sessionsRes, semestersRes] = await Promise.all([
        fetch('/api/v1/courses'),
        fetch('/api/v1/admin/academic-sessions'),
        fetch('/api/v1/admin/academic-semesters'),
      ])
      
      if (!coursesRes.ok) throw new Error('Failed to load courses')
      if (!sessionsRes.ok) throw new Error('Failed to load sessions')
      if (!semestersRes.ok) throw new Error('Failed to load semesters')
      
      const coursesData = await coursesRes.json()
      const sessionsData = await sessionsRes.json()
      const semestersData = await semestersRes.json()

      setCourses(coursesData.data || [])
      setSessions(sessionsData.data || [])
      setSemesters(semestersData.data || [])
    } catch (error) {
      toast.error('Failed to load required data')
      console.error(error)
    }
  }

  const handleSubmit = async () => {
    setShowConfirmDialog(true)
  }

  const confirmSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        // Convert dates to Nigerian time before sending to API
        start_date: toNigerianTime(formData.start_date),
        end_date: toNigerianTime(formData.end_date),
        review_start_date: formData.review_start_date ? toNigerianTime(formData.review_start_date) : null,
        review_end_date: formData.review_end_date ? toNigerianTime(formData.review_end_date) : null,
        proctoring_config: formData.proctoring_enabled 
          ? formData.proctoring_config 
          : null,
      }

      const res = await fetch('/api/v1/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create exam')
      }

      const data = await res.json()
      toast.success('Exam created successfully')
      setShowConfirmDialog(false)
      router.push(`/admin/management/exams/${data.data.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create exam')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!formData.course_id) {
        toast.error('Please select a course')
        return false
      }
      if (!formData.session_id) {
        toast.error('Please select an academic session')
        return false
      }
      if (!formData.semester_id) {
        toast.error('Please select a semester')
        return false
      }
      if (!formData.exam_title) {
        toast.error('Please enter an exam title')
        return false
      }
      if (!formData.exam_type) {
        toast.error('Please select an exam type')
        return false
      }
    }
    if (currentStep === 2) {
      if (!formData.start_date) {
        toast.error('Please select a start date')
        return false
      }
      if (!formData.end_date) {
        toast.error('Please select an end date')
        return false
      }
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        toast.error('End date must be after start date')
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const setDefaultProctoring = () => {
    setFormData(prev => ({
      ...prev,
      proctoring_mode: 'default',
      proctoring_config: {
        exam_type: prev.exam_type,
        max_violations: 5,
        auto_submit_on_max_violations: true,
        record_screen: true,
        require_webcam: true,
        require_microphone: false,
        require_fullscreen: true,
        block_copy_paste: true,
        block_right_click: true,
        block_devtools: true,
        detect_tab_switch: true,
        detect_visibility_change: true,
      },
    }))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Exam Session</h1>
            <p className="text-sm text-muted-foreground">Step {step} of 3: Configure your exam settings</p>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="font-medium">Schedule</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="font-medium">Proctoring</span>
            </div>
          </div>
        </Card>

        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session">Academic Session *</Label>
                  <Select value={formData.session_id} onValueChange={(value) => setFormData({ ...formData, session_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="semester">Semester *</Label>
                  <Select value={formData.semester_id} onValueChange={(value) => setFormData({ ...formData, semester_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.semester_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="exam_title">Exam Title *</Label>
                <Input
                  id="exam_title"
                  value={formData.exam_title}
                  onChange={(e) => setFormData({ ...formData, exam_title: e.target.value })}
                  placeholder="e.g., Mid-Semester Examination"
                />
              </div>

              <div>
                <Label htmlFor="exam_type">Exam Type *</Label>
                <Select value={formData.exam_type} onValueChange={(value) => setFormData({ ...formData, exam_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="mid_semester">Mid-Semester</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="supplementary">Supplementary</SelectItem>
                    <SelectItem value="resit">Resit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="exam_description">Description</Label>
                <Textarea
                  id="exam_description"
                  value={formData.exam_description}
                  onChange={(e) => setFormData({ ...formData, exam_description: e.target.value })}
                  placeholder="Brief description of the exam..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Schedule & Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date & Time *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="total_marks">Total Marks</Label>
                  <Input
                    id="total_marks"
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="passing_marks">Passing Marks</Label>
                  <Input
                    id="passing_marks"
                    type="number"
                    value={formData.passing_marks}
                    onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Exam instructions for students..."
                  rows={4}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_published">Publish Immediately</Label>
                    <p className="text-xs text-muted-foreground">Make this exam visible to students immediately</p>
                  </div>
                  <Checkbox
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow_review">Allow Review</Label>
                    <p className="text-xs text-muted-foreground">Allow students to review their answers after submission</p>
                  </div>
                  <Checkbox
                    id="allow_review"
                    checked={formData.allow_review}
                    onCheckedChange={(checked) => setFormData({ ...formData, allow_review: checked as boolean })}
                  />
                </div>

                {formData.allow_review && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                    <div>
                      <Label htmlFor="review_start_date">Review Start Date</Label>
                      <Input
                        id="review_start_date"
                        type="datetime-local"
                        value={formData.review_start_date}
                        onChange={(e) => setFormData({ ...formData, review_start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="review_end_date">Review End Date</Label>
                      <Input
                        id="review_end_date"
                        type="datetime-local"
                        value={formData.review_end_date}
                        onChange={(e) => setFormData({ ...formData, review_end_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Proctoring Configuration
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <Label htmlFor="proctoring_enabled">Enable Proctoring</Label>
                  <p className="text-xs text-muted-foreground">Monitor students during the exam to prevent cheating</p>
                </div>
                <Checkbox
                  id="proctoring_enabled"
                  checked={formData.proctoring_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, proctoring_enabled: checked as boolean })}
                />
              </div>

              {formData.proctoring_enabled && (
                <>
                  <div>
                    <Label>Proctoring Mode</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Card
                        className={`p-4 cursor-pointer border-2 transition-all ${
                          formData.proctoring_mode === 'default' 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setDefaultProctoring()}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.proctoring_mode === 'default' ? 'border-primary bg-primary' : 'border-border'
                          }`}>
                            {formData.proctoring_mode === 'default' && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">Default</p>
                            <p className="text-xs text-muted-foreground">Recommended settings for this exam type</p>
                          </div>
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                      </Card>
                      <Card
                        className={`p-4 cursor-pointer border-2 transition-all ${
                          formData.proctoring_mode === 'custom' 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, proctoring_mode: 'custom' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.proctoring_mode === 'custom' ? 'border-primary bg-primary' : 'border-border'
                          }`}>
                            {formData.proctoring_mode === 'custom' && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">Custom</p>
                            <p className="text-xs text-muted-foreground">Configure proctoring settings manually</p>
                          </div>
                          <Settings className="h-5 w-5 text-primary" />
                        </div>
                      </Card>
                    </div>
                  </div>

                  {formData.proctoring_mode === 'custom' && (
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div>
                        <Label htmlFor="proctoring_exam_type">Exam Type</Label>
                        <Select 
                          value={formData.proctoring_config.exam_type} 
                          onValueChange={(value) => setFormData({
                            ...formData,
                            proctoring_config: { ...formData.proctoring_config, exam_type: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entrance Examination">Entrance Examination</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="mid_semester">Mid-Semester</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                            <SelectItem value="supplementary">Supplementary</SelectItem>
                            <SelectItem value="resit">Resit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="max_violations">Max Violations Allowed</Label>
                        <Input
                          id="max_violations"
                          type="number"
                          value={formData.proctoring_config.max_violations}
                          onChange={(e) => setFormData({
                            ...formData,
                            proctoring_config: { ...formData.proctoring_config, max_violations: parseInt(e.target.value) }
                          })}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Monitoring Features</Label>
                        {[
                          { key: 'record_screen', label: 'Record Screen' },
                          { key: 'require_webcam', label: 'Require Webcam' },
                          { key: 'require_microphone', label: 'Require Microphone' },
                          { key: 'require_fullscreen', label: 'Require Fullscreen' },
                          { key: 'block_copy_paste', label: 'Block Copy/Paste' },
                          { key: 'block_right_click', label: 'Block Right Click' },
                          { key: 'block_devtools', label: 'Block Developer Tools' },
                          { key: 'detect_tab_switch', label: 'Detect Tab Switch' },
                          { key: 'detect_visibility_change', label: 'Detect Visibility Change' },
                        ].map((feature) => (
                          <div key={feature.key} className="flex items-center justify-between">
                            <Label htmlFor={feature.key}>{feature.label}</Label>
                            <Checkbox
                              id={feature.key}
                              checked={formData.proctoring_config[feature.key as keyof ProctoringConfig] as boolean}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                proctoring_config: { ...formData.proctoring_config, [feature.key]: checked }
                              })}
                            />
                          </div>
                        ))}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <Label htmlFor="auto_submit_on_max_violations">Auto-submit on Max Violations</Label>
                          <Checkbox
                            id="auto_submit_on_max_violations"
                            checked={formData.proctoring_config.auto_submit_on_max_violations}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              proctoring_config: { ...formData.proctoring_config, auto_submit_on_max_violations: checked as boolean }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Exam'} <Save className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white dark:bg-blue-950">
          <DialogHeader>
            <DialogTitle>Confirm Exam Creation</DialogTitle>
            <DialogDescription>
              Please review the exam details before creating:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Exam Title:</span>
              <span className="font-medium">{formData.exam_title}</span>
              
              <span className="text-muted-foreground">Course:</span>
              <span className="font-medium">{courses.find(c => c.id === formData.course_id)?.code || 'Not selected'}</span>
              
              <span className="text-muted-foreground">Session:</span>
              <span className="font-medium">{sessions.find(s => s.id === formData.session_id)?.name || 'Not selected'}</span>
              
              <span className="text-muted-foreground">Semester:</span>
              <span className="font-medium">{semesters.find(s => s.id === formData.semester_id)?.semester_name || 'Not selected'}</span>
              
              <span className="text-muted-foreground">Exam Type:</span>
              <span className="font-medium">{formData.exam_type}</span>
              
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{formData.duration_minutes} minutes</span>
              
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="font-medium">{formData.total_marks}</span>
              
              <span className="text-muted-foreground">Passing Marks:</span>
              <span className="font-medium">{formData.passing_marks}</span>
              
              <span className="text-muted-foreground">Proctoring:</span>
              <span className="font-medium">{formData.proctoring_enabled ? 'Enabled' : 'Disabled'}</span>
              
              {formData.proctoring_enabled && (
                <>
                  <span className="text-muted-foreground">Proctoring Mode:</span>
                  <span className="font-medium">{formData.proctoring_mode}</span>
                </>
              )}
              
              <span className="text-muted-foreground">Publish Immediately:</span>
              <span className="font-medium">{formData.is_published ? 'Yes' : 'No'}</span>
              
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-medium">{formData.start_date ? formatNigerianTime(formData.start_date) : 'N/A'}</span>
              
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-medium">{formData.end_date ? formatNigerianTime(formData.end_date) : 'N/A'}</span>
              
              <span className="text-muted-foreground">Allow Review:</span>
              <span className="font-medium">{formData.allow_review ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Confirm & Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
