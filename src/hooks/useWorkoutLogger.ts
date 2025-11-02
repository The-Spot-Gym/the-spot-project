import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Exercise } from '@/types/components';

export const useWorkoutLogger = (userId: string | undefined) => {
  const { toast } = useToast();
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    exercise: "",
    weight: "",
    reps: "",
    sets: ""
  });
  const [exercisesInSession, setExercisesInSession] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  const addExerciseToSession = () => {
    if (!currentExercise.exercise || !currentExercise.weight || !currentExercise.reps || !currentExercise.sets) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to add an exercise.",
        variant: "destructive",
      });
      return false;
    }

    setExercisesInSession([...exercisesInSession, { ...currentExercise }]);
    setCurrentExercise({ exercise: "", weight: "", reps: "", sets: "" });
    toast({
      title: "Exercise added!",
      description: `${currentExercise.exercise} added to your workout.`,
    });
    return true;
  };

  const removeExerciseFromSession = (index: number) => {
    setExercisesInSession(exercisesInSession.filter((_, i) => i !== index));
  };

  const logWorkout = async (): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to log workouts.",
        variant: "destructive",
      });
      return false;
    }

    if (exercisesInSession.length === 0) {
      toast({
        title: "No exercises added",
        description: "Please add at least one exercise to your workout.",
        variant: "destructive",
      });
      return false;
    }

    setSaving(true);
    try {
      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          session_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Insert all exercises (triggers will auto-update leaderboard stats)
      const exercisesToInsert = exercisesInSession.map(ex => ({
        session_id: session.id,
        exercise_name: ex.exercise,
        weight: parseFloat(ex.weight),
        reps: parseInt(ex.reps),
        sets: parseInt(ex.sets)
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      toast({
        title: "Workout logged!",
        description: `Great job! Logged ${exercisesInSession.length} exercises! 💪`,
      });

      // Reset form
      setExercisesInSession([]);
      setCurrentExercise({ exercise: "", weight: "", reps: "", sets: "" });
      return true;
    } catch (error: any) {
      console.error('Error logging workout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log workout. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    currentExercise,
    setCurrentExercise,
    exercisesInSession,
    saving,
    addExerciseToSession,
    removeExerciseFromSession,
    logWorkout,
  };
};
