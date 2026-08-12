'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  ShieldAlert, 
  AlertTriangle, 
  Monitor, 
  Camera, 
  Timer, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Lock,
  Clock3,
  Play,
  X,
  Mic,
  MonitorSmartphone
} from 'lucide-react'
import { uploadFileToCloudinary } from '@/lib/cloudinary'
import { getNigerianTime } from '@/lib/timezone'

type Question = {
  id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  marks: number
  question_number: number
  explanation?: string
}

type ExamSession = {
  id: string
  exam_title: string
  exam_description: string
  exam_type: string
  duration_minutes: number
  total_marks: number
  passing_marks: number
  instructions: string
  start_date: string
  end_date: string
  course: {
    code: string
    title: string
  } | null
  proctoring_enabled: boolean
}

type ExamStep = 'intro' | 'requirements' | 'permissions' | 'screenrecord' | 'fullscreen' | 'exam' | 'submitting' | 'completed'

export default function StudentExamTakePage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  
  const [currentStep, setCurrentStep] = useState<ExamStep>('intro')
  const [exam, setExam] = useState<ExamSession | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [examAttemptId, setExamAttemptId] = useState<string | null>(null)
  const [violations, setViolations] = useState<Array<{type: string, details: string, timestamp: Date}>>([])
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [agreedToRules, setAgreedToRules] = useState(false)
  const [examResult, setExamResult] = useState<any>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [webcamReady, setWebcamReady] = useState(false)
  const [micReady, setMicReady] = useState(false)
  const [screenReady, setScreenReady] = useState(false)
  const [recordingStarted, setRecordingStarted] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
  const [webcamRecordingUrl, setWebcamRecordingUrl] = useState<string | null>(null)
  const [screenRecordingUrl, setScreenRecordingUrl] = useState<string | null>(null)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const screenRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const screenChunksRef = useRef<Blob[]>([])
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const webcamUploadPromiseRef = useRef<Promise<string | null> | null>(null)
  const screenUploadPromiseRef = useRef<Promise<string | null> | null>(null)

  // Helper functions
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60)
    const seconds = secs % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Generate device fingerprint for proctoring
  const generateDeviceFingerprint = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
    }
  }

  const logViolation = async (violationType: string, severity: string = 'warning', details?: string, screenshotUrl?: string) => {
    if (!examAttemptId) return

    try {
      const deviceFingerprint = JSON.stringify(generateDeviceFingerprint())

      const res = await fetch('/api/v1/student/exams/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examAttemptId,
          violationType,
          severity,
          details,
          screenshotUrl,
          deviceFingerprint,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        console.error('Violation API error:', errData)
        return
      }

      setViolations(prev => [...prev, {
        type: violationType,
        details: details || violationType,
        timestamp: getNigerianTime(),
      }])
    } catch (error) {
      console.error('Failed to log violation:', error)
    }
  }

  const mobileMode = isMobileDevice
  const cameraConstraints: MediaTrackConstraints = mobileMode
    ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: 'user' } }
    : { width: 640, height: 480, facingMode: 'user' }

  useEffect(() => {
    const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    setIsMobileDevice(mobile)
  }, [])

  // Attach webcam stream to video element reliably (like aspirant exam page)
  useEffect(() => {
    if (currentStep === 'exam' && webcamStream && videoRef.current) {
      const video = videoRef.current
      if (!video.srcObject) {
        video.srcObject = webcamStream
      }
      if (video.paused) {
        video.play().catch(err => console.error('Video play error:', err))
      }
    }
  }, [currentStep, webcamStream])

  // Attach screen stream to video element reliably
  useEffect(() => {
    if (currentStep === 'exam' && screenStream && screenVideoRef.current) {
      const video = screenVideoRef.current
      if (!video.srcObject) {
        video.srcObject = screenStream
      }
      if (video.paused) {
        video.play().catch(err => console.error('Screen video play error:', err))
      }
    }
  }, [currentStep, screenStream])

  // Load exam data
  useEffect(() => {
    const loadExam = async () => {
      try {
        const [examRes, questionsRes, profileRes] = await Promise.all([
          fetch(`/api/v1/student/exams/${examId}/take`),
          fetch(`/api/v1/student/exams/${examId}/questions`),
          fetch('/api/v1/student/profile'),
        ])

        if (!examRes.ok || !questionsRes.ok) {
          throw new Error('Failed to load exam')
        }

        const examData = await examRes.json()
        const questionsData = await questionsRes.json()
        const profileData = await profileRes.json()

        // Check exam eligibility before allowing exam access
        if (examData.data?.session_id) {
          const eligibilityRes = await fetch(`/api/v1/student/exam-eligibility?sessionId=${examData.data.session_id}&courseId=${examData.data.course_id}`)
          const eligibilityData = await eligibilityRes.json()
          
          if (eligibilityRes.ok && !eligibilityData.data?.is_eligible) {
            toast.error(eligibilityData.data?.message || 'You are not eligible to take this exam')
            router.push('/student/exams')
            return
          }
        }

        setExam(examData.data)
        setQuestions(questionsData.data || [])
        setTimeLeft((examData.data.duration_minutes || 60) * 60)

        // Get enrollment ID from profile
        if (profileData.data?.profile_id) {
          const enrollRes = await fetch(`/api/v1/student/enrollments?courseId=${examData.data.course_id}`)
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json()
            if (enrollData.data?.id) {
              setEnrollmentId(enrollData.data.id)
            }
          }
        }

        // Initialize answers
        const initialAnswers: Record<string, string> = {}
        questionsData.data?.forEach((q: Question) => {
          initialAnswers[q.id] = ''
        })
        setAnswers(initialAnswers)
      } catch (error) {
        toast.error('Failed to load exam')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    if (examId) {
      loadExam()
    }
  }, [examId])

  // Create exam attempt
  const createExamAttempt = async () => {
    try {
      const res = await fetch('/api/v1/student/exams/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSessionId: examId,
          enrollmentId: enrollmentId,
        }),
      })

      if (!res.ok) throw new Error('Failed to create exam attempt')

      const data = await res.json()
      setExamAttemptId(data.data.id)
      return data.data.id
    } catch (error) {
      toast.error('Failed to start exam')
      console.error(error)
      return null
    }
  }

  // Update time spent every minute
  const startTimeUpdateInterval = (attemptId: string) => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
    }

    timeUpdateIntervalRef.current = setInterval(async () => {
      setTimeSpentSeconds(prev => {
        const newTime = prev + 60
        fetch('/api/v1/student/exams/attempts/time', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examAttemptId: attemptId,
            timeSpentSeconds: newTime,
          }),
        }).catch(err => console.error('Failed to update time:', err))
        
        return newTime
      })
    }, 60000)
  }

  // Request permissions (camera + microphone)
  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: cameraConstraints,
        audio: true,
      })
      
      setWebcamStream(mediaStream)
      setWebcamReady(true)
      setMicReady(true)

      toast.success('Camera and microphone permissions granted')
      setCurrentStep(mobileMode ? 'exam' : 'screenrecord')
    } catch (error) {
      toast.error('Please grant camera and microphone permissions to continue.')
      console.error('Permission error:', error)
    }
  }

  // Request screen recording permission - save stream for later use
  const requestScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: false
      })
      
      setScreenStream(stream)
      setScreenReady(true)
      
      // Show screen preview 
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream
        screenVideoRef.current.play().catch(err => console.error('Screen video play error:', err))
      }
      
      toast.success('Screen recording permission granted')
      setCurrentStep('fullscreen')
    } catch (error) {
      toast.error('Please grant screen recording permission to continue.')
      console.error('Screen permission error:', error)
    }
  }

  // Start screen recording - use existing stream if available
  const startScreenRecording = async () => {
    try {
      const stream = screenStream || await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: false
      })
      
      if (!screenStream) {
        setScreenStream(stream)
      }
      
      if (screenVideoRef.current && stream) {
        screenVideoRef.current.srcObject = stream
        screenVideoRef.current.play().catch(err => console.error('Screen video play error:', err))
      }
      
      setScreenReady(true)

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      screenRecorderRef.current = mediaRecorder
      screenChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          screenChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const screenBlob = new Blob(screenChunksRef.current, { type: 'video/webm' })
        const promise = uploadRecordingToCloudinary(screenBlob, 'screen', recordingStartTime)
        screenUploadPromiseRef.current = promise
        const url = await promise
        if (url) {
          setScreenRecordingUrl(url)
        }
      }

      mediaRecorder.start()
      return true
    } catch (error) {
      console.error('Screen recording error:', error)
      toast.error('Failed to start screen recording')
      return false
    }
  }

  // Start webcam recording
  const startWebcamRecording = async () => {
    if (!webcamStream) return false

    try {
      const mediaRecorder = new MediaRecorder(webcamStream, { mimeType: 'video/webm' })
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const webcamBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const promise = uploadRecordingToCloudinary(webcamBlob, 'webcam', recordingStartTime)
        webcamUploadPromiseRef.current = promise
        const url = await promise
        if (url) {
          setWebcamRecordingUrl(url)
        }
      }

      mediaRecorder.start()
      setRecordingStartTime(getNigerianTime())
      setRecordingStarted(true)
      return true
    } catch (error) {
      console.error('Webcam recording error:', error)
      return false
    }
  }

  // Upload recording to Cloudinary
  const uploadRecordingToCloudinary = async (blob: Blob, type: 'webcam' | 'screen', startedAt: Date | null): Promise<string | null> => {
    if (!examAttemptId) return null

    try {
      const file = new File([blob], `${type}-${examAttemptId}-${Date.now()}.webm`, { type: 'video/webm' })
      
      toast.info(`Uploading ${type} recording...`)
      
      const result = await uploadFileToCloudinary(file, {
        folder: `exam-recordings/${examAttemptId}`,
        resourceType: 'auto'
      })

      // Calculate duration if start time is available
      const durationSeconds = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0

      // Gather device metadata
      const metadata = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        recordingType: type,
      }

      const res = await fetch('/api/v1/student/exams/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examAttemptId,
          recordingType: type,
          storageUrl: result.secure_url,
          durationSeconds,
          fileSizeBytes: blob.size,
          mimeType: 'video/webm',
          startedAt: startedAt?.toISOString(),
          status: 'completed',
          metadata,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        console.error('Failed to save recording:', errData)
        return null
      } else {
        console.log(`${type} recording uploaded:`, result.secure_url)
        return result.secure_url
      }
    } catch (error) {
      console.error(`Failed to upload ${type} recording:`, error)
      toast.error(`Failed to upload ${type} recording`)
      return null
    }
  }

  // Request fullscreen
  const requestFullscreen = async () => {
    try {
      const attemptId = await createExamAttempt()
      if (!attemptId) {
        toast.error('Failed to create exam attempt. Please try again.')
        return
      }

      startTimeUpdateInterval(attemptId)

      const elem = document.documentElement
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
        setIsFullscreen(true)
        
        const screenStarted = await startScreenRecording()
        if (screenStarted) {
          toast.success('Fullscreen mode enabled')
          setCurrentStep('exam')
          
          // Start webcam recording when exam starts
          setTimeout(() => {
            startWebcamRecording()
          }, 1000)
        }
      }
    } catch (error) {
      toast.error('Failed to enter fullscreen. Please try again.')
      console.error('Fullscreen error:', error)
    }
  }

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

  useEffect(() => {
    if (currentStep !== 'exam' || examAttemptId || loading || !exam) return

    createExamAttempt().then((attemptId) => {
      if (attemptId) {
        startTimeUpdateInterval(attemptId)
      }
    })
  }, [currentStep, examAttemptId, loading, exam])

  useEffect(() => {
    if (currentStep === 'exam' && webcamStream && !recordingStarted) {
      startWebcamRecording()
    }
  }, [currentStep, webcamStream, recordingStarted])

  const handleTimeOut = async () => {
    toast.error('Time is up! Submitting your exam automatically.')
    await submitExam()
  }

  // Proctoring: Tab switch detection
  useEffect(() => {
    if (currentStep !== 'exam') return

    const handleTabSwitch = () => {
      if (document.hidden) {
        logViolation('tab_switch', 'severe', 'User switched to another tab')
      }
    }

    document.addEventListener('visibilitychange', handleTabSwitch)
    return () => document.removeEventListener('visibilitychange', handleTabSwitch)
  }, [currentStep, examAttemptId])

  // Proctoring: Fullscreen exit detection
  useEffect(() => {
    if (currentStep !== 'exam') return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        logViolation('visibility_change', 'critical', 'User exited fullscreen mode')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [currentStep, isFullscreen, examAttemptId])

  // Proctoring: Copy-paste, keyboard shortcuts, right-click, devtools, and screenshot blocking
  useEffect(() => {
    if (currentStep !== 'exam') return

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      logViolation('copy_paste', 'warning', 'Attempted to copy or paste content')
    }

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      logViolation('right_click', 'info', 'Attempted to right-click')
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault()
        e.stopPropagation()
        logViolation('devtools_open', 'severe', 'Attempted to open developer tools')
        return
      }

      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault()
        e.stopPropagation()
        logViolation('other', 'severe', 'Attempted to take screenshot (Print Screen)')
        return
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        e.stopPropagation()
        logViolation('other', 'severe', 'Attempted to use screen snipping tool')
        return
      }

      if (
        (e.ctrlKey && ['c', 'x', 'v', 'a', 's', 'p'].includes(e.key.toLowerCase())) ||
        (e.metaKey && ['c', 'x', 'v', 'a', 's', 'p'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault()
        e.stopPropagation()
        if (['c', 'x', 'v'].includes(e.key.toLowerCase())) {
          logViolation('copy_paste', 'warning', `Attempted to use Ctrl+${e.key.toUpperCase()} shortcut`)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const style = document.createElement('style')
    style.id = 'exam-no-select'
    style.textContent = `
      body, body * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      input, textarea, [contenteditable] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      .mirror {
        transform: scaleX(-1);
      }
    `
    document.head.appendChild(style)

    document.addEventListener('copy', handleCopyPaste, true)
    document.addEventListener('paste', handleCopyPaste, true)
    document.addEventListener('cut', handleCopyPaste, true)
    document.addEventListener('contextmenu', handleRightClick, true)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)

    return () => {
      document.removeEventListener('copy', handleCopyPaste, true)
      document.removeEventListener('paste', handleCopyPaste, true)
      document.removeEventListener('cut', handleCopyPaste, true)
      document.removeEventListener('contextmenu', handleRightClick, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
      const styleEl = document.getElementById('exam-no-select')
      if (styleEl) styleEl.remove()
    }
  }, [currentStep, examAttemptId])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
      }
    }
  }, [])

  // Stop recordings and wait for them to upload before submission
  const stopAndUploadRecordings = async (): Promise<{ webcamUrl: string | null, screenUrl: string | null }> => {
    const results: { webcamUrl: string | null, screenUrl: string | null } = { webcamUrl: null, screenUrl: null }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.stop()
    }

    const uploads = [webcamUploadPromiseRef.current, screenUploadPromiseRef.current].filter(Boolean) as Promise<string | null>[]
    const resolved = await Promise.allSettled(uploads)

    if (resolved[0]?.status === 'fulfilled') results.webcamUrl = resolved[0].value || null
    if (resolved[1]?.status === 'fulfilled') results.screenUrl = resolved[1].value || null

    return results
  }

  // Submit exam
  const submitExam = async () => {
    if (submitting) return
    setSubmitting(true)
    setCurrentStep('submitting')

    try {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
        timeUpdateIntervalRef.current = null
      }

      // Stop recordings and wait for uploads to complete first
      const recordingUrls = await stopAndUploadRecordings()
      
      console.log('[Exam Submission] Recording URLs:', recordingUrls)

      // Then submit the exam answers with recording URLs
      const res = await fetch('/api/v1/student/exams/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examAttemptId,
          answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
            questionId,
            selectedAnswer,
          })),
          timeSpentSeconds,
          submittedAt: getNigerianTime().toISOString(),
          webcamRecordingUrl: recordingUrls.webcamUrl,
          screenRecordingUrl: recordingUrls.screenUrl,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit exam')

      toast.success('Exam submitted successfully!')
      setCurrentStep('completed')
      
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }

      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop())
      }

      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }


    } catch (error) {
      toast.error('Failed to submit exam. Please try again.')
      console.error(error)
      setCurrentStep('exam') // Go back to exam step on error
    } finally {
      setSubmitting(false)
    }
  }

  // Handle answer change
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading exam...</div>
      </div>
    )
  }

  // Step 1: Introduction
  if (currentStep === 'intro') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">{exam?.exam_title || 'Examination'}</h1>
            <p className="mt-2 text-muted-foreground">{exam?.course?.code} - {exam?.course?.title}</p>
          </div>

          <div className="space-y-4 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
            <h3 className="font-bold text-foreground">About this examination</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>This exam consists of {questions.length} questions</li>
              <li>You have {exam?.duration_minutes} minutes to complete the exam</li>
              <li>Total marks: {exam?.total_marks} | Passing marks: {exam?.passing_marks}</li>
              <li>Your score will be calculated automatically upon submission</li>
            </ul>
          </div>

          {exam?.instructions && (
            <div className="space-y-4 rounded-2xl border border-border bg-slate-50 p-6 dark:bg-slate-800/50">
              <h3 className="font-bold text-foreground">Instructions</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.instructions}</p>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Important Rules</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Do not switch tabs or windows during the exam</li>
                  <li>Do not exit fullscreen mode</li>
                  <li>Do not use copy/paste functions</li>
                  <li>Do not open developer tools</li>
                  <li>Ensure you are alone in a well-lit room</li>
                  <li>Keep your face visible in the webcam at all times</li>
                  <li>Your screen and webcam will be recorded for proctoring</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
            <Checkbox
              id="rules"
              checked={agreedToRules}
              onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
            />
            <Label htmlFor="rules" className="text-sm leading-relaxed">
              I have read and agree to follow all exam rules and understand that violations may result in automatic submission.
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={() => setCurrentStep('requirements')}
              disabled={!agreedToRules}
              className="flex-1 rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 2: Requirements check
  if (currentStep === 'requirements') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <Monitor className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">System Requirements</h1>
            <p className="mt-2 text-muted-foreground">Please ensure you have the following ready</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <Camera className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Webcam</p>
                <p className="text-sm text-muted-foreground">Required for identity verification and proctoring</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <Mic className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Microphone</p>
                <p className="text-sm text-muted-foreground">Required for audio monitoring during the exam</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <MonitorSmartphone className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Screen Recording</p>
                <p className="text-sm text-muted-foreground">Your screen will be recorded during the exam</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Fullscreen Mode</p>
                <p className="text-sm text-muted-foreground">Exam must be taken in fullscreen mode</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <Timer className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Stable Internet Connection</p>
                <p className="text-sm text-muted-foreground">Ensure you have a reliable internet connection</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setCurrentStep('intro')}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep('permissions')}
              className="flex-1 rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
            >
              <Play className="mr-2 h-4 w-4" />
              Continue to Permissions
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 3: Permissions (Camera + Microphone)
  if (currentStep === 'permissions') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <Camera className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Camera & Microphone Permissions</h1>
            <p className="mt-2 text-muted-foreground">Please grant camera and microphone access for proctoring</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-slate-50 p-6 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Camera Access</p>
                  <p className="mt-1">Your webcam will be used to monitor your exam session. Please ensure you are in a well-lit room and your face is clearly visible.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-slate-50 p-6 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <Mic className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Microphone Access</p>
                  <p className="mt-1">Your microphone will be monitored during the exam to ensure exam integrity.</p>
                </div>
              </div>
            </div>
          </div>

          {(webcamReady || micReady) && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 dark:bg-green-500/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  Permissions granted: Camera {webcamReady ? '✓' : ''} {micReady ? 'Microphone ✓' : ''}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setCurrentStep('requirements')}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Back
            </Button>
            <Button
              onClick={requestPermissions}
              className="flex-1 rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
            >
              <Camera className="mr-2 h-4 w-4" />
              Grant Permissions
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 4: Screen Recording Permission
  if (currentStep === 'screenrecord') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <MonitorSmartphone className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Screen Recording Permission</h1>
            <p className="mt-2 text-muted-foreground">Please grant screen recording permission for proctoring</p>
          </div>

          <div className="rounded-2xl border border-border bg-slate-50 p-6 dark:bg-slate-800/50">
            <div className="flex items-start gap-3">
              <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Screen Recording</p>
                <p className="mt-1">Your screen will be recorded throughout the exam to ensure exam integrity. When you click the button below, you will be prompted to select which screen or window to share.
                  Kindly choose to share your full screen.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/images/fullscreen.png"
              alt="Grant Fullscreen Permission Guide"
              width={500}
              height={350}
              className="rounded-lg shadow-md border border-border"
            />
          </div>

          {screenReady && screenStream && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 dark:bg-green-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-700">Screen recording permission granted ✓</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Screen Preview</p>
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-slate-900"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setCurrentStep('permissions')}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Back
            </Button>
            <Button
              onClick={requestScreenRecording}
              className="flex-1 rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
            >
              <MonitorSmartphone className="mr-2 h-4 w-4" />
              Grant Screen Recording
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 5: Fullscreen mode
  if (currentStep === 'fullscreen') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <Monitor className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Enter Fullscreen Mode</h1>
            <p className="mt-2 text-muted-foreground">Click the button below to enter fullscreen mode and start the exam</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Important</p>
                <p className="mt-1">You must remain in fullscreen mode throughout the exam. Exiting fullscreen will be logged as a violation. Your screen and webcam will be recorded.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={requestFullscreen}
            className="w-full rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Enter Fullscreen & Start Exam
          </Button>
        </Card>
      </div>
    )
  }

  // Step 6: Exam in progress
  if (currentStep === 'exam') {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header with timer and progress */}
        <div className="sticky top-0 z-50 border-b bg-white dark:bg-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{exam?.exam_title}</h2>
                <p className="text-xs text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 dark:bg-red-900/20">
                  <Timer className="h-5 w-5 text-red-600" />
                  <span className="font-mono text-lg font-bold text-red-600">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Question area */}
            <div className="lg:col-span-2">
              <Card className="rounded-2xl border bg-white p-8 dark:bg-slate-800">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-semibold text-primary">
                        Q{currentQuestion?.question_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({currentQuestion?.marks} marks)
                      </span>
                    </div>
                    <p className="text-lg leading-relaxed">{currentQuestion?.question_text}</p>
                  </div>

                  {currentQuestion?.question_type === 'multiple_choice' && (
                    <RadioGroup
                      value={answers[currentQuestion?.id] || ''}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      {currentQuestion?.options?.map((option, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-4 hover:bg-slate-100 dark:bg-slate-700/50"
                        >
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label
                            htmlFor={`option-${idx}`}
                            className="flex-1 cursor-pointer text-sm leading-relaxed"
                          >
                            {String.fromCharCode(65 + idx)}. {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion?.question_type === 'true_false' && (
                    <RadioGroup
                      value={answers[currentQuestion?.id] || ''}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-4 hover:bg-slate-100 dark:bg-slate-700/50">
                        <RadioGroupItem value="true" id="true" />
                        <Label htmlFor="true" className="flex-1 cursor-pointer text-sm">
                          True
                        </Label>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-4 hover:bg-slate-100 dark:bg-slate-700/50">
                        <RadioGroupItem value="false" id="false" />
                        <Label htmlFor="false" className="flex-1 cursor-pointer text-sm">
                          False
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  {currentQuestion?.question_type === 'short_answer' && (
                    <Textarea
                      value={answers[currentQuestion?.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Enter your answer..."
                      rows={6}
                      className="rounded-xl"
                    />
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Previous
                    </Button>

                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={submitExam}
                        disabled={submitting}
                        className="rounded-xl bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? 'Submitting...' : 'Submit Exam'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar - camera view */}
            <div className="space-y-4">
              {/* User's face camera */}
              <Card className="rounded-2xl border bg-white p-4 dark:bg-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Camera</p>
                  {recordingStarted && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  )}
                </div>
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-xl bg-slate-900 mirror"
                  />
                </div>
              </Card>

              {/* Question navigator */}
              <Card className="rounded-2xl border bg-white p-4 dark:bg-slate-800">
                <p className="text-sm font-semibold mb-3">Question Navigator</p>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => (
                    <Button
                      key={q.id}
                      size="sm"
                      variant={idx === currentQuestionIndex ? 'default' : 'outline'}
                      className={`h-10 w-full rounded-lg text-xs ${
                        answers[q.id] ? 'bg-green-100 border-green-500 text-green-700' : ''
                      }`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Violations warning */}
              {violations.length > 0 && (
                <Card className="rounded-2xl border border-red-500/20 bg-red-50 p-4 dark:bg-red-900/10">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        {violations.length} Violation{violations.length > 1 ? 's' : ''} Detected
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Excessive violations may result in auto-submission
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 7: Submitting
  if (currentStep === 'submitting') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-lg font-semibold">Submitting your exam...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // Step 8: Completed - NO score or result shown to student
  if (currentStep === 'completed') {
    useEffect(() => {
      const timer = setTimeout(() => {
        router.push('/student/exams')
      }, 3000)
      return () => clearTimeout(timer)
    }, [router])

    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold">Exam Submitted Successfully</h1>
            <p className="mt-2 text-muted-foreground">
              Your responses have been recorded. Thank you for completing the examination.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 dark:bg-blue-500/10">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Results Pending</p>
                <p className="mt-1">Your results will be reviewed and released by your instructors. You will be notified once your results are available. Please check back later.</p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Redirecting to exams list in 3 seconds...</p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/student/exams')}
              className="rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
            >
              Return to Exams
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
