'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, UploadCloud, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function NewBlogPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [loadingAuthor, setLoadingAuthor] = useState(true)
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: '',
    seo_title: '',
    seo_description: '',
    featured_image_url: '',
    status: 'draft'
  })

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  useEffect(() => {
    const loadAuthor = async () => {
      try {
        const response = await fetch('/api/v1/auth/me')
        const result = await response.json()
        setAuthorId(result?.user?.id || null)
      } catch (error) {
        console.error('Failed to load author:', error)
        toast.error('Failed to load author data')
      } finally {
        setLoadingAuthor(false)
      }
    }

    loadAuthor()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'blog-posts')

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
    if (!formData.title || !formData.content) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!authorId) {
      toast.error('Unable to determine the author for this post')
      return
    }

    setSaving(true)
    try {
      const slug = formData.slug || generateSlug(formData.title)
      const excerpt = formData.excerpt || formData.content.substring(0, 150) + '...'
      const tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : []

      const { error } = await supabase.from('blog_posts').insert({
        author_id: authorId,
        title: formData.title,
        slug,
        content: formData.content,
        excerpt,
        tags,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        featured_image_url: formData.featured_image_url || null,
        status: formData.status,
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      })

      if (error) throw error

      toast.success('Blog post created successfully')
      router.push('/admin/blog')
    } catch (error) {
      console.error('Failed to create blog post:', error)
      toast.error('Failed to create blog post')
    } finally {
      setSaving(false)
    }
  }

  if (loadingAuthor) {
    return <div className="p-8 text-sm text-muted-foreground">Loading author data...</div>
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Create Blog Post</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use the full editor to draft, optimize, and publish a new post.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input required value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value, slug: generateSlug(e.target.value) }))} placeholder="Post title" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="post-slug" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content *</label>
            <Textarea required value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} rows={16} placeholder="Write your blog post content..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Excerpt</label>
            <Textarea value={formData.excerpt} onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} rows={3} placeholder="Brief summary of the post..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input value={formData.tags} onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))} placeholder="news, admissions, campus-life" />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">SEO Title</label>
              <Input value={formData.seo_title} onChange={e => setFormData(prev => ({ ...prev, seo_title: e.target.value }))} placeholder="SEO title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SEO Description</label>
              <Textarea value={formData.seo_description} onChange={e => setFormData(prev => ({ ...prev, seo_description: e.target.value }))} rows={4} placeholder="SEO meta description" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Featured Image</label>
              {imagePreview ? (
                <div className="relative overflow-hidden rounded-lg border">
                  <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover" />
                  <Button type="button" variant="destructive" size="sm" className="absolute right-2 top-2" onClick={removeImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed p-6 text-center">
                  <input id="blog-featured-image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                  <label htmlFor="blog-featured-image" className="flex cursor-pointer flex-col items-center gap-2">
                    {uploadingImage ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <UploadCloud className="h-8 w-8 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/50">
              <label htmlFor="blog-status" className="text-sm font-medium">Publish immediately</label>
              <Switch id="blog-status" checked={formData.status === 'published'} onCheckedChange={checked => setFormData(prev => ({ ...prev, status: checked ? 'published' : 'draft' }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/blog')}>Cancel</Button>
              <Button type="submit" disabled={saving || !authorId}>{saving ? 'Saving...' : 'Create Post'}</Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
