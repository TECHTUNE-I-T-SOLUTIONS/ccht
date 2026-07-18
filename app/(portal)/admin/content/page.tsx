'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, MoreVertical, Trash2, Calendar, FileText, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getBlogPostsAction, getEventsAction, createBlogPostAction, createEventAction, deleteBlogPostAction, deleteEventAction } from '@/app/actions/admin/content-actions'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('blog')
  const [blogs, setBlogs] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createBlogPostAction(blogData)
      if (res.success) {
        toast.success('Blog post created')
        setIsBlogModalOpen(false)
        setBlogData({ title: '', slug: '', excerpt: '', content: '', featuredImage: '', isPublished: false })
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
      const res = await createEventAction(eventData)
      if (res.success) {
        toast.success('Event created')
        setIsEventModalOpen(false)
        setEventData({ title: '', slug: '', description: '', eventDate: '', location: '', imageUrl: '', isPublished: false })
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
        <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Content Manager</h1>
        <p className="mt-2 text-sm text-foreground/75">Publish updates, announcements, and school events to the public website.</p>
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
              <Dialog open={isBlogModalOpen} onOpenChange={setIsBlogModalOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> New Post</Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-black sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create Blog Post</DialogTitle>
                    <DialogDescription>Create a new blog post to publish on the school website.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBlog} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input required value={blogData.title} onChange={e => setBlogData({ ...blogData, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug (URL)</label>
                      <Input required value={blogData.slug} onChange={e => setBlogData({ ...blogData, slug: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Excerpt</label>
                      <Textarea required value={blogData.excerpt} onChange={e => setBlogData({ ...blogData, excerpt: e.target.value })} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content</label>
                      <Textarea required value={blogData.content} onChange={e => setBlogData({ ...blogData, content: e.target.value })} rows={6} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Featured Image URL</label>
                      <Input value={blogData.featuredImage} onChange={e => setBlogData({ ...blogData, featuredImage: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-sm font-medium">Publish Immediately</span>
                      <Switch checked={blogData.isPublished} onCheckedChange={val => setBlogData({ ...blogData, isPublished: val })} />
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Publish Post'}</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
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
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><FileText className="h-4 w-4" /></div>
                            <div>
                              <div>{blog.title}</div>
                              <div className="text-xs text-muted-foreground">{new Date(blog.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{blog.author?.first_name} {blog.author?.last_name}</TableCell>
                        <TableCell>
                          {blog.is_published ? (
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
              <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> New Event</Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-black sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Event</DialogTitle>
                    <DialogDescription>Create a new school event to publish on the website.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Event Title</label>
                      <Input required value={eventData.title} onChange={e => setEventData({ ...eventData, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug (URL)</label>
                      <Input required value={eventData.slug} onChange={e => setEventData({ ...eventData, slug: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Event Date & Time</label>
                        <Input type="datetime-local" required value={eventData.eventDate} onChange={e => setEventData({ ...eventData, eventDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Location</label>
                        <Input required value={eventData.location} onChange={e => setEventData({ ...eventData, location: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea required value={eventData.description} onChange={e => setEventData({ ...eventData, description: e.target.value })} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image URL</label>
                      <Input value={eventData.imageUrl} onChange={e => setEventData({ ...eventData, imageUrl: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-sm font-medium">Publish Event</span>
                      <Switch checked={eventData.isPublished} onCheckedChange={val => setEventData({ ...eventData, isPublished: val })} />
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Create Event'}</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? <p>Loading events...</p> : events.length === 0 ? <p>No events found.</p> : events.map(event => (
                <Card key={event.id} className="overflow-hidden border group">
                  <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative">
                    {event.image_url ? (
                      <img src={event.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Calendar className="h-10 w-10" /></div>
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
