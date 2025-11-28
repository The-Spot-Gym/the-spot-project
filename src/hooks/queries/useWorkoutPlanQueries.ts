import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutPlanRepository } from '@/repositories/WorkoutPlanRepository';
import type { CreateWorkoutPlanInput, UpdateWorkoutPlanInput } from '@/types/workoutPlan';

const QUERY_KEYS = {
  all: ['workoutPlans'] as const,
  detail: (id: string) => ['workoutPlans', id] as const,
};

export const useWorkoutPlansQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: () => workoutPlanRepository.getAll(),
  });
};

export const useWorkoutPlanQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => workoutPlanRepository.getById(id),
    enabled: !!id,
  });
};

export const useCreateWorkoutPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkoutPlanInput) => workoutPlanRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

export const useUpdateWorkoutPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkoutPlanInput }) =>
      workoutPlanRepository.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.id) });
    },
  });
};

export const useDeleteWorkoutPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workoutPlanRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};
