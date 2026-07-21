'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldAlert, AlertTriangle, Monitor, Camera, Timer, ShieldCheck, CheckCircle2, ChevronRight, Volume2, Mic, Lock, Award, Clock3 } from 'lucide-react'
import { toast } from 'sonner'
import { StageGateCard } from '@/components/aspirant/stage-gate'
import Link from 'next/link'
import { FileUp, CreditCard } from 'lucide-react'
import { uploadFileToCloudinary, getCloudinaryConfig } from '@/lib/cloudinary'

type Question = {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  points: number
  question_order: number
}

type ExamConfig = {
  id: string
  exam_name: string
  exam_description: string
  duration_minutes: number
  total_questions: number
  passing_score: number
  instructions: string
  is_active: boolean
}

type ExamStep = 'intro' | 'requirements' | 'screen-recording' | 'fullscreen' | 'permissions' | 'exam' | 'submitting'

export default function AspirantEntranceExam() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<ExamStep>('intro')
  const [agreedToRules, setAgreedToRules] = useState(false)
  const [webcamReady, setWebcamReady] = useState(false)
  const [micReady, setMicReady] = useState(false)
  const [screenRecordingReady, setScreenRecordingReady] = useState(false)
  const [fullscreenReady, setFullscreenReady] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [violations, setViolations] = useState<Array<{type: string, details: string, timestamp: Date}>>([])
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [appFeePaid, setAppFeePaid] = useState(false)
  const [documentsUploaded, setDocumentsUploaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [examSessionId, setExamSessionId] = useState<string | null>(null)
  const [violationCount, setViolationCount] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordingUploaded, setRecordingUploaded] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [faceDetected, setFaceDetected] = useState(true)
  const [audioDetected, setAudioDetected] = useState(false)
  const [aiViolationScore, setAiViolationScore] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [hasCompletedExam, setHasCompletedExam] = useState(false)
  const [examResult, setExamResult] = useState<any>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Helper functions MUST be defined before useEffect that references them
  const handleTimeOut = useCallback(() => {
    toast.error('Time is up! Submitting your exam automatically.')
    submitExam()
  }, [])

  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`

  const logViolation = async (violationType: string, severity: string = 'medium', details?: string) => {
    if (!examSessionId) return

    try {
      const res = await fetch('/api/v1/admissions/exam-violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: examSessionId,
          violationType,
          severity,
          details,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setViolationCount(data.violationCount || 0)
        
        // Add to local violations list for display
        setViolations(prev => [...prev, {
          type: violationType,
          details: details || violationType,
          timestamp: new Date(),
        }])
        
        // Auto-submit if max violations reached
        if (data.maxViolationsReached) {
          toast.error('Maximum violations reached. Submitting exam automatically.')
          setTimeout(() => submitExam(), 2000)
        }
      }
    } catch (error) {
      console.error('Failed to log violation:', error)
    }
  }

  const startScreenRecording = async () => {
    // Don't start if already recording
    if (mediaRecorder) {
      console.log('Screen recording already active')
      return
    }

    try {
      // Capture the screen
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
        audio: false,
      })

      // Store the stream for later cleanup
      setScreenStream(stream)

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setRecordedChunks(chunks)

        // Calculate recording duration
        const endTime = new Date()
        const durationSeconds = recordingStartTime 
          ? Math.round((endTime.getTime() - recordingStartTime.getTime()) / 1000)
          : 0

        console.log(`[exam] Recording duration: ${durationSeconds} seconds`)
        console.log(`[exam] Recording start time: ${recordingStartTime?.toISOString()}`)
        console.log(`[exam] Recording end time: ${endTime.toISOString()}`)

        // Upload recording to Cloudinary via API route (optional - gracefully handle errors)
        try {
          // Use the stored session ID for upload - check multiple sources
          const sessionIdForUpload = (recorder as any).sessionId || pendingSessionId || examSessionId
          if (!sessionIdForUpload) {
            console.error('No exam session ID available, skipping recording upload')
            return
          }

          console.log('[exam] Uploading recording with session ID:', sessionIdForUpload)

          const formData = new FormData()
          const file = new File([blob], `exam-recording-${Date.now()}.webm`, { type: 'video/webm' })
          formData.append('file', file)
          formData.append('sessionId', sessionIdForUpload)
          formData.append('duration', durationSeconds.toString())

          const response = await fetch('/api/v1/admissions/screen-recording', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Screen recording uploaded successfully:', result)
            setRecordingUploaded(true)
          } else {
            console.error('Failed to upload recording:', await response.text())
          }
        } catch (uploadError) {
          console.error('Failed to upload recording to Cloudinary:', uploadError)
          // Continue without recording - don't block exam submission
        }

        // Stop all tracks in the screen stream
        if (stream) {
          stream.getTracks().forEach((track: any) => {
            track.stop()
            console.log('[exam] Stopped screen track:', track.kind)
          })
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordingStartTime(new Date())
      console.log('[exam] Screen recording started')
    } catch (error) {
      console.error('Failed to start screen recording:', error)
    }
  }

  const stopScreenRecording = async (sessionId?: string) => {
    console.log('[exam] stopScreenRecording called')
    
    // Stop media recorder if active
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      // Store the session ID synchronously in a ref for immediate access
      if (sessionId) {
        setPendingSessionId(sessionId)
        // Also store it directly on the mediaRecorder for immediate access
        ;(mediaRecorder as any).sessionId = sessionId
      }
      mediaRecorder.stop()
      console.log('[exam] MediaRecorder stopped')
      // Recording is saved in the onstop handler
    }
    
    // Force stop the screen stream directly to ensure browser stops recording
    if (screenStream) {
      screenStream.getTracks().forEach((track: any) => {
        track.stop()
        console.log('[exam] Force stopped screen track:', track.kind, track.readyState)
      })
      setScreenStream(null)
    }
    
    // Additional cleanup: try to stop any remaining screen sharing
    // This is a more aggressive approach to ensure screen sharing stops
    try {
      // Get all video tracks and stop them
      const allVideoTracks = screenStream?.getVideoTracks() || []
      allVideoTracks.forEach((track: any) => {
        if (track.readyState === 'live') {
          track.stop()
          console.log('[exam] Stopped live video track:', track.kind)
        }
      })
    } catch (error) {
      console.error('[exam] Error stopping video tracks:', error)
    }
  }

  const submitExam = async () => {
    if (submitting) return
    setSubmitting(true)
    
    console.log('[exam] Starting exam submission')
    
    // Ensure exam session exists before stopping recording
    let currentSessionId = examSessionId
    if (!currentSessionId) {
      try {
        console.log('[exam] Creating exam session')
        const sessionRes = await fetch('/api/v1/admissions/exam-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examType: 'Entrance Examination',
            academicYear: String(new Date().getFullYear()),
            examConfigId: examConfig?.id,
          }),
        })
        const sessionData = await sessionRes.json()
        if (sessionData.data?.id) {
          currentSessionId = sessionData.data.id
          setExamSessionId(currentSessionId)
          setPendingSessionId(currentSessionId) // Set for recording upload
          console.log('[exam] Exam session created:', currentSessionId)
        }
      } catch (err) {
        console.error('Failed to create exam session:', err)
      }
    } else {
      // Use existing session ID for recording
      setPendingSessionId(currentSessionId)
      console.log('[exam] Using existing exam session:', currentSessionId)
    }
    
    // Stop recording before submission and wait for upload
    console.log('[exam] Stopping screen recording with session ID:', currentSessionId)
    await stopScreenRecording(currentSessionId || undefined)
    
    // Wait for recording to finish uploading (increased time)
    console.log('[exam] Waiting for recording upload...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log('[exam] Recording upload wait complete')
    
    try {
      const score = questions.reduce((count: number, q: Question) => (answers[q.id] === q.correct_answer ? count + 1 : count), 0)
      const finalPercentage = Math.round((score / questions.length) * 100)

      // Update exam session with all required fields
      if (examSessionId) {
        await fetch('/api/v1/admissions/exam-session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: examSessionId,
            score,
            totalQuestions: questions.length,
            percentage: finalPercentage,
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            examType: 'Entrance Examination',
            academicYear: String(new Date().getFullYear()),
          }),
        })
      }

      const res = await fetch('/api/v1/admissions/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          totalQuestions: questions.length,
          examType: 'Entrance Examination',
          academicYear: String(new Date().getFullYear()),
          semester: 1,
          percentage: finalPercentage,
          answers: answers, // Include the actual answers
        }),
      })

      if (!res.ok) throw new Error('Submission failed')
      toast.success('Exam submitted successfully!')
      
      // Update profile stage to admission_fee
      await fetch('/api/v1/admissions/complete-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      // Exit fullscreen mode
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        console.log('[exam] Exited fullscreen mode')
      }
      
      // Force stop screen recording and cleanup
      if (screenStream) {
        screenStream.getTracks().forEach((track: any) => {
          track.stop()
          console.log('[exam] Force stopped screen track:', track.kind)
        })
        setScreenStream(null)
      }
      
      // Clear media recorder
      setMediaRecorder(null)
      
      router.push('/aspirant/exam/thank-you')
    } catch {
      toast.error('Failed to submit exam. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Check if user has already completed exam on component mount
  useEffect(() => {
    const checkExamCompletion = async () => {
      try {
        const res = await fetch('/api/v1/admissions/exam-session/check')
        if (res.ok) {
          const data = await res.json()
          if (data.hasCompletedExam) {
            setHasCompletedExam(true)
            toast.error('You have already completed the entrance examination.')
            setTimeout(() => router.push('/aspirant/dashboard'), 2000)
          }
        }
      } catch (error) {
        console.error('Failed to check exam completion:', error)
      }
    }
    checkExamCompletion()
  }, [router])

  // Load questions from database
  const loadQuestions = async () => {
    setLoadingQuestions(true)
    try {
      const res = await fetch('/api/v1/aspirant/exams/questions')
      if (!res.ok) throw new Error('Failed to load questions')
      const data = await res.json()
      
      if (data.data) {
        setExamConfig(data.data.config)
        setQuestions(data.data.questions || [])
        
        // Initialize answers with empty strings for all questions
        const initialAnswers: Record<string, string> = {}
        data.data.questions.forEach((q: Question) => {
          initialAnswers[q.id] = ''
        })
        setAnswers(initialAnswers)
        
        // Set time based on config duration
        if (data.data.config?.duration_minutes) {
          setTimeLeft(data.data.config.duration_minutes * 60)
        }
      }
    } catch (error) {
      console.error('Failed to load questions:', error)
      toast.error('Failed to load exam questions')
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Create exam session when entering exam step
  useEffect(() => {
    if (currentStep === 'exam' && !examSessionId && examConfig) {
      fetch('/api/v1/admissions/exam-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: 'Entrance Examination',
          academicYear: String(new Date().getFullYear()),
          examConfigId: examConfig.id,
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.data?.id) {
          setExamSessionId(data.data.id)
        }
      })
      .catch(err => console.error('Failed to create exam session:', err))
    }
  }, [currentStep, examSessionId, examConfig])

  // Tab switch detection
  useEffect(() => {
    if (currentStep !== 'exam') return

    const handleTabSwitch = () => {
      if (document.hidden) {
        logViolation('tab_switch', 'high', 'User switched to another tab')
      }
    }

    document.addEventListener('visibilitychange', handleTabSwitch)
    return () => document.removeEventListener('visibilitychange', handleTabSwitch)
  }, [currentStep, examSessionId])

  // Fullscreen exit detection
  useEffect(() => {
    if (currentStep !== 'exam') return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        logViolation('fullscreen_exit', 'critical', 'User exited fullscreen mode')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [currentStep, isFullscreen, examSessionId])

  // Copy-paste blocking
  useEffect(() => {
    if (currentStep !== 'exam') return

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault()
      logViolation('copy_paste_attempt', 'medium', 'Attempted to copy or paste content')
    }

    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)
    return () => {
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
    }
  }, [currentStep, examSessionId])

  // Right-click blocking
  useEffect(() => {
    if (currentStep !== 'exam') return

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      logViolation('right_click', 'low', 'Attempted to right-click')
    }

    document.addEventListener('contextmenu', handleRightClick)
    return () => document.removeEventListener('contextmenu', handleRightClick)
  }, [currentStep, examSessionId])

  // DevTools detection (simplified to reduce false positives)
  useEffect(() => {
    if (currentStep !== 'exam') return

    let devtoolsCheckInterval: NodeJS.Timeout
    let lastOuterWidth = window.outerWidth
    let lastOuterHeight = window.outerHeight

    // Check if devtools is already open on page load (only once)
    const checkDevToolsOnLoad = () => {
      const threshold = 200 // Increased threshold to reduce false positives
      const widthDiff = window.outerWidth - window.innerWidth > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold
      
      if (widthDiff || heightDiff) {
        logViolation('devtools_already_open', 'critical', 'DevTools was already open when exam started')
      }
    }

    // Enhanced keyboard detection (most reliable method)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        e.key === 'F12' ||
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'X')) ||
        (e.ctrlKey && e.key === 'U') ||
        (e.metaKey && e.altKey && e.key === 'I') || // Mac: Cmd+Option+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I (keyCode)
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J (keyCode)
        (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C (keyCode)
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U (keyCode)
      ) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        logViolation('devtools_open', 'high', 'Attempted to open developer tools')
        return false
      }
    }

    // Simplified window resize detection - only detect significant outer window changes
    const handleResize = () => {
      const outerWidthChange = Math.abs(window.outerWidth - lastOuterWidth)
      const outerHeightChange = Math.abs(window.outerHeight - lastOuterHeight)
      
      // Only log if outer window size changes significantly (indicates devtools panel opening)
      if (outerWidthChange > 150 || outerHeightChange > 150) {
        logViolation('window_resize', 'medium', 'Significant window resize detected')
      }
      
      lastOuterWidth = window.outerWidth
      lastOuterHeight = window.outerHeight
    }

    // Run initial check once
    checkDevToolsOnLoad()

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    window.addEventListener('resize', handleResize)

    // Set up periodic checks (less frequent to reduce false positives)
    devtoolsCheckInterval = setInterval(() => {
      const threshold = 200 // Increased threshold
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      
      // Only log if the difference is very significant and consistent
      if (widthDiff > 250 || heightDiff > 250) {
        logViolation('devtools_detected', 'critical', 'DevTools detected via window size check')
      }
    }, 5000) // Check every 5 seconds instead of 2 seconds

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('resize', handleResize)
      clearInterval(devtoolsCheckInterval)
    }
  }, [currentStep, examSessionId])

  // Ensure video element is properly set up when webcam stream is available
  useEffect(() => {
    if (currentStep === 'exam' && webcamStream && videoRef.current) {
      const video = videoRef.current
      if (!video.srcObject) {
        video.srcObject = webcamStream
        video.play().catch(err => console.error('Video play error:', err))
      }
    }
  }, [currentStep, webcamStream])

  // Face detection using webcam (basic implementation)
  useEffect(() => {
    if (currentStep !== 'exam' || !webcamStream || !videoRef.current) return

    const video = videoRef.current
    if (!video.srcObject) {
      video.srcObject = webcamStream
      video.play().catch(err => console.error('Video play error:', err))
    }

    // Basic face detection using canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 640
    canvas.height = 480

    const checkFace = () => {
      if (!video || video.paused || video.ended) return
      
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        // Simple brightness check (face should be reasonably bright)
        let totalBrightness = 0
        for (let i = 0; i < imageData.data.length; i += 4) {
          totalBrightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
        }
        const avgBrightness = totalBrightness / (imageData.data.length / 4)
        
        // If too dark, might be no face or covered face
        if (avgBrightness < 30) {
          if (faceDetected) {
            setFaceDetected(false)
            logViolation('no_face_detected', 'medium', 'No face detected in webcam')
          }
        } else {
          if (!faceDetected) {
            setFaceDetected(true)
          }
        }
      } catch (error) {
        // Ignore errors from cross-origin images
      }
    }

    const interval = setInterval(checkFace, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [currentStep, webcamStream, examSessionId, faceDetected])

  // Audio monitoring for speech detection
  useEffect(() => {
    if (currentStep !== 'exam') return

    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let microphone: MediaStreamAudioSourceNode | null = null
    let animationFrame: number | null = null

    const setupAudioMonitoring = async () => {
      try {
        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        
        const checkAudio = () => {
          if (!analyser) return
          
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          
          // If audio level is high, speech might be detected
          if (average > 30) {
            setAudioDetected(true)
            // Don't log as violation - just monitoring
          } else {
            setAudioDetected(false)
          }
          
          animationFrame = requestAnimationFrame(checkAudio)
        }
        
        checkAudio()
      } catch (error) {
        console.error('Audio monitoring setup failed:', error)
      }
    }

    setupAudioMonitoring()

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      if (microphone) microphone.disconnect()
      if (audioContext) audioContext.close()
    }
  }, [currentStep, examSessionId])

  // AI-based malpractice detection using Gemini API
  useEffect(() => {
    if (currentStep !== 'exam' || !examSessionId) return

    const checkForMalpractice = async () => {
      try {
        // Capture screenshot from webcam
        const video = document.querySelector('video[autoplay]') as HTMLVideoElement
        if (!video) return

        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 480
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const screenshotBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

        // Send to Gemini API for analysis
        const response = await fetch('/api/v1/ai/analyze-exam-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: examSessionId,
            screenshot: screenshotBase64,
            activity: 'exam_in_progress',
            violations: violations.slice(-5), // Send last 5 violations for context
          }),
        })

        if (response.ok) {
          const result = await response.json()
          
          if (result.suspicious && result.confidence > 70) {
            setAiViolationScore(prev => prev + result.confidence)
            
            // Log violation based on AI detection
            const severity = result.confidence > 90 ? 'critical' : 'high'
            logViolation('suspicious_activity', severity, `${result.reason} (AI confidence: ${result.confidence}%)`)
            
            // Log individual violations if detected
            if (result.violations && Array.isArray(result.violations)) {
              result.violations.forEach((violation: string) => {
                logViolation(violation.replace(/\s+/g, '_').toLowerCase(), 'medium', `AI detected: ${violation}`)
              })
            }
          }
        }
      } catch (error) {
        console.error('AI malpractice check failed:', error)
      }
    }

    const interval = setInterval(checkForMalpractice, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [currentStep, examSessionId, logViolation, violations])

  // Timer countdown - MUST be before any conditional returns
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
  }, [currentStep, timeLeft, handleTimeOut])

  // Fullscreen change listener - MUST be before any conditional returns
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meRes, statusRes, docsRes, resultsRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/aspirant/payments/status'),
          fetch('/api/v1/admissions/documents'),
          fetch('/api/v1/admissions/results'),
        ])
        const me = await meRes.json()
        const status = await statusRes.json()
        const docs = await docsRes.json()
        const results = await resultsRes.json()
        
        if (me?.user?.id) setUserId(me.user.id)
        setAppFeePaid(status?.data?.profile?.application_fee_paid || false)
        setDocumentsUploaded((docs?.data || []).length > 0)
        
        // Check if user has already completed exam
        if (results?.data && results.data.length > 0) {
          setHasCompletedExam(true)
          setExamResult(results.data[0])
        }
        
        // Load exam questions only if not completed
        if (!results?.data || results.data.length === 0) {
          await loadQuestions()
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (hasCompletedExam) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Entrance Exam</p>
          <h1 className="mt-3 text-3xl font-extrabold">Online Screening Examination</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
            You have already completed the entrance exam. Your results are being processed and will be released soon.
          </p>
        </div>
        
        {examResult && (
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Exam Result</p>
                <h2 className="text-xl font-bold">Your Performance</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Score</p>
                <p className="mt-1 text-3xl font-black text-primary">{examResult.percentage || examResult.score || 0}%</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                <span className="text-sm text-muted-foreground">Grade</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{examResult.grade || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-600">
                  {examResult.status || 'Processing'}
                </span>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 dark:bg-blue-500/10">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">Awaiting Result Release</p>
                    <p>Your exam results are being reviewed. Once released, your admission status will be updated accordingly.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        <div className="flex justify-center">
          <Button onClick={() => router.push('/aspirant/dashboard')} className="rounded-2xl">
            Return to Dashboard
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (!appFeePaid) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Entrance Exam</p>
          <h1 className="mt-3 text-3xl font-extrabold">Online Screening Examination</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
            Take the secure online entrance exam to complete your admission process.
          </p>
        </div>
        <StageGateCard
          currentStage="signup"
          requiredStage="payment"
          requiredActionLabel="Pay Application Fee"
          requiredActionLink="/aspirant/dashboard"
          featureName="Entrance Exam"
          description="You need to pay the application fee before you can take the entrance exam."
          icon={ShieldCheck}
        />
      </div>
    )
  }

  if (!documentsUploaded) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Entrance Exam</p>
          <h1 className="mt-3 text-3xl font-extrabold">Online Screening Examination</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
            Take the secure online entrance exam to complete your admission process.
          </p>
        </div>
        <StageGateCard
          currentStage="payment"
          requiredStage="documents"
          requiredActionLabel="Upload Documents"
          requiredActionLink="/aspirant/dashboard"
          featureName="Entrance Exam"
          description="You need to upload your documents before you can take the entrance exam."
          icon={ShieldCheck}
        />
      </div>
    )
  }

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

      // Attach stream to video ref immediately
      if (videoRef.current) {
        videoRef.current.srcObject = webcamStream
        videoRef.current.play().catch(err => console.error('Video play error:', err))
      }

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
              <li>This exam consists of {questions.length} multiple-choice questions</li>
              <li>You have {examConfig?.duration_minutes || 10} minutes to complete the exam</li>
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
              onClick={() => setCurrentStep('screen-recording')}
              disabled={!agreedToRules}
              className="flex-1 rounded-2xl"
            >
              Proceed to Screen Recording
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 3: Screen Recording setup
  if (currentStep === 'screen-recording') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-10 shadow-sm dark:bg-slate-900">
          <div className="text-center">
            <Monitor className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-3xl font-extrabold">Screen Recording Required</h1>
            <p className="mt-2 text-muted-foreground">Please enable screen sharing for proctoring</p>
          </div>

          <div className="space-y-4 rounded-2xl bg-blue-500/5 p-6 dark:bg-blue-500/10">
            <h3 className="font-bold text-foreground">Important Instructions</h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li className="font-semibold text-blue-600 dark:text-blue-400">Please select "Entire Screen" when prompted</li>
              <li>Do not select a specific window or browser tab</li>
              <li>Your screen will be recorded throughout the exam for security purposes</li>
              <li>The recording will be uploaded securely after exam completion</li>
            </ul>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Screen Recording Status</span>
            </div>
            <div className={`flex items-center gap-2 text-sm font-medium ${
              screenRecordingReady ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {screenRecordingReady ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Ready
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Not Started
                </>
              )}
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
              onClick={async () => {
                try {
                  await startScreenRecording()
                  setScreenRecordingReady(true)
                  toast.success('Screen recording started successfully')
                } catch (error) {
                  console.error('Failed to start screen recording:', error)
                  toast.error('Failed to start screen recording. Please try again.')
                }
              }}
              disabled={screenRecordingReady}
              className="flex-1 rounded-2xl"
            >
              {screenRecordingReady ? 'Recording Started' : 'Start Screen Recording'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {screenRecordingReady && (
            <Button
              onClick={() => setCurrentStep('fullscreen')}
              className="w-full rounded-2xl"
            >
              Proceed to Fullscreen
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </Card>
      </div>
    )
  }

  // Step 4: Fullscreen setup
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
              onClick={() => setCurrentStep('screen-recording')}
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
              {questions.length > 0 && (
                <div key={questions[currentQuestionIndex].id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-foreground">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                    <div className="flex gap-2">
                      {questions.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 w-2 rounded-full ${
                            idx === currentQuestionIndex
                              ? 'bg-primary'
                              : idx < currentQuestionIndex
                              ? 'bg-primary/50'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {questions[currentQuestionIndex].question_text}
                  </p>
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option: string, optionIndex: number) => {
                      const isSelected = answers[questions[currentQuestionIndex].id] === option
                      return (
                        <button
                          key={option}
                          onClick={() => setAnswers({ ...answers, [questions[currentQuestionIndex].id]: option })}
                          className={`w-full rounded-xl p-4 text-left transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25'
                              : 'bg-slate-50 text-foreground hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 ${
                              isSelected
                                ? 'border-primary-foreground bg-primary-foreground text-primary'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-sm font-semibold">{String.fromCharCode(65 + optionIndex)}</span>
                              )}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="h-14 rounded-2xl text-lg font-bold"
              >
                Previous
              </Button>
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={submitExam} disabled={submitting} className="h-14 rounded-2xl text-lg font-bold">
                  {submitting ? 'Submitting...' : 'Submit Examination'}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  className="h-14 rounded-2xl text-lg font-bold"
                >
                  Next
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card className="space-y-6 rounded-[2.5rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Camera className="h-4 w-4" />
              PROCTOR CAMERA PREVIEW
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="h-full w-full scale-x-[-1] object-cover"
              />
              {!webcamStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-xs text-muted-foreground/80">
                  <AlertTriangle className="mb-2 h-8 w-8 text-amber-500" />
                  <span>Webcam Not Connected</span>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                Webcam Active
              </span>
              {faceDetected ? (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Face Detected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  No Face
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Monitor className="h-4 w-4" />
                Screen Capture Active
              </span>
              {audioDetected ? (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Mic className="h-4 w-4" />
                  Audio Detected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mic className="h-4 w-4" />
                  No Audio
                </span>
              )}
            </div>
            {aiViolationScore > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-red-500/10 p-2 text-red-600">
                <span className="font-semibold">AI Suspicion Score:</span>
                <span className="font-bold">{aiViolationScore}%</span>
              </div>
            )}
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