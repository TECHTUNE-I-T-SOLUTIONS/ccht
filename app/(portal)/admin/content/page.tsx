'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, MoreVertical, Trash2, Calendar, FileText, Globe, ArrowRight, UploadCloud, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getBlogPostsAction, getEventsAction, createBlogPostAction, createEventAction, deleteBlogPostAction, deleteEventAction } from '@/app/actions/admin/content-actions'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { uploadFileToCloudinary } from '@/lib/cloudinary'
import Link from 'next/link'

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('blog')
  const [blogs, setBlogs] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [blogImagePreview, setBlogImagePreview] = useState<string | null>(null)
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null)

  const [blogData, setBlogData] = useState({ title: '', slug: '', excerpt: '', content: '', featuredImage: '', isPublished: false })
  const [eventData, setEventData] = useState({ title: '', slug: '', description: '', eventDate: '', location: '', imageUrl: '', isPublished: false })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [blogRes, eventRes] = await Promise.all([getBlogPostsAction(), getEventsAction()])
      if (blogRes.success) setBlogs(blogRes.data || [])
      if (eventRes.success) setEvents(eventRes.data || [])
    } catch (err) {
      toast.error('An error occurred')
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

  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'blog-posts')

      const response = await fetch('/api/v1/admin/upload-image', {
        method: 'POST',
        body: uploadFormData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image')
      }

      setBlogData({ ...blogData, featuredImage: result.data.url })
      setBlogImagePreview(result.data.url)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Image upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'events')

      const response = await fetch('/api/v1/admin/upload-image', {
        method: 'POST',
        body: uploadFormData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image')
      }

      setEventData({ ...eventData, imageUrl: result.data.url })
      setEventImagePreview(result.data.url)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Image upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeBlogImage = () => {
    setBlogData({ ...blogData, featuredImage: '' })
    setBlogImagePreview(null)
  }

  const removeEventImage = () => {
    setEventData({ ...eventData, imageUrl: '' })
    setEventImagePreview(null)
  }

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const slug = blogData.slug || generateSlug(blogData.title)
      const res = await createBlogPostAction({ ...blogData, slug })
      if (res.success) {
        toast.success('Blog post created')
        setIsBlogModalOpen(false)
        setBlogData({ title: '', slug: '', excerpt: '', content: '', featuredImage: '', isPublished: false })
        setBlogImagePreview(null)
        loadData()
      } else {
        toast.error(res.error || 'Failed to create blog')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const slug = eventData.slug || generateSlug(eventData.title)
      const res = await createEventAction({ ...eventData, slug })
      if (res.success) {
        toast.success('Event created')
        setIsEventModalOpen(false)
        setEventData({ title: '', slug: '', description: '', eventDate: '', location: '', imageUrl: '', isPublished: false })
        setEventImagePreview(null)
        loadData()
      } else {
        toast.error(res.error || 'Failed to create event')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Delete this post?')) return
    const res = await deleteBlogPostAction(id)
    if (res.success) {
      toast.success('Deleted')
      loadData()
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Delete this event?')) return
    const res = await deleteEventAction(id)
    if (res.success) {
      toast.success('Deleted')
      loadData()
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Content Manager</h1>
            <p className="mt-2 text-sm text-foreground/75">Publish updates, announcements, and school events to the public website.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3 max-w-xl">
            <Link href="/admin/blog">
              <Button variant="outline" className="rounded-xl gap-2">
                Manage Blog <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/management/events">
              <Button variant="outline" className="rounded-xl gap-2">
                Manage Events <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/management/notices">
              <Button variant="outline" className="rounded-xl gap-2">
                Manage Notices <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/management/announcements">
              <Button variant="outline" className="rounded-xl gap-2">
                Manage Announcements <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="blog" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-slate-900">Blog Posts</TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-slate-900">School Events</TabsTrigger>
        </TabsList>

        <TabsContent value="blog">
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Latest Posts</h2>
                <Link href="/admin/blog/new">
                  <Button className="rounded-xl border border-primary hover:text-blue-400 hover:shadow-lg hover:shadow-blue-400">
                    <Plus className="mr-2 h-4 w-4" /> New Post
                  </Button>
                </Link>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : blogs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">No posts found.</TableCell></TableRow>
                  ) : (
                    blogs.map(blog => (
                      <TableRow key={blog.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-4">
                            {blog.featured_image_url ? (
                              <img src={blog.featured_image_url} alt="" className="h-12 w-12 rounded-lg object-cover bg-muted" />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><FileText className="h-5 w-5" /></div>
                            )}
                            <div>
                              <div className="font-bold text-base mb-1">{blog.title}</div>
                              {blog.excerpt && <div className="text-xs text-muted-foreground line-clamp-1 mb-1 max-w-[400px]">{blog.excerpt}</div>}
                              <div className="text-xs font-medium text-slate-500">{new Date(blog.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{blog.author?.first_name ? `${blog.author.first_name} ${blog.author.last_name}` : 'Admin'}</TableCell>
                        <TableCell>
                          {blog.status === 'published' ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Published</span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Draft</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDeleteBlog(blog.id)} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Upcoming Events</h2>
                <Link href="/admin/management/events/new">
                  <Button className="rounded-xl border border-primary hover:text-blue-400 hover:shadow-lg hover:shadow-blue-400"><Plus className="mr-2 h-4 w-4" /> New Event</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? <p>Loading events...</p> : events.length === 0 ? <p>No events found.</p> : events.map(event => (
                <Card key={event.id} className="overflow-hidden border group">
                  <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative">
                    {event.featured_image_url ? (
                      <img src={event.featured_image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                        <Calendar className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {event.is_published ? (
                        <span className="px-2 py-1 text-[10px] uppercase font-bold rounded-full bg-emerald-500 text-white shadow-sm">Published</span>
                      ) : (
                        <span className="px-2 py-1 text-[10px] uppercase font-bold rounded-full bg-slate-800 text-white shadow-sm">Draft</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground"><Calendar className="mr-2 h-4 w-4 shrink-0" /> {new Date(event.event_date).toLocaleString()}</div>
                      <div className="flex items-center text-sm text-muted-foreground"><Globe className="mr-2 h-4 w-4 shrink-0" /> {event.location}</div>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
