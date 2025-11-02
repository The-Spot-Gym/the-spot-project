import { supabase } from '@/integrations/supabase/client';
import type { WorkoutSession, Exercise, LeaderboardStats } from '@/types';

/**
 * Repository pattern for Workout data access
 * Centralizes all workout-related database operations
 */
export class WorkoutRepository {
  async getStats(): Promise<LeaderboardStats | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('leaderboard_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching stats:', error);
      return null;
    }

    return data;
  }

  async getRecentSessions(limit: number = 5): Promise<WorkoutSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent workouts:', error);
      return [];
    }

    return data || [];
  }

  async createSession(sessionDate: string, notes?: string): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        session_date: sessionDate,
        notes,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating workout session:', error);
      return null;
    }

    return data?.id || null;
  }

  async addExercises(sessionId: string, exercises: Exercise[]): Promise<{ success: boolean; error?: string }> {
    const exercisesToInsert = exercises.map(ex => ({
      session_id: sessionId,
      exercise_name: ex.exercise,
      sets: Number(ex.sets),
      reps: Number(ex.reps),
      weight: Number(ex.weight),
    }));

    const { error } = await supabase
      .from('workout_exercises')
      .insert(exercisesToInsert);

    if (error) {
      console.error('Error adding exercises:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}

export const workoutRepository = new WorkoutRepository();
