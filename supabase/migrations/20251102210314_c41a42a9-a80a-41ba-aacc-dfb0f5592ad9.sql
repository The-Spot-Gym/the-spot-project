-- Function to update leaderboard stats when workout exercises are added
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats_from_workout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_total_weight numeric;
  v_total_workouts integer;
  v_pr_bench numeric;
  v_pr_squat numeric;
  v_pr_deadlift numeric;
  v_favorite_exercise text;
  v_exercise_counts jsonb;
BEGIN
  -- Get the user_id from the workout session
  SELECT user_id INTO v_user_id
  FROM workout_sessions
  WHERE id = NEW.session_id;

  -- Calculate total weight lifted across all workouts
  SELECT COALESCE(SUM(we.weight * we.reps * we.sets), 0)
  INTO v_total_weight
  FROM workout_exercises we
  JOIN workout_sessions ws ON ws.id = we.session_id
  WHERE ws.user_id = v_user_id;

  -- Count total workout sessions
  SELECT COUNT(DISTINCT ws.id)
  INTO v_total_workouts
  FROM workout_sessions ws
  WHERE ws.user_id = v_user_id;

  -- Calculate personal records for big three lifts
  SELECT COALESCE(MAX(weight), 0)
  INTO v_pr_bench
  FROM workout_exercises we
  JOIN workout_sessions ws ON ws.id = we.session_id
  WHERE ws.user_id = v_user_id
    AND LOWER(we.exercise_name) LIKE '%bench press%';

  SELECT COALESCE(MAX(weight), 0)
  INTO v_pr_squat
  FROM workout_exercises we
  JOIN workout_sessions ws ON ws.id = we.session_id
  WHERE ws.user_id = v_user_id
    AND LOWER(we.exercise_name) LIKE '%squat%'
    AND LOWER(we.exercise_name) NOT LIKE '%goblet%'
    AND LOWER(we.exercise_name) NOT LIKE '%bulgarian%';

  SELECT COALESCE(MAX(weight), 0)
  INTO v_pr_deadlift
  FROM workout_exercises we
  JOIN workout_sessions ws ON ws.id = we.session_id
  WHERE ws.user_id = v_user_id
    AND LOWER(we.exercise_name) LIKE '%deadlift%';

  -- Find favorite exercise (most frequently performed)
  SELECT we.exercise_name
  INTO v_favorite_exercise
  FROM workout_exercises we
  JOIN workout_sessions ws ON ws.id = we.session_id
  WHERE ws.user_id = v_user_id
  GROUP BY we.exercise_name
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Build personal records JSON
  v_exercise_counts := jsonb_build_object(
    'bench_press', v_pr_bench,
    'squat', v_pr_squat,
    'deadlift', v_pr_deadlift
  );

  -- Upsert leaderboard stats
  INSERT INTO leaderboard_stats (
    user_id,
    total_workouts,
    total_weight_lifted,
    favorite_exercise,
    personal_records,
    updated_at
  )
  VALUES (
    v_user_id,
    v_total_workouts,
    v_total_weight,
    v_favorite_exercise,
    v_exercise_counts,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_workouts = EXCLUDED.total_workouts,
    total_weight_lifted = EXCLUDED.total_weight_lifted,
    favorite_exercise = EXCLUDED.favorite_exercise,
    personal_records = EXCLUDED.personal_records,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger for workout_exercises INSERT
DROP TRIGGER IF EXISTS update_leaderboard_on_exercise_insert ON workout_exercises;
CREATE TRIGGER update_leaderboard_on_exercise_insert
  AFTER INSERT ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_stats_from_workout();

-- Create trigger for workout_exercises UPDATE (in case weights are corrected)
DROP TRIGGER IF EXISTS update_leaderboard_on_exercise_update ON workout_exercises;
CREATE TRIGGER update_leaderboard_on_exercise_update
  AFTER UPDATE ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_stats_from_workout();

-- Create trigger for workout_exercises DELETE (in case workouts are removed)
DROP TRIGGER IF EXISTS update_leaderboard_on_exercise_delete ON workout_exercises;
CREATE TRIGGER update_leaderboard_on_exercise_delete
  AFTER DELETE ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_stats_from_workout();
