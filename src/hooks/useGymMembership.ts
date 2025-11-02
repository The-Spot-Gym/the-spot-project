import { useState, useEffect } from 'react';
import { gymService } from '@/services/gymService';
import type { GymMembership } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useGymMembership = (gymId: string | null) => {
  const [membership, setMembership] = useState<GymMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMembership = async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const data = await gymService.getMembership(gymId);
    setMembership(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembership();
  }, [gymId]);

  const joinGym = async () => {
    if (!gymId) return false;
    
    const result = await gymService.joinGym(gymId);
    
    if (result.success) {
      await fetchMembership();
      toast({
        title: "Joined gym",
        description: "You have successfully joined this gym!",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to join gym",
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveGym = async () => {
    if (!gymId) return false;
    
    const result = await gymService.leaveGym(gymId);
    
    if (result.success) {
      await fetchMembership();
      toast({
        title: "Left gym",
        description: "You have left this gym.",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to leave gym",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    membership,
    isMember: !!membership,
    loading,
    joinGym,
    leaveGym,
    refetch: fetchMembership,
  };
};
