'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function AdminBlog() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }

    getPosts()
  }, [])

  if (loading) return <div className="p-8">Loading blog posts...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Manage Blog</h1>
          <p className="text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">No blog posts yet</p>
          <Button className="mt-4">Create First Post</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded ${post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {post.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
