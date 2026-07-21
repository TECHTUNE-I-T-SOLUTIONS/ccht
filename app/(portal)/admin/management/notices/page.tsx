'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, CheckCircle, Clock, Loader2, Bell, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

type Notice = {
  id: string
  title: string
  slug: string
  content: string
  target_audience: 'all' | 'students' | 'teachers' | 'admins'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_published: boolean
  published_at?: string
  created_at: string
  created_by?: string
  creator?: {
    first_name: string
    last_name: string
  }
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    target_audience: 'all' as 'all' | 'students' | 'teachers' | 'admins',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    is_published: false
  })

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*, creator:profiles(first_name, last_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('Failed to load notices:', error)
      toast.error('Failed to load notices')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Please fill in all required fields')
      return
    }

    const slug = formData.slug || generateSlug(formData.title)

    try {
      const { error } = await supabase.from('notices').insert({
        title: formData.title,
        slug,
        content: formData.content,
        target_audience: formData.target_audience,
        priority: formData.priority,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null
      })

      if (error) throw error

      toast.success('Notice created successfully')
      setIsCreateModalOpen(false)
      resetForm()
      loadNotices()
    } catch (error) {
      console.error('Failed to create notice:', error)
      toast.error('Failed to create notice')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Notice published successfully')
      loadNotices()
    } catch (error) {
      console.error('Failed to publish notice:', error)
      toast.error('Failed to publish notice')
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ 
          is_published: false,
          published_at: null
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Notice unpublished successfully')
      loadNotices()
    } catch (error) {
      console.error('Failed to unpublish notice:', error)
      toast.error('Failed to unpublish notice')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return

    try {
      const { error } = await supabase.from('notices').delete().eq('id', id)
      if (error) throw error

      toast.success('Notice deleted successfully')
      loadNotices()
    } catch (error) {
      console.error('Failed to delete notice:', error)
      toast.error('Failed to delete notice')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      target_audience: 'all',
      priority: 'normal',
      is_published: false
    })
  }

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = 
      notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="h-3 w-3 mr-1" /> Urgent</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">High</Badge>
      case 'low':
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Low</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Normal</Badge>
    }
  }

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case 'students':
        return <Badge variant="outline">Students</Badge>
      case 'teachers':
        return <Badge variant="outline">Teachers</Badge>
      case 'admins':
        return <Badge variant="outline">Admins</Badge>
      default:
        return <Badge variant="outline">All</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage notices for students, teachers, and admins</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Notice</DialogTitle>
              <DialogDescription>Create a new notice to display on dashboards</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Notice title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  placeholder="notice-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content *</label>
                <Textarea
                  placeholder="Notice content..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-1"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select value={formData.target_audience} onValueChange={(value: any) => setFormData({ ...formData, target_audience: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <label htmlFor="is_published" className="text-sm font-medium cursor-pointer">Publish immediately</label>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create Notice
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
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No notices found</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="font-medium">{notice.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {notice.content}
                    </TableCell>
                    <TableCell>{getAudienceBadge(notice.target_audience)}</TableCell>
                    <TableCell>{getPriorityBadge(notice.priority)}</TableCell>
                    <TableCell>
                      {notice.creator ? `${notice.creator.first_name} ${notice.creator.last_name}` : 'System'}
                    </TableCell>
                    <TableCell>
                      {notice.is_published ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" /> Published
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          <Clock className="h-3 w-3 mr-1" /> Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!notice.is_published ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublish(notice.id)}
                          >
                            Publish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(notice.id)}
                          >
                            Unpublish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notice.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
