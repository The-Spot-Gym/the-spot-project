-- Create workout plans table
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout plan exercises table
CREATE TABLE public.workout_plan_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight NUMERIC NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_plans
CREATE POLICY "Users can view their own workout plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workout_plan_exercises
CREATE POLICY "Users can view exercises in their own plans"
  ON public.workout_plan_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises in their own plans"
  ON public.workout_plan_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in their own plans"
  ON public.workout_plan_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises in their own plans"
  ON public.workout_plan_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE workout_plans.id = workout_plan_exercises.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX idx_workout_plan_exercises_plan_id ON public.workout_plan_exercises(plan_id);

-- Add trigger for updated_at
CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();