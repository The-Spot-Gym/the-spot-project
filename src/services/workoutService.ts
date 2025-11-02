import { supabase } from "@/integrations/supabase/client";
import type { WorkoutSession, WorkoutExercise, LeaderboardStats } from "@/types";

export const workoutService = {
  /**
   * Get recent workout sessions for current user
   */
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
      console.error('Error fetching workout sessions:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get exercises for a workout session
   */
  async getSessionExercises(sessionId: string): Promise<WorkoutExercise[]> {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching workout exercises:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Create a new workout session
   */
  async createSession(notes?: string): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        session_date: new Date().toISOString().split('T')[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout session:', error);
      return { success: false, error: error.message };
    }

    return { success: true, sessionId: data.id };
  },

  /**
   * Add exercise to a workout session
   */
  async addExercise(exercise: Omit<WorkoutExercise, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('workout_exercises')
      .insert(exercise);

    if (error) {
      console.error('Error adding exercise:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Get leaderboard stats for current user
   */
  async getStats(): Promise<LeaderboardStats | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('leaderboard_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching leaderboard stats:', error);
      return null;
    }

    return data;
  },

  /**
   * Update leaderboard stats
   */
  async updateStats(updates: Partial<LeaderboardStats>): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('leaderboard_stats')
      .upsert({
        user_id: user.id,
        ...updates,
      });

    if (error) {
      console.error('Error updating leaderboard stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
