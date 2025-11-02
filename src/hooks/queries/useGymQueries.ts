import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gymRepository } from '@/repositories/GymRepository';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * React Query hook for gym membership
 */
export const useGymMembershipQuery = (gymId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.gyms.membership(gymId || ''),
    queryFn: () => gymId ? gymRepository.getMembership(gymId) : null,
    enabled: !!gymId,
  });

  const joinMutation = useMutation({
    mutationFn: (gymId: string) => gymRepository.joinGym(gymId),
    onSuccess: (result, gymId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.membership(gymId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.members(gymId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.userGyms });
        toast({
          title: "Joined gym",
          description: "You have successfully joined this gym!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to join gym",
          variant: "destructive",
        });
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (gymId: string) => gymRepository.leaveGym(gymId),
    onSuccess: (result, gymId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.membership(gymId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.members(gymId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.gyms.userGyms });
        toast({
          title: "Left gym",
          description: "You have left this gym.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to leave gym",
          variant: "destructive",
        });
      }
    },
  });

  return {
    membership: query.data,
    isMember: !!query.data,
    loading: query.isLoading,
    joinGym: () => gymId && joinMutation.mutate(gymId),
    leaveGym: () => gymId && leaveMutation.mutate(gymId),
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
  };
};

/**
 * React Query hook for gym members
 */
export const useGymMembersQuery = (gymId: string | null) => {
  return useQuery({
    queryKey: queryKeys.gyms.members(gymId || ''),
    queryFn: () => gymId ? gymRepository.getGymMembers(gymId) : [],
    enabled: !!gymId,
  });
};

/**
 * React Query hook for gym reviews
 */
export const useGymReviewsQuery = (gymId: string | null) => {
  return useQuery({
    queryKey: queryKeys.gyms.reviews(gymId || ''),
    queryFn: () => gymId ? gymRepository.getGymReviews(gymId) : [],
    enabled: !!gymId,
  });
};

/**
 * React Query hook for user's gyms
 */
export const useUserGymsQuery = () => {
  return useQuery({
    queryKey: queryKeys.gyms.userGyms,
    queryFn: () => gymRepository.getUserGyms(),
  });
};
