import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileRepository } from '@/repositories/ProfileRepository';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types';

/**
 * React Query hook for fetching current user profile
 */
export const useProfileQuery = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => profileRepository.getCurrentProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => profileRepository.updateProfile(updates),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  return {
    profile: query.data,
    loading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    refetch: query.refetch,
  };
};

/**
 * React Query hook for fetching a specific user profile by ID
 */
export const useProfileByIdQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => userId ? profileRepository.getProfileById(userId) : null,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
