import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutRepository } from '@/repositories/WorkoutRepository';
import { queryKeys } from '@/lib/queryClient';
import type { Exercise } from '@/types';

/**
 * React Query hook for workout stats
 */
export const useWorkoutStatsQuery = () => {
  return useQuery({
    queryKey: queryKeys.workouts.stats,
    queryFn: () => workoutRepository.getStats(),
  });
};

/**
 * React Query hook for recent workout sessions
 */
export const useRecentWorkoutsQuery = (limit: number = 5) => {
  return useQuery({
    queryKey: queryKeys.workouts.recent(limit),
    queryFn: () => workoutRepository.getRecentSessions(limit),
  });
};

/**
 * React Query hook for creating workout sessions
 */
export const useCreateWorkoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sessionDate, 
      notes, 
      exercises 
    }: { 
      sessionDate: string; 
      notes?: string; 
      exercises: Exercise[];
    }) => {
      const sessionId = await workoutRepository.createSession(sessionDate, notes);
      if (!sessionId) {
        throw new Error('Failed to create workout session');
      }
      
      const result = await workoutRepository.addExercises(sessionId, exercises);
      if (!result.success) {
        throw new Error(result.error || 'Failed to add exercises');
      }
      
      return { sessionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.recent(5) });
    },
  });
};
