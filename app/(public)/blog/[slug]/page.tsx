import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { BlogService } from '@/lib/services/blog.service'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const post = await BlogService.getBlogPostBySlug(resolvedParams.slug)
  if (!post) return { title: 'Post Not Found - CCHT' }
  return {
    title: post.seo_title || `${post.title} - CCHT Blog`,
    description: post.seo_description || post.excerpt,
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const post = await BlogService.getBlogPostBySlug(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 md:px-8 lg:px-12">
          <Link href={ROUTES.blog} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          
          <div className="mb-8">
            {post.tags?.[0] && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {post.tags[0]}
              </div>
            )}
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-6">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {post.author && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-foreground">{post.author.first_name} {post.author.last_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>
            </div>
          </div>

          {post.featured_image_url && (
            <div className="mb-12 overflow-hidden rounded-2xl bg-muted aspect-video relative">
              <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer />
    </div>
  )
}
