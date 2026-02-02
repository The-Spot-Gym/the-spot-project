-- Add privacy settings column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_on_leaderboard boolean NOT NULL DEFAULT false;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Leaderboard stats are viewable by everyone" ON public.leaderboard_stats;

-- Create new policy: Users can view their own stats, friends' stats (if opted in), or public stats (if opted in)
CREATE POLICY "Users can view allowed leaderboard stats"
ON public.leaderboard_stats
FOR SELECT
USING (
  -- Always allow viewing own stats
  auth.uid() = user_id
  OR
  -- Allow viewing stats of users who have opted in to public leaderboard
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = leaderboard_stats.user_id
    AND p.show_on_leaderboard = true
  )
  OR
  -- Allow viewing stats of accepted friends (regardless of opt-in, since they're friends)
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = auth.uid() AND f.friend_id = leaderboard_stats.user_id)
      OR
      (f.friend_id = auth.uid() AND f.user_id = leaderboard_stats.user_id)
    )
  )
);