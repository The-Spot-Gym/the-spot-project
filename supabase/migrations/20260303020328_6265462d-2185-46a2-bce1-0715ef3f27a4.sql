
-- Allow friends to view each other's workout sessions
CREATE POLICY "Friends can view workout sessions"
ON public.workout_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.user_id = auth.uid() AND f.friend_id = workout_sessions.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = workout_sessions.user_id)
      )
  )
);

-- Allow friends to view workout exercises (via session ownership)
CREATE POLICY "Friends can view workout exercises"
ON public.workout_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    JOIN friendships f ON f.status = 'accepted'
      AND (
        (f.user_id = auth.uid() AND f.friend_id = ws.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = ws.user_id)
      )
    WHERE ws.id = workout_exercises.session_id
  )
);
