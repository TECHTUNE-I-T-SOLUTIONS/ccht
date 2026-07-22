'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2, X } from 'lucide-react'

type Department = {
  id: string
  name: string
}

// Nigerian states for student signup
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun',
  'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
]

// All LGA options (abbreviated - user can type)
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENOTYPES = ['AA', 'AS', 'SS', 'AC']

export default function AddLecturerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [nextEmployeeNumber, setNextEmployeeNumber] = useState<number>(1)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    employeeNumber: '',
    qualification: '',
    specialization: '',
    selectedDepartmentIds: [] as string[],
    employmentType: 'full_time' as 'full_time' | 'part_time' | 'adjunct' | 'contract',
    employmentStatus: 'active' as 'active' | 'inactive' | 'suspended',
    dateJoined: '',
    officeLocation: '',
    officeHours: '',
    canPublishResults: false,
    canEnterScores: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadDepartments()
    getNextEmployeeNumber()
  }, [])

  const loadDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('*').order('name')
      setDepartments(data || [])
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  const getNextEmployeeNumber = async () => {
    try {
      const { data } = await supabase
        .from('teacher_profiles')
        .select('employee_number')
        .order('employee_number', { ascending: false })
        .limit(1)
      
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].employee_number)
        setNextEmployeeNumber(lastNumber + 1)
      }
    } catch (error) {
      console.error('Failed to get next employee number:', error)
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

  const generateDefaultPassword = (firstName: string, employeeNumber: string): string => {
    const base = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6)
    const empNum = employeeNumber.replace(/\D/g, '').substring(0, 4)
    const currentYear = new Date().getFullYear().toString().slice(-2)
    // Generate password that meets AuthService requirements: min 10 chars, uppercase, lowercase, number, special
    const uppercase = base.charAt(0).toUpperCase()
    const special = '@'
    return `${uppercase}${base}${empNum}${special}${currentYear}`
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
      toast.error('Please fill in all required fields correctly')
      return
    }

    setLoading(true)

    try {
      const empNum = parseInt(formData.employeeNumber)
      const staffNumber = `CCHT/L/${empNum.toString().padStart(3, '0')}`
      const defaultPassword = generateDefaultPassword(formData.firstName, formData.employeeNumber)

      // Get department names from selected IDs
      const selectedDeptNames = departments
        .filter(d => formData.selectedDepartmentIds.includes(d.id))
        .map(d => d.name)

      // Step 1: Create auth user with default password via signup API
      const signupResponse = await fetch('/api/v1/admin/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: defaultPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || null,
          phone: formData.phone || null,
          role: 'lecturer',
          staffNumber: staffNumber,
          employeeNumber: formData.employeeNumber,
          qualification: formData.qualification,
          specialization: formData.specialization,
          department: selectedDeptNames[0] || '',
          departments: selectedDeptNames,
          employmentType: formData.employmentType,
          dateJoined: formData.dateJoined,
          officeLocation: formData.officeLocation || null,
          officeHours: formData.officeHours || null,
          canPublishResults: formData.canPublishResults,
          canEnterScores: formData.canEnterScores,
          employmentStatus: formData.employmentStatus,
        })
      })

      const result = await signupResponse.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(`Lecturer added successfully! Default password: ${defaultPassword}`)
      router.push('/admin/management/lecturers')
    } catch (error: any) {
      console.error('Failed to add lecturer:', error)
      toast.error(error.message || 'Failed to add lecturer')
    } finally {
      setLoading(false)
    }
  }

  const unselectedDepartments = departments.filter(
    d => !formData.selectedDepartmentIds.includes(d.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Lecturer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register a new lecturer and create their account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="mt-1"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="mt-1"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Employment Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employeeNumber">Employee Number *</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setFormData({ ...formData, employeeNumber: value })
                  }}
                  placeholder={nextEmployeeNumber.toString().padStart(3, '0')}
                  required
                  className="mt-1"
                />
                {errors.employeeNumber && <p className="text-red-500 text-xs mt-1">{errors.employeeNumber}</p>}
                <p className="text-xs text-muted-foreground mt-1">Next available: {nextEmployeeNumber.toString().padStart(3, '0')}</p>
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
                <Label htmlFor="employmentStatus">Employment Status *</Label>
                <Select value={formData.employmentStatus} onValueChange={(value: any) => setFormData({ ...formData, employmentStatus: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateJoined">Date Joined *</Label>
                <Input
                  id="dateJoined"
                  type="date"
                  value={formData.dateJoined}
                  onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                  required
                  className="mt-1"
                />
                {errors.dateJoined && <p className="text-red-500 text-xs mt-1">{errors.dateJoined}</p>}
              </div>
            </div>
          </Card>

          {/* Academic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
            <div className="space-y-4">
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
          </Card>

          {/* Department Selection */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Department Assignment *</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select one or more departments for this lecturer
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
          </Card>

          {/* Office Information */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Office Information</h3>
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
          </Card>

          {/* Account Info */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                An account will be created automatically for this lecturer with a default password.
                They will be prompted to change it on first login.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Default password format: <code className="font-mono font-bold">Firstname(6chars)employeeNumber@26</code>
              </p>
            </div>
          </Card>

          {/* Permissions */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Permissions</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="canPublishResults"
                  checked={formData.canPublishResults}
                  onChange={(e) => setFormData({ ...formData, canPublishResults: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="canPublishResults" className="cursor-pointer">
                  Can Publish Results
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="canEnterScores"
                  checked={formData.canEnterScores}
                  onChange={(e) => setFormData({ ...formData, canEnterScores: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="canEnterScores" className="cursor-pointer">
                  Can Enter Scores
                </Label>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="lg:col-span-2">
            <Button type="submit" disabled={loading} className="w-full md:w-auto border border-primary hover:text-blue-600 hover:shadow-lg transition-all hover:shadow-blue-200 hover:dark:shadow-blue-800">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Lecturer...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Lecturer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}