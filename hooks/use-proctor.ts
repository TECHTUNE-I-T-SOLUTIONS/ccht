'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ProctorOptions {
  aspirantId: string
  webcamEnabled?: boolean
  screenShareEnabled?: boolean
  fullscreenRequired?: boolean
  preventCopyPaste?: boolean
  preventShortcuts?: boolean
  captureIntervalMs?: number // e.g. 120000 (2 minutes)
  onViolation?: (violation: { type: string; details: string }) => void
  onTimeOut?: () => void
  durationSeconds?: number
}

export function useProctor({
  aspirantId,
  webcamEnabled = true,
  screenShareEnabled = true,
  fullscreenRequired = true,
  preventCopyPaste = true,
  preventShortcuts = true,
  captureIntervalMs = 60000, // 1 minute default for robust testing
  onViolation,
  onTimeOut,
  durationSeconds = 3600, // 1 hour default
}: ProctorOptions) {
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [violations, setViolations] = useState<{ type: string; timestamp: Date; details: string }[]>([])
  const [deviceFingerprint, setDeviceFingerprint] = useState('')

  const supabase = createClient()
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Retrieve device fingerprints
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fingerprint = `${navigator.userAgent} | Screen: ${window.screen.width}x${window.screen.height} | Language: ${navigator.language}`
      setDeviceFingerprint(fingerprint)
    }
  }, [])

  // Logger helper
  const logViolation = useCallback(async (type: string, details: string, screenshotUrl?: string) => {
    const timestamp = new Date()
    setViolations((prev) => [...prev, { type, timestamp, details }])
    if (onViolation) onViolation({ type, details })

    // Log to Supabase database
    try {
      await supabase.from('proctoring_logs').insert({
        aspirant_id: aspirantId,
        event_type: type,
        violation_details: details,
        screenshot_url: screenshotUrl || null,
        device_fingerprint: deviceFingerprint || (typeof window !== 'undefined' ? window.navigator.userAgent : ''),
      })
    } catch (err) {
      console.error('Failed to save proctor log:', err)
    }
  }, [aspirantId, deviceFingerprint, onViolation, supabase])

  // Initialize Media Streams (Webcam & Screen Share)
  useEffect(() => {
    let activeWebcam: MediaStream | null = null
    let activeScreen: MediaStream | null = null

    const startMedia = async () => {
      try {
        if (webcamEnabled) {
          activeWebcam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          setWebcamStream(activeWebcam)
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = activeWebcam
          }
        }
      } catch (err) {
        logViolation('webcam_permission_denied', 'Candidate denied webcam access')
      }

      try {
        if (screenShareEnabled) {
          activeScreen = await navigator.mediaDevices.getDisplayMedia({ video: true })
          setScreenStream(activeScreen)

          // Monitor if candidate stops screen share manually
          activeScreen.getVideoTracks()[0].onended = () => {
            logViolation('screen_share_stopped', 'Candidate stopped sharing their screen')
          }
        }
      } catch (err) {
        logViolation('screen_share_permission_denied', 'Candidate denied screen share access')
      }
    }

    startMedia()

    return () => {
      if (activeWebcam) activeWebcam.getTracks().forEach(t => t.stop())
      if (activeScreen) activeScreen.getTracks().forEach(t => t.stop())
    }
  }, [webcamEnabled, screenShareEnabled, logViolation])

  // Periodic capture helper (mock capture uploads or diagnostics)
  const captureFrame = useCallback(async () => {
    if (!webcamVideoRef.current || !webcamStream) return

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(webcamVideoRef.current, 0, 0, canvas.width, canvas.height)
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.6)
        
        // Under Cloudinary / Supabase storage migration: we log periodic webcam checks
        // Currently, logging verification snapshot creation events
        await logViolation('webcam_periodic_capture', 'Webcam verification snapshot captured successfully')
      }
    } catch (err) {
      console.warn('Frame capture check failed:', err)
    }
  }, [webcamStream, logViolation])

  // Periodic capture scheduler
  useEffect(() => {
    if (webcamEnabled && webcamStream) {
      captureIntervalRef.current = setInterval(captureFrame, captureIntervalMs)
    }
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current)
    }
  }, [webcamEnabled, webcamStream, captureFrame, captureIntervalMs])

  // Focus, fullscreen, keyboard shortcuts, mouse handlers
  useEffect(() => {
    // 1) Focus and tab visibility handlers
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        logViolation('tab_switch', 'Candidate switched browser tabs')
      }
    }

    const handleBlur = () => {
      logViolation('window_blur', 'Browser window lost focus')
    }

    // 2) Fullscreen handlers
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement
      setIsFullscreen(isFull)
      if (fullscreenRequired && !isFull) {
        logViolation('fullscreen_exit', 'Candidate exited fullscreen mode')
      }
    }

    // 3) Keyboard blocks
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!preventShortcuts) return

      const isDevTools =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'P' || e.key === 'p' || e.key === 'S' || e.key === 's'))

      if (isDevTools) {
        e.preventDefault()
        logViolation('prohibited_shortcut', `Attempted prohibited keyboard shortcut: ${e.key}`)
      }
    }

    // 4) Mouse copy paste blocks
    const handleContextMenu = (e: MouseEvent) => {
      if (preventCopyPaste) {
        e.preventDefault()
        logViolation('context_menu_attempt', 'Right-click attempt blocked')
      }
    }

    const handleCutCopyPaste = (e: ClipboardEvent) => {
      if (preventCopyPaste) {
        e.preventDefault()
        logViolation('clipboard_action', `Clipboard operation blocked: ${e.type}`)
      }
    }

    // 5) Network status
    const handleOnline = () => {
      setIsOnline(true)
      logViolation('network_recovered', 'Internet connection re-established')
    }
    const handleOffline = () => {
      setIsOnline(false)
      logViolation('network_lost', 'Internet connection lost')
    }

    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('copy', handleCutCopyPaste)
    window.addEventListener('cut', handleCutCopyPaste)
    window.addEventListener('paste', handleCutCopyPaste)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('copy', handleCutCopyPaste)
      window.removeEventListener('cut', handleCutCopyPaste)
      window.removeEventListener('paste', handleCutCopyPaste)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [logViolation, fullscreenRequired, preventCopyPaste, preventShortcuts])

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (onTimeOut) onTimeOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [onTimeOut])

  // Request fullscreen trigger helper
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (err) {
      console.error('Failed to enter fullscreen:', err)
    }
  }

  return {
    webcamVideoRef,
    isFullscreen,
    isOnline,
    timeLeft,
    violations,
    webcamStream,
    screenStream,
    enterFullscreen,
    logViolation,
  }
}
