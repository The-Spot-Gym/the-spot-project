CREATE OR REPLACE FUNCTION public.get_partnered_gym_leaderboard(_gym_id uuid)
RETURNS TABLE(user_id uuid, personal_records jsonb, display_name text, username text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ls.user_id,
    ls.personal_records,
    p.display_name,
    p.username,
    p.avatar_url
  FROM leaderboard_stats ls
  JOIN partnered_gym_memberships pgm ON pgm.user_id = ls.user_id
    AND pgm.gym_id = _gym_id
    AND pgm.is_active = true
  JOIN profiles p ON p.user_id = ls.user_id
  WHERE ls.personal_records IS NOT NULL;
$$;