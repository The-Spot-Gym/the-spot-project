import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types';

interface GymDetailsData {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  phone_number?: string;
  website?: string;
  photo_url?: string;
  photos?: string[];
  reviews?: any[];
  opening_hours?: any;
  latitude: number;
  longitude: number;
}

interface GymMemberData {
  user_id: string;
  joined_at: string;
  profiles: Profile;
}

export const useGymDetails = (gymId: string | undefined) => {
  const { toast } = useToast();
  const [gymData, setGymData] = useState<GymDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [gymMembers, setGymMembers] = useState<GymMemberData[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchGymDetails();
    checkUser();
  }, [gymId]);

  useEffect(() => {
    if (hasJoined) {
      fetchGymMembers();
    }
  }, [hasJoined, gymId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user && gymId) {
      await checkMembership(user.id);
    }
  };

  const checkMembership = async (userId: string) => {
    if (!gymId) return;

    const { data } = await supabase
      .from('gym_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .maybeSingle();
    
    setHasJoined(!!data);
  };

  const fetchGymDetails = async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-gym-details', {
        body: { gymId },
      });

      if (error) throw error;

      setGymData(data.gym);
    } catch (error) {
      console.error('Error fetching gym details:', error);
      toast({
        title: "Error loading gym details",
        description: "Failed to load gym information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGymMembers = async () => {
    if (!gymId) return;
    
    const { data, error } = await supabase
      .from('gym_memberships')
      .select('user_id, joined_at')
      .eq('gym_id', gymId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching gym members:', error);
      return;
    }

    if (!data || data.length === 0) {
      setGymMembers([]);
      return;
    }

    // Fetch profiles separately
    const userIds = data.map(m => m.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    // Combine memberships with profiles
    const membersWithProfiles = data.map(membership => ({
      user_id: membership.user_id,
      joined_at: membership.joined_at,
      profiles: profiles?.find(p => p.user_id === membership.user_id) as Profile
    })).filter(m => m.profiles);

    setGymMembers(membersWithProfiles);
  };

  const joinGym = async () => {
    if (!currentUser || !gymId) {
      toast({
        title: "Error",
        description: "You must be logged in to join a gym.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('gym_memberships')
        .insert({
          user_id: currentUser.id,
          gym_id: gymId,
          is_active: true
        });

      if (error) throw error;

      setHasJoined(true);
      toast({
        title: "Success!",
        description: `You've joined ${gymData?.name}!`,
      });
      return true;
    } catch (error: any) {
      console.error('Error joining gym:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join gym. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveGym = async () => {
    if (!currentUser || !gymId) return false;

    try {
      const { error } = await supabase
        .from('gym_memberships')
        .update({ is_active: false })
        .eq('user_id', currentUser.id)
        .eq('gym_id', gymId);

      if (error) throw error;

      setHasJoined(false);
      toast({
        title: "Left gym",
        description: `You've left ${gymData?.name}`,
      });
      return true;
    } catch (error: any) {
      console.error('Error leaving gym:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to leave gym. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    gymData,
    loading,
    hasJoined,
    gymMembers,
    currentUser,
    joinGym,
    leaveGym,
    refetch: fetchGymDetails,
  };
};
