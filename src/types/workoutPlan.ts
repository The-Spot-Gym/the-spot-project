export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanExercise {
  id: string;
  plan_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  order_index: number;
  created_at: string;
}

export interface WorkoutPlanWithExercises extends WorkoutPlan {
  exercises: WorkoutPlanExercise[];
}

export interface CreateWorkoutPlanInput {
  name: string;
  description?: string;
  exercises: {
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
    order_index: number;
  }[];
}

export interface UpdateWorkoutPlanInput {
  name?: string;
  description?: string;
  exercises?: {
    id?: string;
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
    order_index: number;
  }[];
}
