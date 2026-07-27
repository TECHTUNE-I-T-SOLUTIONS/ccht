'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, UploadCloud, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    event_date: '',
    event_end_date: '',
    location: '',
    registration_link: '',
    featured_image_url: '',
    is_published: false
  })

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const { data, error } = await supabase.from('events').select('*').eq('id', params.id).single()
        if (error) throw error
        if (!data) throw new Error('Event not found')

        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          event_date: data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : '',
          event_end_date: data.event_end_date ? new Date(data.event_end_date).toISOString().slice(0, 16) : '',
          location: data.location || '',
          registration_link: data.registration_link || '',
          featured_image_url: data.featured_image_url || '',
          is_published: !!data.is_published
        })
        setImagePreview(data.featured_image_url || null)
      } catch (error) {
        console.error('Failed to load event:', error)
        toast.error('Failed to load event')
        router.push('/admin/management/events')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) loadEvent()
  }, [params.id, router, supabase])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'events')
      const response = await fetch('/api/v1/admin/upload-image', { method: 'POST', body: uploadFormData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to upload image')
      setFormData(prev => ({ ...prev, featured_image_url: result.data.url }))
      setImagePreview(result.data.url)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Image upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, featured_image_url: '' }))
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.event_date) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const slug = formData.slug || generateSlug(formData.title)
      const { error } = await supabase.from('events').update({
        title: formData.title,
        slug,
        description: formData.description,
        event_date: formData.event_date,
        event_end_date: formData.event_end_date || null,
        location: formData.location || null,
        registration_link: formData.registration_link || null,
        featured_image_url: formData.featured_image_url || null,
        is_published: formData.is_published
      }).eq('id', params.id)
      if (error) throw error
      toast.success('Event updated successfully')
      router.push('/admin/management/events')
    } catch (error) {
      console.error('Failed to update event:', error)
      toast.error('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading event...</div>

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <Link href="/admin/management/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Edit Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update the event details, schedule, and publication status.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="space-y-5 p-6">
          <div className="space-y-2"><label className="text-sm font-medium">Title *</label><Input required value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value, slug: generateSlug(e.target.value) }))} /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Slug</label><Input value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))} /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Description *</label><Textarea required value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={12} /></div>
        </Card>
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <div className="space-y-2"><label className="text-sm font-medium">Event Date *</label><Input type="datetime-local" required value={formData.event_date} onChange={e => setFormData(prev => ({ ...prev, event_date: e.target.value }))} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">End Date</label><Input type="datetime-local" value={formData.event_end_date} onChange={e => setFormData(prev => ({ ...prev, event_end_date: e.target.value }))} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Location</label><Input value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Registration Link</label><Input value={formData.registration_link} onChange={e => setFormData(prev => ({ ...prev, registration_link: e.target.value }))} /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Featured Image</label>
              {imagePreview ? <div className="relative overflow-hidden rounded-lg border"><img src={imagePreview} alt="Preview" className="h-48 w-full object-cover" /><Button type="button" variant="destructive" size="sm" className="absolute right-2 top-2" onClick={removeImage}><X className="h-4 w-4" /></Button></div> : <div className="rounded-lg border-2 border-dashed p-6 text-center"><input id="event-featured-image-edit" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} /><label htmlFor="event-featured-image-edit" className="flex cursor-pointer flex-col items-center gap-2">{uploadingImage ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <UploadCloud className="h-8 w-8 text-muted-foreground" />}<span className="text-sm text-muted-foreground">Click to upload image</span></label></div>}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50"><label htmlFor="event-status" className="text-sm font-medium">Publish immediately</label><Switch id="event-status" checked={formData.is_published} onCheckedChange={checked => setFormData(prev => ({ ...prev, is_published: checked }))} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => router.push('/admin/management/events')}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update Event'}</Button></div>
          </Card>
        </div>
      </form>
    </div>
  )
}
