'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, MoreVertical, Edit, Trash2, BookOpen, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string
  code: string
  title: string
  credit_units: number
  level: string
  semester: number
  description?: string
  program_id: string
  is_active: boolean
  program?: {
    title: string
  }
}

type Program = {
  id: string
  title: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    credit_units: 1,
    level: '100',
    semester: 1,
    description: '',
    program_id: '',
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [coursesRes, programsRes] = await Promise.all([
        supabase.from('courses').select('*, program:programs(title)').order('code'),
        supabase.from('programs').select('id, title').eq('is_active', true)
      ])
      
      if (coursesRes.error) throw coursesRes.error
      if (programsRes.error) throw programsRes.error
      
      setCourses(coursesRes.data || [])
      setPrograms(programsRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.code || !formData.title || !formData.program_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('courses').insert({
        code: formData.code.toUpperCase(),
        title: formData.title,
        credit_units: formData.credit_units,
        level: formData.level,
        semester: formData.semester,
        description: formData.description,
        program_id: formData.program_id,
        is_active: formData.is_active
      })

      if (error) throw error

      toast.success('Course created successfully')
      setIsCreateModalOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to create course:', error)
      toast.error('Failed to create course')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingCourse || !formData.code || !formData.title || !formData.program_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          code: formData.code.toUpperCase(),
          title: formData.title,
          credit_units: formData.credit_units,
          level: formData.level,
          semester: formData.semester,
          description: formData.description,
          program_id: formData.program_id,
          is_active: formData.is_active
        })
        .eq('id', editingCourse.id)

      if (error) throw error

      toast.success('Course updated successfully')
      setIsEditModalOpen(false)
      setEditingCourse(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to update course:', error)
      toast.error('Failed to update course')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error

      toast.success('Course deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course')
    }
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      code: course.code,
      title: course.title,
      credit_units: course.credit_units,
      level: course.level,
      semester: course.semester,
      description: course.description || '',
      program_id: course.program_id,
      is_active: course.is_active
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      credit_units: 1,
      level: '100',
      semester: 1,
      description: '',
      program_id: '',
      is_active: true
    })
  }

  const filteredCourses = courses.filter(course => {
    const query = searchQuery.toLowerCase()
    return course.code.toLowerCase().includes(query) || 
           course.title.toLowerCase().includes(query) ||
           course.program?.title.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit, and manage courses for all programs</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Course Code *</label>
                  <Input
                    placeholder="e.g., CMS 111"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Credit Units *</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.credit_units}
                    onChange={(e) => setFormData({ ...formData, credit_units: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Course Title *</label>
                <Input
                  placeholder="e.g., Anatomy and Physiology I"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Level *</label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100L</SelectItem>
                      <SelectItem value="200">200L</SelectItem>
                      <SelectItem value="300">300L</SelectItem>
                      <SelectItem value="400">400L</SelectItem>
                      <SelectItem value="500">500L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Semester *</label>
                  <Select value={formData.semester.toString()} onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Semester</SelectItem>
                      <SelectItem value="2">Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Program *</label>
                <Select value={formData.program_id} onValueChange={(value) => setFormData({ ...formData, program_id: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Course
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses by code, title, or program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">No courses found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.level}L</TableCell>
                    <TableCell>{course.semester === 1 ? 'First' : 'Second'}</TableCell>
                    <TableCell>{course.credit_units}</TableCell>
                    <TableCell>{course.program?.title || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        course.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(course)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(course.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Course Code *</label>
                <Input
                  placeholder="e.g., CMS 111"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Credit Units *</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.credit_units}
                  onChange={(e) => setFormData({ ...formData, credit_units: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Course Title *</label>
              <Input
                placeholder="e.g., Anatomy and Physiology I"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Level *</label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100L</SelectItem>
                    <SelectItem value="200">200L</SelectItem>
                    <SelectItem value="300">300L</SelectItem>
                    <SelectItem value="400">400L</SelectItem>
                    <SelectItem value="500">500L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Semester *</label>
                <Select value={formData.semester.toString()} onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">First Semester</SelectItem>
                    <SelectItem value="2">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Program *</label>
              <Select value={formData.program_id} onValueChange={(value) => setFormData({ ...formData, program_id: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Course description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <label className="text-sm font-medium">Active</label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Course
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
