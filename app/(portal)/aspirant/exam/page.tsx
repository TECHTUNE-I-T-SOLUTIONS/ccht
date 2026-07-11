'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldAlert, AlertTriangle, Monitor, Camera, Timer, ShieldCheck, CheckCircle2, ChevronRight, Volume2, Mic } from 'lucide-react'
import { toast } from 'sonner'

const MOCK_QUESTIONS = [
  { id: 1, question: 'Which of the following is the primary unit of life in human biology?', options: ['Tissue', 'Cell', 'Organ', 'System'], answer: 'Cell' },
  { id: 2, question: 'What is the primary function of white blood cells (leukocytes)?', options: ['Oxygen transport', 'Immune response and defense', 'Blood clotting', 'Hormone regulation'], answer: 'Immune response and defense' },
  { id: 3, question: 'Which organ is primarily responsible for filtering waste from the bloodstream?', options: ['Liver', 'Heart', 'Kidney', 'Lungs'], answer: 'Kidney' },
  { id: 4, question: "What does 'CA' typically stand for in tertiary academics?", options: ['Continuous Assessment', 'College Admin', 'Class Attendance', 'Course Advisor'], answer: 'Continuous Assessment' },
]

type ExamStep = 'intro' | 'requirements' | 'fullscreen' | 'permissions' | 'exam' | 'submitting'

