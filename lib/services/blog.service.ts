import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import { CreateBlogPostSchema, UpdateBlogPostSchema } from '@/lib/validation';
import { z } from 'zod';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id?: string;
  featured_image_url?: string;
  status: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

export class BlogService {
  static async getAllBlogPosts(limit?: number): Promise<BlogPost[]> {
    const supabase = createPublicClient();
    
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw new Error('Failed to fetch blog posts');
    }

    return data || [];
  }

  static async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching blog post:', error);
      throw new Error('Failed to fetch blog post');
    }

    return data || null;
  }

  static async getBlogPostById(id: string): Promise<BlogPost | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching blog post:', error);
      throw new Error('Failed to fetch blog post');
    }

    return data || null;
  }

  static async createBlogPost(input: z.infer<typeof CreateBlogPostSchema>, authorId?: string): Promise<BlogPost> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        featured_image_url: input.featuredImageUrl || null,
        status: input.status || 'draft',
        author_id: authorId || null,
        published_at: input.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      throw new Error('Failed to create blog post');
    }

    return data;
  }

  static async updateBlogPost(id: string, input: z.infer<typeof UpdateBlogPostSchema>): Promise<BlogPost> {
    const supabase = await createClient();

    const updateData: Record<string, any> = {};
    if (input.title) updateData.title = input.title;
    if (input.slug) updateData.slug = input.slug;
    if (input.content) updateData.content = input.content;
    if (input.excerpt) updateData.excerpt = input.excerpt;
    if (input.featuredImageUrl !== undefined) updateData.featured_image_url = input.featuredImageUrl;
    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      throw new Error('Failed to update blog post');
    }

    return data;
  }

  static async deleteBlogPost(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      throw new Error('Failed to delete blog post');
    }
  }

  static async searchBlogPosts(query: string): Promise<BlogPost[]> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('status', 'published');

    if (error) {
      console.error('Error searching blog posts:', error);
      throw new Error('Failed to search blog posts');
    }

    return data || [];
  }

  static async getAllBlogPostsForAdmin(): Promise<BlogPost[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw new Error('Failed to fetch blog posts');
    }

    return data || [];
  }
}
