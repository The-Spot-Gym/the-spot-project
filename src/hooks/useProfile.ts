import { useState, useEffect } from 'react';
import { profileService } from '@/services/profileService';
import type { Profile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    setLoading(true);
    const data = await profileService.getCurrentProfile();
    setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    const result = await profileService.updateProfile(updates);
    
    if (result.success) {
      await fetchProfile();
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update profile",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    profile,
    loading,
    refetch: fetchProfile,
    updateProfile,
  };
};