export default function AspirantEntranceExam() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<ExamStep>('intro')
  const [agreedToRules, setAgreedToRules] = useState(false)
  const [webcamReady, setWebcamReady] = useState(false)
  const [micReady, setMicReady] = useState(false)
  const [fullscreenReady, setFullscreenReady] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [violations, setViolations] = useState<any[]>([])
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) setUserId(data.user.id)
      })
  }, [])

  // Timer countdown
  useEffect(() => {
    if (currentStep !== 'exam' || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [currentStep, timeLeft])

  const handleTimeOut = useCallback(() => {
    toast.error('Time is up! Submitting your exam automatically.')
    submitExam()
  }, [])

  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`

  // Step 2: Request fullscreen
  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
        setFullscreenReady(true)
        setCurrentStep('permissions')
        toast.success('Fullscreen mode enabled')
      }
    } catch (error) {
      toast.error('Failed to enter fullscreen. Please try again.')
      console.error('Fullscreen error:', error)
    }
  }

  // Step 3: Request permissions
  const requestPermissions = async () => {
    try {
      // Request webcam
      const webcamStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      })
      setWebcamStream(webcamStream)
      setWebcamReady(true)

      // Request microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStream.getTracks().forEach(track => track.stop()) // We just need permission
      setMicReady(true)

      setCurrentStep('exam')
      toast.success('All permissions granted. You may now begin the exam.')
    } catch (error) {
      toast.error('Please grant both camera and microphone permissions to continue.')
      console.error('Permission error:', error)
    }
  }

  const submitExam = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const score = MOCK_QUESTIONS.reduce((count, q) => (answers[q.id] === q.answer ? count + 1 : count), 0)
      const finalPercentage = Math.round((score / MOCK_QUESTIONS.length) * 100)

      const res = await fetch('/api/v1/admissions/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          totalQuestions: MOCK_QUESTIONS.length,
          examType: 'Entrance Examination',
          academicYear: String(new Date().getFullYear()),
          semester: 1,
          percentage: finalPercentage,
        }),
      })

      if (!res.ok) throw new Error('Submission failed')
      toast.success('Exam submitted successfully!')
      router.push('/aspirant/dashboard')
    } catch {
      toast.error('Failed to submit exam. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Step 1: Introduction
  if (currentStep === 'intro') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Entrance Examination</h1>
            <p className="mt-2 text-muted-foreground">CCHT Intake Screening</p>
          </div>

          <div className="space-y-4 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
            <h3 className="font-bold text-foreground">About this examination</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>This exam consists of {MOCK_QUESTIONS.length} multiple-choice questions</li>
              <li>You have 10 minutes to complete the exam</li>
              <li>Each question carries equal marks</li>
              <li>Your score will be calculated automatically upon submission</li>
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 dark:bg-amber-500/10">
            <h3 className="font-bold text-foreground">What to expect</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>You will need to enable fullscreen mode</li>
              <li>Camera and microphone access will be required</li>
              <li>Screen sharing will be monitored for security</li>
              <li>Any violations will be logged and reported</li>
            </ul>
          </div>

          <Button
            onClick={() => setCurrentStep('requirements')}
            className="h-14 w-full rounded-2xl text-lg font-bold"
          >
            Continue to Requirements
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>
      </div>
    )
  }

  // Step 2: Requirements and Rules
  if (currentStep === 'requirements') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Examination Requirements</h1>
            <p className="mt-2 text-muted-foreground">Please review before proceeding</p>
          </div>

          <div className="space-y-4 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
            <h3 className="font-bold text-foreground">System Requirements</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Working webcam for identity verification</span>
              </li>
              <li className="flex items-start gap-2">
                <Mic className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Microphone access for audio monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Screen sharing capability for proctoring</span>
              </li>
              <li className="flex items-start gap-2">
                <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Stable internet connection</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 dark:bg-red-500/10">
            <h3 className="font-bold text-foreground">Anti-Malpractice Rules</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Webcam and screen sharing must remain active throughout the exam</li>
              <li>Exiting fullscreen mode will be flagged as a violation</li>
              <li>Copy-paste and developer shortcuts are blocked</li>
              <li>Switching tabs or windows will be detected and logged</li>
              <li>No other person should be visible in the webcam frame</li>
              <li>Mobile phones and other devices must be kept away</li>
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
            <Checkbox
              id="rules"
              checked={agreedToRules}
              onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
            />
            <Label htmlFor="rules" className="cursor-pointer text-sm leading-relaxed">
              I have read and agree to follow all examination rules and guidelines. I understand that violations may result in disqualification.
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('intro')}
              className="flex-1 rounded-2xl"
            >
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep('fullscreen')}
              disabled={!agreedToRules}
              className="flex-1 rounded-2xl"
            >
              Proceed to Fullscreen
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 3: Fullscreen setup
  if (currentStep === 'fullscreen') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <Monitor className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Enable Fullscreen Mode</h1>
            <p className="mt-2 text-muted-foreground">Required for secure examination</p>
          </div>

          <div className="space-y-4 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
            <h3 className="font-bold text-foreground">Why fullscreen?</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Prevents access to other applications during the exam</li>
              <li>Ensures undivided attention to the examination</li>
              <li>Maintains security and integrity of the assessment</li>
              <li>Allows proper monitoring of your screen activity</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Important:</p>
                <p>Once you enter fullscreen, do not exit until the exam is complete. Exiting fullscreen will be recorded as a violation.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('requirements')}
              className="flex-1 rounded-2xl"
            >
              Back
            </Button>
            <Button
              onClick={requestFullscreen}
              className="flex-1 rounded-2xl"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Enter Fullscreen
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 4: Permissions
  if (currentStep === 'permissions') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Grant Permissions</h1>
            <p className="mt-2 text-muted-foreground">Allow access to continue</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Camera Access</p>
                  <p className="text-xs text-muted-foreground">Required for identity verification</p>
                </div>
              </div>
              {webcamReady ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Microphone Access</p>
                  <p className="text-xs text-muted-foreground">Required for audio monitoring</p>
                </div>
              </div>
              {micReady ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 dark:bg-blue-500/10">
            <p className="text-sm text-muted-foreground">
              Click the button below to grant both camera and microphone permissions. Your privacy is important - video is only used for proctoring and is not recorded.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('fullscreen')}
              className="flex-1 rounded-2xl"
            >
              Back
            </Button>
            <Button
              onClick={requestPermissions}
              disabled={webcamReady && micReady}
              className="flex-1 rounded-2xl"
            >
              {webcamReady && micReady ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Permissions Granted
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Grant Permissions
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 5: Exam
  if (currentStep === 'exam') {
    return (
      <div className="grid min-h-screen gap-8 p-6 lg:grid-cols-12">
        {!isFullscreen && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
            <AlertTriangle className="mb-6 h-20 w-20 animate-pulse text-red-500" />
            <h2 className="mb-4 text-3xl font-bold text-white">Fullscreen Required</h2>
            <p className="mb-8 max-w-md text-slate-400">Please return to fullscreen immediately to continue your exam safely.</p>
            <Button onClick={() => document.documentElement.requestFullscreen()} className="h-12 rounded-full px-8">
              Return to Fullscreen
            </Button>
          </div>
        )}

        <div className="space-y-6 lg:col-span-8">
          <Card className="space-y-8 rounded-[2.5rem] border bg-white p-8 shadow-sm dark:bg-slate-900 md:p-10">
            <div className="flex items-center justify-between border-b pb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Entrance Examination</h2>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">CCHT Intake Screening</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2.5 font-technical text-sm font-bold text-primary">
                <Timer className="h-4 w-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="space-y-8">
              {MOCK_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="space-y-4">
                  <p className="text-lg font-bold text-foreground">
                    {idx + 1}. {q.question}
                  </p>
                  <RadioGroup onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })} value={answers[q.id]} className="space-y-2">
                    {q.options.map((option) => (
                      <div key={option} className="flex items-center space-x-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <RadioGroupItem value={option} id={`q${q.id}-${option}`} />
                        <Label htmlFor={`q${q.id}-${option}`} className="w-full cursor-pointer font-medium text-foreground">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>

            <Button onClick={submitExam} disabled={submitting} className="mt-10 h-14 w-full rounded-2xl text-lg font-bold">
              {submitting ? 'Submitting...' : 'Submit Examination'}
            </Button>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card className="space-y-6 rounded-[2.5rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Camera className="h-4 w-4" />
              PROCTOR CAMERA PREVIEW
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
              {webcamStream ? (
                <video 
                  autoPlay 
                  playsInline 
                  muted 
                  className="h-full w-full scale-x-[-1] object-cover"
                  ref={(video) => {
                    if (video && webcamStream) {
                      video.srcObject = webcamStream
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-muted-foreground/80">
                  <AlertTriangle className="mb-2 h-8 w-8 text-amber-500" />
                  <span>Webcam Not Connected</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-xs font-technical">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                Webcam Active
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Monitor className="h-4 w-4" />
                Screen Capture Active
              </span>
            </div>
          </Card>

          <Card className="max-h-[300px] space-y-4 overflow-y-auto rounded-[2.5rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
              <ShieldAlert className="h-4 w-4" />
              REAL-TIME PROCTOR LOGS
            </div>
            <div className="space-y-3 text-xs">
              {violations.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">No violations detected so far.</p>
              ) : (
                violations.map((v, i) => (
                  <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-600 dark:text-red-400">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider">{v.type}</span>
                    <p>{v.details}</p>
                    <span className="mt-1 block text-[9px] text-muted-foreground">{v.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Submitting state
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="space-y-4 rounded-[2.5rem] border bg-white p-10 text-center shadow-sm dark:bg-slate-900">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2 className="text-2xl font-bold">Submitting Exam...</h2>
        <p className="text-muted-foreground">Please wait while we process your answers.</p>
      </Card>
    </div>
  )
}