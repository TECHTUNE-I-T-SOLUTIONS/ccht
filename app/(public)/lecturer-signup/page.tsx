'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

type Department = {
  id: string
  name: string
}

export default function LecturerSignupPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    employeeNumber: '',
    qualification: '',
    specialization: '',
    selectedDepartmentIds: [] as string[],
    employmentType: 'full_time' as 'full_time' | 'part_time' | 'adjunct' | 'contract',
    dateJoined: '',
    officeLocation: '',
    officeHours: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    checkSignupStatus()
    loadDepartments()
  }, [])

  const checkSignupStatus = async () => {
    try {
      const { data } = await supabase
        .from('signup_settings')
        .select('is_enabled')
        .eq('signup_type', 'lecturer')
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

  const addDepartment = (departmentId: string) => {
    if (!formData.selectedDepartmentIds.includes(departmentId)) {
      setFormData({
        ...formData,
        selectedDepartmentIds: [...formData.selectedDepartmentIds, departmentId]
      })
      setErrors({ ...errors, selectedDepartmentIds: '' })
    }
  }

  const removeDepartment = (departmentId: string) => {
    setFormData({
      ...formData,
      selectedDepartmentIds: formData.selectedDepartmentIds.filter(id => id !== departmentId)
    })
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

    if (!formData.employeeNumber.trim()) newErrors.employeeNumber = 'Employee number is required'
    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required'
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required'
    if (formData.selectedDepartmentIds.length === 0) newErrors.selectedDepartmentIds = 'At least one department is required'
    if (!formData.dateJoined) newErrors.dateJoined = 'Date joined is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }

    setLoading(true)

    try {
      const empNum = parseInt(formData.employeeNumber)
      const staffNumber = `CCHT/L/${empNum.toString().padStart(3, '0')}`

      // Get department names from selected IDs
      const selectedDeptNames = departments
        .filter(d => formData.selectedDepartmentIds.includes(d.id))
        .map(d => d.name)

      // Create auth user with specified password
      const response = await fetch('/api/v1/public/auth/create-lecturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || null,
          phone: formData.phone || null,
          employeeNumber: formData.employeeNumber,
          staffNumber: staffNumber,
          qualification: formData.qualification,
          specialization: formData.specialization,
          department: selectedDeptNames[0] || '',
          departments: selectedDeptNames,
          employmentType: formData.employmentType,
          dateJoined: formData.dateJoined,
          officeLocation: formData.officeLocation || null,
          officeHours: formData.officeHours || null,
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Account created successfully! You can now login.')
      
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 2000)
    } catch (error: any) {
      console.error('Failed to create account:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const unselectedDepartments = departments.filter(
    d => !formData.selectedDepartmentIds.includes(d.id)
  )

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
              Lecturer signup is currently disabled. Please contact the administrator for assistance.
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
          <h1 className="text-3xl font-bold text-center">Lecturer Signup</h1>
          <p className="text-muted-foreground text-center mt-2">
            Create your lecturer account to access the lecturer portal
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
            </div>
          </div>

          {/* Employment Information */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Employment Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="employeeNumber">Employee Number *</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setFormData({ ...formData, employeeNumber: value })
                  }}
                  placeholder="e.g., 001"
                  required
                  className="mt-1"
                />
                {errors.employeeNumber && <p className="text-red-500 text-xs mt-1">{errors.employeeNumber}</p>}
              </div>
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select value={formData.employmentType} onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-Time</SelectItem>
                    <SelectItem value="part_time">Part-Time</SelectItem>
                    <SelectItem value="adjunct">Adjunct</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateJoined">Date Joined *</Label>
                <Input id="dateJoined" type="date" value={formData.dateJoined} onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })} required className="mt-1" />
                {errors.dateJoined && <p className="text-red-500 text-xs mt-1">{errors.dateJoined}</p>}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Academic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="qualification">Qualification *</Label>
                <Select value={formData.qualification} onValueChange={(value: any) => setFormData({ ...formData, qualification: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="SSCE">SSCE (Senior Secondary Certificate)</SelectItem>
                    <SelectItem value="WAEC">WAEC (West African Examinations Council)</SelectItem>
                    <SelectItem value="NECO">NECO (National Examinations Council)</SelectItem>
                    <SelectItem value="NABTEB">NABTEB (National Business & Technical Examinations)</SelectItem>
                    <SelectItem value="OND">OND (Ordinary National Diploma)</SelectItem>
                    <SelectItem value="NCE">NCE (National Certificate of Education)</SelectItem>
                    <SelectItem value="HND">HND (Higher National Diploma)</SelectItem>
                    <SelectItem value="BSc">BSc (Bachelor of Science)</SelectItem>
                    <SelectItem value="BEng">BEng (Bachelor of Engineering)</SelectItem>
                    <SelectItem value="BA">BA (Bachelor of Arts)</SelectItem>
                    <SelectItem value="BEd">BEd (Bachelor of Education)</SelectItem>
                    <SelectItem value="BPharm">BPharm (Bachelor of Pharmacy)</SelectItem>
                    <SelectItem value="MBBS">MBBS (Bachelor of Medicine & Surgery)</SelectItem>
                    <SelectItem value="LLB">LLB (Bachelor of Laws)</SelectItem>
                    <SelectItem value="MSc">MSc (Master of Science)</SelectItem>
                    <SelectItem value="MA">MA (Master of Arts)</SelectItem>
                    <SelectItem value="MEng">MEng (Master of Engineering)</SelectItem>
                    <SelectItem value="MBA">MBA (Master of Business Administration)</SelectItem>
                    <SelectItem value="MPhil">MPhil (Master of Philosophy)</SelectItem>
                    <SelectItem value="PhD">PhD (Doctor of Philosophy)</SelectItem>
                    <SelectItem value="EdD">EdD (Doctor of Education)</SelectItem>
                    <SelectItem value="DSc">DSc (Doctor of Science)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.qualification && <p className="text-red-500 text-xs mt-1">{errors.qualification}</p>}
              </div>
              <div>
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Computer Science, Mathematics"
                  required
                  className="mt-1"
                />
                {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
              </div>
            </div>
          </div>

          {/* Department Selection */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Department Assignment *</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select one or more departments you belong to
            </p>

            {formData.selectedDepartmentIds.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.selectedDepartmentIds.map((deptId) => {
                  const dept = departments.find(d => d.id === deptId)
                  return (
                    <div key={deptId} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {dept?.name || deptId}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDepartment(deptId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {unselectedDepartments.length > 0 && (
              <Select value="" onValueChange={(value) => addDepartment(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={
                    formData.selectedDepartmentIds.length === 0 
                      ? "Select a department" 
                      : "Add another department"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {unselectedDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {formData.selectedDepartmentIds.length > 0 && unselectedDepartments.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Add more departments using the dropdown above
              </p>
            )}

            {errors.selectedDepartmentIds && (
              <p className="text-red-500 text-xs mt-1">{errors.selectedDepartmentIds}</p>
            )}

            {formData.selectedDepartmentIds.length > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {formData.selectedDepartmentIds.length} department{formData.selectedDepartmentIds.length > 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </div>

          {/* Office Information */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Office Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="officeLocation">Office Location</Label>
                <Input
                  id="officeLocation"
                  value={formData.officeLocation}
                  onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  placeholder="e.g., Room 201, Building A"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="officeHours">Office Hours</Label>
                <Textarea
                  id="officeHours"
                  value={formData.officeHours}
                  onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                  placeholder="e.g., Mon-Fri, 9:00 AM - 12:00 PM"
                  className="mt-1"
                  rows={3}
                />
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

          <Button type="submit" disabled={loading} className="w-full border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-red-600">
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
          <a href="/login" className="text-primary hover:underline">
            Login here
          </a>
        </p>
      </Card>
    </div>
  )
}