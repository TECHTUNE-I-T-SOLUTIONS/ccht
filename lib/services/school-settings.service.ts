import { createClient } from '@/lib/supabase/server';

export type SchoolSetting = {
  id: string;
  key: string;
  value: string;
  updated_at: string;
};

export class SchoolSettingsService {
  static async getSetting(key: string): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('school_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching setting:', error);
      throw new Error('Failed to fetch setting');
    }

    return data?.value || null;
  }

  static async getAllSettings(): Promise<Record<string, string>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('school_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching settings:', error);
      throw new Error('Failed to fetch settings');
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((setting) => {
      settings[setting.key] = setting.value;
    });

    return settings;
  }

  static async setSetting(key: string, value: string): Promise<SchoolSetting> {
    const supabase = await createClient();

    // Try to update first
    const { data: existingData } = await supabase
      .from('school_settings')
      .select('id')
      .eq('key', key)
      .single();

    if (existingData) {
      // Update existing
      const { data, error } = await supabase
        .from('school_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error('Error updating setting:', error);
        throw new Error('Failed to update setting');
      }

      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('school_settings')
        .insert({ key, value })
        .select()
        .single();

      if (error) {
        console.error('Error creating setting:', error);
        throw new Error('Failed to create setting');
      }

      return data;
    }
  }

  static async getSchoolInfo() {
    const settings = await this.getAllSettings();

    return {
      name: settings['school_name'] || 'Covenant College of Health Technology',
      email: settings['school_email'] || 'info@covenantcollegeofhealthtech.com.ng',
      phone: settings['school_phone'] || '+234 7066 3698 18',
      address: settings['school_address'] || 'Igbon, Oyo, Nigeria',
      about: settings['school_about'] || '',
      mission: settings['school_mission'] || '',
      vision: settings['school_vision'] || '',
      logo: settings['school_logo'] || null,
    };
  }

  static async updateSchoolInfo(info: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(info)) {
      await this.setSetting(`school_${key}`, value);
    }
  }
}
