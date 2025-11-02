import { supabase } from "@/integrations/supabase/client";
import type { Friendship, Profile } from "@/types";

export const friendshipService = {
  /**
   * Get friends for current user
   */
  async getFriends(): Promise<Profile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch profiles separately
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', data.map(f => f.friend_id));

    if (profileError) {
      console.error('Error fetching friend profiles:', profileError);
      return [];
    }

    return profiles || [];
  },

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(): Promise<Friendship[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }

    return (data || []) as Friendship[];
  },

  /**
   * Get sent friend requests
   */
  async getSentRequests(): Promise<Friendship[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching sent requests:', error);
      return [];
    }

    return (data || []) as Friendship[];
  },

  /**
   * Send friend request
   */
  async sendRequest(friendId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

    if (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Accept friend request
   */
  async acceptRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Update the original request
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error accepting friend request:', updateError);
      return { success: false, error: updateError.message };
    }

    // Get the original request to create reciprocal friendship
    const { data: request } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', requestId)
      .single();

    if (request) {
      // Create reciprocal friendship
      await supabase
        .from('friendships')
        .insert({
          user_id: request.friend_id,
          friend_id: request.user_id,
          status: 'accepted',
        });
    }

    return { success: true };
  },

  /**
   * Reject friend request
   */
  async rejectRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting friend request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
