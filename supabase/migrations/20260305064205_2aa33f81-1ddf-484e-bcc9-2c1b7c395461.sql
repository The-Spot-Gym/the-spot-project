
-- Allow friends to view each other's workout plans
CREATE POLICY "Friends can view workout plans"
ON public.workout_plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.user_id = auth.uid() AND f.friend_id = workout_plans.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = workout_plans.user_id)
      )
  )
);

-- Allow friends to view workout plan exercises via the plan owner being a friend
CREATE POLICY "Friends can view workout plan exercises"
ON public.workout_plan_exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workout_plans wp
    JOIN friendships f ON f.status = 'accepted'
      AND (
        (f.user_id = auth.uid() AND f.friend_id = wp.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = wp.user_id)
      )
    WHERE wp.id = workout_plan_exercises.plan_id
  )
);
