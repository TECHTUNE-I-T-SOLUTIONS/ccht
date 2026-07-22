'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Settings, UserCheck, GraduationCap } from 'lucide-react'
import Link from 'next/link'

type SignupSetting = {
  signup_type: 'lecturer' | 'student'
  is_enabled: boolean
  updated_at: string
}

export default function SignupSettingsPage() {
  const [settings, setSettings] = useState<SignupSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('signup_settings')
        .select('*')
        .order('signup_type')

      if (error) throw error
      
      // Ensure we always have exactly 2 settings (lecturer and student)
      if (!data || data.length === 0) {
        // Initialize default settings if none exist
        const { data: newData, error: insertError } = await supabase
          .from('signup_settings')
          .insert([
            { signup_type: 'lecturer', is_enabled: true },
            { signup_type: 'student', is_enabled: true }
          ])
          .select('*')
        
        if (insertError) throw insertError
        setSettings(newData || [])
      } else {
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const toggleSetting = async (signupType: 'lecturer' | 'student', currentValue: boolean) => {
    setUpdating(signupType)
    try {
      const newValue = !currentValue
      
      // Use upsert to ensure we always update the correct record
      const { error } = await supabase
        .from('signup_settings')
        .upsert(
          { 
            signup_type: signupType, 
            is_enabled: newValue,
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: 'signup_type',
            ignoreDuplicates: false
          }
        )

      if (error) throw error

      // Update local state
      setSettings(settings.map(s => 
        s.signup_type === signupType ? { ...s, is_enabled: newValue } : s
      ))

      toast.success(`${signupType === 'lecturer' ? 'Lecturer' : 'Student'} signup ${newValue ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      console.error('Failed to update setting:', error)
      toast.error('Failed to update setting')
    } finally {
      setUpdating(null)
    }
  }

  const lecturerSetting = settings.find(s => s.signup_type === 'lecturer')
  const studentSetting = settings.find(s => s.signup_type === 'student')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/management">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Signup Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control who can sign up for accounts</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lecturer Signup Setting */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Lecturer Signup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Allow lecturers to sign up using access codes sent by admins
              </p>
              {lecturerSetting && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(lecturerSetting.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Current Status: <span className="font-bold">{lecturerSetting?.is_enabled ? 'ENABLED' : 'DISABLED'}</span>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {lecturerSetting?.is_enabled 
                  ? 'Lecturers can sign up using access codes' 
                  : 'Lecturer signup is currently disabled'}
              </p>
            </div>

            <Button
              onClick={() => toggleSetting('lecturer', lecturerSetting?.is_enabled || false)}
              disabled={updating === 'lecturer'}
              variant={lecturerSetting?.is_enabled ? 'destructive' : 'default'}
              className="w-full"
            >
              {updating === 'lecturer' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : lecturerSetting?.is_enabled ? (
                'Disable Lecturer Signup'
              ) : (
                'Enable Lecturer Signup'
              )}
            </Button>
          </div>
        </Card>

        {/* Student Signup Setting */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <GraduationCap className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Student Signup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Allow students to sign up directly without access codes
              </p>
              {studentSetting && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(studentSetting.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Current Status: <span className="font-bold">{studentSetting?.is_enabled ? 'ENABLED' : 'DISABLED'}</span>
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                {studentSetting?.is_enabled 
                  ? 'Students can sign up directly' 
                  : 'Student signup is currently disabled'}
              </p>
            </div>

            <Button
              onClick={() => toggleSetting('student', studentSetting?.is_enabled || false)}
              disabled={updating === 'student'}
              variant={studentSetting?.is_enabled ? 'destructive' : 'default'}
              className="w-full"
            >
              {updating === 'student' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : studentSetting?.is_enabled ? (
                'Disable Student Signup'
              ) : (
                'Enable Student Signup'
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Information Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Settings className="h-6 w-6 text-muted-foreground mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• When enabled, admins can generate signup links for lecturers</li>
              <li>• Students can sign up directly when student signup is enabled</li>
              <li>• Each access code can only be used once</li>
              <li>• When disabled, no new signups can be created</li>
              <li>• Changes take effect immediately</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}