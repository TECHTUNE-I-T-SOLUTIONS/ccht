import { createClient } from '@/lib/supabase/server';

export class AdminContentService {
  // --- Blog Posts ---
  static async getBlogPosts() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, author:profiles(first_name, last_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch blog posts: ' + error.message);
    return data;
  }

  static async createBlogPost(payload: any, authorId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        author_id: authorId,
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.excerpt,
        content: payload.content,
        featured_image: payload.featuredImage,
        is_published: payload.isPublished ?? false,
        published_at: payload.isPublished ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create blog post: ' + error.message);
    return data;
  }

  static async deleteBlogPost(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw new Error('Failed to delete blog post: ' + error.message);
    return true;
  }

  // --- Events ---
  static async getEvents() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) throw new Error('Failed to fetch events: ' + error.message);
    return data;
  }

  static async createEvent(payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        event_date: payload.eventDate,
        location: payload.location,
        image_url: payload.imageUrl,
        is_published: payload.isPublished ?? false,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create event: ' + error.message);
    return data;
  }

  static async deleteEvent(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw new Error('Failed to delete event: ' + error.message);
    return true;
  }

  // --- Contact Messages ---
  static async getContactMessages() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch contact messages: ' + error.message);
    return data;
  }

  static async markMessageRead(id: string, isRead: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: isRead })
      .eq('id', id);

    if (error) throw new Error('Failed to update message: ' + error.message);
    return true;
  }
}
