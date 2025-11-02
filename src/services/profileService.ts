import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

export const profileService = {
  /**
   * Get the current user's profile
   */
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Get a profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Get a profile by ID
   */
  async getProfileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Create a new profile
   */
  async createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('profiles')
      .insert(profile);

    if (error) {
      console.error('Error creating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
