import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { BlogService } from '@/lib/services/blog.service'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import { FileText, Calendar, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Blog - Covenant College of Health Technology' }

export default async function BlogPage() {
  const posts = await BlogService.getAllBlogPosts()

  return (
    <>
      <Navbar />
      <main>
        <section className="animated-bg-surface relative overflow-hidden py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Updates</h1>
            <p className="text-lg text-foreground/70">Latest news, insights, and updates from CCHT</p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`${ROUTES.blog}/${post.slug}`}>
                    <article className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary transition-all cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                          <p className="text-foreground/70 mb-4 line-clamp-2">{post.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.published_at || post.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-primary font-semibold text-sm flex items-center gap-1">
                              Read More <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <p className="text-foreground/60 text-lg">No blog posts yet</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
