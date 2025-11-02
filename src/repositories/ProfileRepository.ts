import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

/**
 * Repository pattern for Profile data access
 * Centralizes all profile-related database operations
 */
export class ProfileRepository {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching current profile:', error);
      return null;
    }

    return data;
  }

  async getProfileById(userId: string): Promise<Profile | null> {
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
  }

  async getProfilesByIds(userIds: string[]): Promise<Profile[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data || [];
  }

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
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
    let query = supabase
      .from('profiles')
      .select('username')
      .eq('username', username);

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data, error } = await query.single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - username is available
      return true;
    }

    return !data;
  }
}

export const profileRepository = new ProfileRepository();
