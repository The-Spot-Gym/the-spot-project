import { supabase } from '@/integrations/supabase/client';
import type { WorkoutPlan, WorkoutPlanExercise, WorkoutPlanWithExercises, CreateWorkoutPlanInput, UpdateWorkoutPlanInput } from '@/types/workoutPlan';

export class WorkoutPlanRepository {
  async getAll(): Promise<WorkoutPlanWithExercises[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (plansError) {
      console.error('Error fetching workout plans:', plansError);
      return [];
    }

    if (!plans || plans.length === 0) return [];

    const planIds = plans.map(p => p.id);
    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_plan_exercises')
      .select('*')
      .in('plan_id', planIds)
      .order('order_index', { ascending: true });

    if (exercisesError) {
      console.error('Error fetching plan exercises:', exercisesError);
      return plans.map(p => ({ ...p, exercises: [] }));
    }

    return plans.map(plan => ({
      ...plan,
      exercises: exercises?.filter(e => e.plan_id === plan.id) || []
    }));
  }

  async getById(id: string): Promise<WorkoutPlanWithExercises | null> {
    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (planError || !plan) {
      console.error('Error fetching workout plan:', planError);
      return null;
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_plan_exercises')
      .select('*')
      .eq('plan_id', id)
      .order('order_index', { ascending: true });

    if (exercisesError) {
      console.error('Error fetching plan exercises:', exercisesError);
      return { ...plan, exercises: [] };
    }

    return { ...plan, exercises: exercises || [] };
  }

  async create(input: CreateWorkoutPlanInput): Promise<{ success: boolean; planId?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description,
      })
      .select('id')
      .single();

    if (planError || !plan) {
      console.error('Error creating workout plan:', planError);
      return { success: false, error: planError?.message || 'Failed to create plan' };
    }

    if (input.exercises.length > 0) {
      const exercisesToInsert = input.exercises.map(ex => ({
        plan_id: plan.id,
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        order_index: ex.order_index,
      }));

      const { error: exercisesError } = await supabase
        .from('workout_plan_exercises')
        .insert(exercisesToInsert);

      if (exercisesError) {
        console.error('Error adding exercises to plan:', exercisesError);
        return { success: false, error: exercisesError.message };
      }
    }

    return { success: true, planId: plan.id };
  }

  async update(id: string, input: UpdateWorkoutPlanInput): Promise<{ success: boolean; error?: string }> {
    if (input.name !== undefined || input.description !== undefined) {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;

      const { error: planError } = await supabase
        .from('workout_plans')
        .update(updateData)
        .eq('id', id);

      if (planError) {
        console.error('Error updating workout plan:', planError);
        return { success: false, error: planError.message };
      }
    }

    if (input.exercises) {
      const { error: deleteError } = await supabase
        .from('workout_plan_exercises')
        .delete()
        .eq('plan_id', id);

      if (deleteError) {
        console.error('Error deleting old exercises:', deleteError);
        return { success: false, error: deleteError.message };
      }

      if (input.exercises.length > 0) {
        const exercisesToInsert = input.exercises.map(ex => ({
          plan_id: id,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          order_index: ex.order_index,
        }));

        const { error: insertError } = await supabase
          .from('workout_plan_exercises')
          .insert(exercisesToInsert);

        if (insertError) {
          console.error('Error adding new exercises:', insertError);
          return { success: false, error: insertError.message };
        }
      }
    }

    return { success: true };
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}

export const workoutPlanRepository = new WorkoutPlanRepository();
