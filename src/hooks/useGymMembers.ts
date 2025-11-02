import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GymMemberData } from '@/types/api';

export const useGymMembers = (gymId: string | null) => {
  const [members, setMembers] = useState<GymMemberData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Fetch gym memberships
    const { data: memberships, error: memberError } = await supabase
      .from('gym_memberships')
      .select('user_id, joined_at')
      .eq('gym_id', gymId)
      .eq('is_active', true);

    if (memberError || !memberships || memberships.length === 0) {
      console.error('Error fetching gym members:', memberError);
      setMembers([]);
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', memberships.map(m => m.user_id));

    if (profileError) {
      console.error('Error fetching member profiles:', profileError);
      setMembers([]);
      setLoading(false);
      return;
    }

    // Combine memberships with profiles
    const membersWithProfiles: GymMemberData[] = memberships.map(membership => ({
      user_id: membership.user_id,
      joined_at: membership.joined_at,
      profiles: profiles?.find(p => p.user_id === membership.user_id) as any,
    }));

    setMembers(membersWithProfiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [gymId]);

  return {
    members,
    loading,
    refetch: fetchMembers,
  };
};
