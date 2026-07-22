'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun',
  'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
]

export default function StudentSignupPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    studentNumber: '',
    matricNumber: '',
    programId: '',
    departmentId: '',
    nationality: 'Nigerian',
    stateOfOrigin: '',
    lga: '',
    address: '',
    city: '',
    state: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    genotype: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    checkSignupStatus()
    loadDepartments()
  }, [])

  useEffect(() => {
    if (formData.departmentId) {
      loadPrograms(formData.departmentId)
    }
  }, [formData.departmentId])

  const checkSignupStatus = async () => {
    try {
      const { data } = await supabase
        .from('signup_settings')
        .select('is_enabled')
        .eq('signup_type', 'student')
        .single()

      setSignupEnabled(data?.is_enabled || false)
    } catch (error) {
      console.error('Failed to check signup status:', error)
      setSignupEnabled(false)
    } finally {
      setChecking(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('*').order('name')
      setDepartments(data || [])
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  const loadPrograms = async (departmentId: string) => {
    try {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
      setPrograms(data || [])
    } catch (error) {
      console.error('Failed to load programs:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.studentNumber.trim()) newErrors.studentNumber = 'Student number is required'
    if (!formData.matricNumber.trim()) newErrors.matricNumber = 'Matric number is required'
    if (!formData.departmentId) newErrors.departmentId = 'Department is required'
    if (!formData.programId) newErrors.programId = 'Program is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateDefaultPassword = (firstName: string): string => {
    const base = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6)
    const year = new Date().getFullYear().toString().slice(-2)
    // Generate password that meets AuthService requirements: min 10 chars, uppercase, lowercase, number, special
    const uppercase = base.charAt(0).toUpperCase()
    const special = '@'
    return `${uppercase}${base}${special}Student${year}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }

    setLoading(true)

    try {
      const defaultPassword = generateDefaultPassword(formData.firstName)

      // Use public API to create the student
      const response = await fetch('/api/v1/public/auth/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: defaultPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || null,
          phone: formData.phone || null,
          studentNumber: formData.studentNumber,
          matricNumber: formData.matricNumber,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          nationality: formData.nationality,
          stateOfOrigin: formData.stateOfOrigin || null,
          lga: formData.lga || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          guardianName: formData.guardianName || null,
          guardianPhone: formData.guardianPhone || null,
          guardianEmail: formData.guardianEmail || null,
          admissionStatus: 'active',
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(`Account created successfully! Your default password is: ${defaultPassword}`)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 3000)
    } catch (error: any) {
      console.error('Failed to create account:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!signupEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Signup Disabled</h2>
            <p className="text-muted-foreground text-center">
              Student signup is currently disabled. Please contact the administrator for assistance.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-3xl p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">Student Signup</h1>
          <p className="text-muted-foreground text-center mt-2">
            Create your account to access the student portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required className="mt-1" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required className="mt-1" />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="mt-1" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required className="mt-1" />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>
              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="genotype">Genotype</Label>
                <Select value={formData.genotype} onValueChange={(value) => setFormData({ ...formData, genotype: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select genotype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="AS">AS</SelectItem>
                    <SelectItem value="SS">SS</SelectItem>
                    <SelectItem value="AC">AC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Academic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="studentNumber">Student Number *</Label>
                <Input id="studentNumber" value={formData.studentNumber} onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })} required className="mt-1" />
                {errors.studentNumber && <p className="text-red-500 text-xs mt-1">{errors.studentNumber}</p>}
              </div>
              <div>
                <Label htmlFor="matricNumber">Matric Number *</Label>
                <Input id="matricNumber" value={formData.matricNumber} onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })} required className="mt-1" />
                {errors.matricNumber && <p className="text-red-500 text-xs mt-1">{errors.matricNumber}</p>}
              </div>
              <div>
                <Label htmlFor="departmentId">Department *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value, programId: '' })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
              </div>
              <div>
                <Label htmlFor="programId">Program *</Label>
                <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })} disabled={!formData.departmentId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={formData.departmentId ? "Select program" : "Select department first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>{prog.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programId && <p className="text-red-500 text-xs mt-1">{errors.programId}</p>}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Address Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="state">State of Residence</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stateOfOrigin">State of Origin</Label>
                <Select value={formData.stateOfOrigin} onValueChange={(value) => setFormData({ ...formData, stateOfOrigin: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lga">LGA</Label>
                <Input id="lga" value={formData.lga} onChange={(e) => setFormData({ ...formData, lga: e.target.value })} placeholder="Local Government Area" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Guardian Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="guardianName">Guardian Name</Label>
                <Input id="guardianName" value={formData.guardianName} onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="guardianPhone">Guardian Phone</Label>
                <Input id="guardianPhone" value={formData.guardianPhone} onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="guardianEmail">Guardian Email</Label>
                <Input id="guardianEmail" type="email" value={formData.guardianEmail} onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact</Label>
                <Input id="emergencyContactName" value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Phone</Label>
                <Input id="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Account Security</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="mt-1" placeholder="Min. 6 characters" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required className="mt-1" />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary hover:underline">
            Login here
          </a>
        </p>
      </Card>
    </div>
  )
}