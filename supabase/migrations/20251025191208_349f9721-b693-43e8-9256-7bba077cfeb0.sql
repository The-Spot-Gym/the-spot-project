-- Create workout_sessions table to group exercises
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_sessions
CREATE POLICY "Users can create their own workout sessions"
ON workout_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout sessions"
ON workout_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions"
ON workout_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions"
ON workout_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Create workout_exercises table for individual exercises within a session
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  weight numeric NOT NULL,
  reps integer NOT NULL,
  sets integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_exercises
CREATE POLICY "Users can create exercises in their own sessions"
ON workout_exercises FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_sessions
    WHERE workout_sessions.id = workout_exercises.session_id
    AND workout_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view exercises in their own sessions"
ON workout_exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions
    WHERE workout_sessions.id = workout_exercises.session_id
    AND workout_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update exercises in their own sessions"
ON workout_exercises FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions
    WHERE workout_sessions.id = workout_exercises.session_id
    AND workout_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete exercises in their own sessions"
ON workout_exercises FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions
    WHERE workout_sessions.id = workout_exercises.session_id
    AND workout_sessions.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_session_date ON workout_sessions(session_date);
CREATE INDEX idx_workout_exercises_session_id ON workout_exercises(session_id);