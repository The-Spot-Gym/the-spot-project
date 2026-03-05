
-- Allow friends to view each other's gym memberships
CREATE POLICY "Friends can view gym memberships"
ON public.gym_memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.user_id = auth.uid() AND f.friend_id = gym_memberships.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = gym_memberships.user_id)
      )
  )
);
