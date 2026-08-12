import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { BlogService } from '@/lib/services/blog.service'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock3, FileText, Sparkles } from 'lucide-react'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Blog',
  description: 'Latest news, updates, and articles from Covenant College of Health Technology.',
  path: '/blog',
})

function formatDate(dateString?: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function BlogPage() {
  const posts = await BlogService.getAllBlogPosts()
  const featuredPost = posts[0]
  const recentPosts = posts.slice(1)

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background))_45%,hsl(var(--muted)/0.22))]">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 pt-28 md:pt-32">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,22,47,0.98),rgba(5,10,22,0.92))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.18),transparent_26%)]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl text-white">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                College stories, announcements, and campus updates
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Blog & Updates</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
                Fresh news, practical insights, and official updates from CCHT, all in one place.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          {featuredPost ? (
            <div className="mb-12 overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
              <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="p-6 md:p-10">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Featured Post
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{featuredPost.title}</h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                    {featuredPost.excerpt}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Read the latest update</span>
                  </div>
                  <div className="mt-8">
                    <Link href={`${ROUTES.blog}/${featuredPost.slug}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                      Read feature <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                <div className="min-h-[260px] bg-muted">
                  {featuredPost.featured_image_url ? (
                    <img src={featuredPost.featured_image_url} alt={featuredPost.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(15,23,42,0.06))] text-primary/60">
                      <FileText className="h-20 w-20" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {recentPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recentPosts.map((post) => (
                <Link key={post.id} href={`${ROUTES.blog}/${post.slug}`} className="group block h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="aspect-[16/9] bg-muted">
                      {post.featured_image_url ? (
                        <img src={post.featured_image_url} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(16,185,129,0.12))] text-primary/60">
                          <FileText className="h-14 w-14" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                        <span>Blog</span>
                        {post.tags?.[0] ? <span className="rounded-full bg-primary/10 px-2 py-1 normal-case tracking-normal">{post.tags[0]}</span> : null}
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight transition group-hover:text-primary">{post.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
                      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(post.published_at || post.created_at)}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">Read <ArrowRight className="h-4 w-4" /></span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/60 p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-primary/40" />
              <p className="mt-4 text-lg text-muted-foreground">No blog posts yet</p>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}
