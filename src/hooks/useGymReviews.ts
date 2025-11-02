import { useState, useEffect } from 'react';
import { gymService } from '@/services/gymService';
import type { GymReview } from '@/types/api';

export const useGymReviews = (gymId: string | null) => {
  const [reviews, setReviews] = useState<GymReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const data = await gymService.getGymReviews(gymId);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [gymId]);

  return {
    reviews,
    loading,
    refetch: fetchReviews,
  };
};
