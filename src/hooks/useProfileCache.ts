import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

// Simple in-memory cache for profiles
const profileCache = new Map<string, { profile: Profile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProfileCache = (userId: string | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProfile(cached.profile);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      profileCache.set(userId, { profile: data, timestamp: Date.now() });
      setProfile(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
};

// Utility to invalidate cache
export const invalidateProfileCache = (userId: string) => {
  profileCache.delete(userId);
};

// Utility to clear all cache
export const clearProfileCache = () => {
  profileCache.clear();
};
