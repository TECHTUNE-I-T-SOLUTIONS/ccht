import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import { CreateEventSchema, UpdateEventSchema } from '@/lib/validation';
import { z } from 'zod';

export type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string;
  location: string;
  organizer_id?: string;
  featured_image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export class EventService {
  static async getAllEvents(limit?: number): Promise<Event[]> {
    const supabase = createPublicClient();
    
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('event_date', { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }

    return data || [];
  }

  static async getEventBySlug(slug: string): Promise<Event | null> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch event');
    }

    return data || null;
  }

  static async getEventById(id: string): Promise<Event | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch event');
    }

    return data || null;
  }

  static async createEvent(input: z.infer<typeof CreateEventSchema>, organizerId?: string): Promise<Event> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: input.title,
        slug: input.slug,
        description: input.description,
        event_date: input.eventDate,
        location: input.location,
        featured_image_url: input.featuredImageUrl || null,
        organizer_id: organizerId || null,
        is_published: input.isPublished || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }

    return data;
  }

  static async updateEvent(id: string, input: z.infer<typeof UpdateEventSchema>): Promise<Event> {
    const supabase = await createClient();

    const updateData: Record<string, any> = {};
    if (input.title) updateData.title = input.title;
    if (input.slug) updateData.slug = input.slug;
    if (input.description) updateData.description = input.description;
    if (input.eventDate) updateData.event_date = input.eventDate;
    if (input.location) updateData.location = input.location;
    if (input.featuredImageUrl !== undefined) updateData.featured_image_url = input.featuredImageUrl;
    if (input.isPublished !== undefined) updateData.is_published = input.isPublished;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }

    return data;
  }

  static async deleteEvent(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  static async getUpcomingEvents(limit?: number): Promise<Event[]> {
    const supabase = createPublicClient();

    const now = new Date().toISOString();
    
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gt('event_date', now)
      .order('event_date', { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }

    return data || [];
  }

  static async getAllEventsForAdmin(): Promise<Event[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }

    return data || [];
  }
}
