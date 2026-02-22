import { supabase } from "@/integrations/supabase/client";
import type { Gym, GymMembership, Profile } from "@/types";
import type { GymReview } from "@/types/api";

export const gymService = {
  /**
   * Get gym membership status for current user
   */
  async getMembership(gymId: string): Promise<GymMembership | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('gym_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching membership:', error);
      return null;
    }

    return data;
  },

  /**
   * Join a gym
   */
  async joinGym(gymId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check if already an active member
    const { data: existing } = await supabase
      .from('gym_memberships')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (existing?.is_active) {
      return { success: true }; // Already a member, no-op
    }

    if (existing && !existing.is_active) {
      // Reactivate existing membership
      const { error } = await supabase
        .from('gym_memberships')
        .update({ is_active: true })
        .eq('id', existing.id);

      if (error) {
        console.error('Error reactivating gym membership:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    const { error } = await supabase
      .from('gym_memberships')
      .insert({
        user_id: user.id,
        gym_id: gymId,
      });

    if (error) {
      console.error('Error joining gym:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Leave a gym
   */
  async leaveGym(gymId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('gym_memberships')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('gym_id', gymId);

    if (error) {
      console.error('Error leaving gym:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Get gym members with their profiles
   */
  async getGymMembers(gymId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('gym_memberships')
      .select('user_id')
      .eq('gym_id', gymId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching gym members:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch profiles separately
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', data.map(m => m.user_id));

    if (profileError) {
      console.error('Error fetching member profiles:', profileError);
      return [];
    }

    return profiles || [];
  },

  /**
   * Get user's active gym memberships
   */
  async getUserGyms(): Promise<Gym[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('gym_memberships')
      .select('gym_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching user gyms:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch gyms separately
    const { data: gyms, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .in('id', data.map(m => m.gym_id));

    if (gymError) {
      console.error('Error fetching gym details:', gymError);
      return [];
    }

    return gyms || [];
  },

  /**
   * Get gym reviews (mock data from gym details)
   */
  async getGymReviews(gymId: string): Promise<GymReview[]> {
    // For now, return empty array as reviews come from Google Places API
    // This can be extended to fetch from a local reviews table if needed
    return [];
  },
};
