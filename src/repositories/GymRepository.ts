import { supabase } from '@/integrations/supabase/client';
import type { Gym, GymMembership } from '@/types';
import type { GymMemberData, GymReview } from '@/types/api';

/**
 * Repository pattern for Gym data access
 * Centralizes all gym-related database operations
 */
export class GymRepository {
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
  }

  async joinGym(gymId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

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
  }

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
  }

  async getGymMembers(gymId: string): Promise<GymMemberData[]> {
    const { data: memberships, error: memberError } = await supabase
      .from('gym_memberships')
      .select('user_id, joined_at')
      .eq('gym_id', gymId)
      .eq('is_active', true);

    if (memberError || !memberships || memberships.length === 0) {
      console.error('Error fetching gym members:', memberError);
      return [];
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', memberships.map(m => m.user_id));

    if (profileError) {
      console.error('Error fetching member profiles:', profileError);
      return [];
    }

    return memberships.map(membership => ({
      user_id: membership.user_id,
      joined_at: membership.joined_at,
      profiles: profiles?.find(p => p.user_id === membership.user_id) as any,
    }));
  }

  async getUserGyms(): Promise<Gym[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('gym_memberships')
      .select('gym_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      console.error('Error fetching user gyms:', error);
      return [];
    }

    const { data: gyms, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .in('id', data.map(m => m.gym_id));

    if (gymError) {
      console.error('Error fetching gym details:', gymError);
      return [];
    }

    return gyms || [];
  }

  async getGymReviews(gymId: string): Promise<GymReview[]> {
    // For now, return empty array as reviews come from Google Places API
    return [];
  }
}

export const gymRepository = new GymRepository();
