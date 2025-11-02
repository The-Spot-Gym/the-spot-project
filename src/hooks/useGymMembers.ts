import { useState, useEffect } from 'react';
import { gymService } from '@/services/gymService';
import type { Profile } from '@/types';

export const useGymMembers = (gymId: string | null) => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const data = await gymService.getGymMembers(gymId);
    setMembers(data);
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
