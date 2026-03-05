
CREATE OR REPLACE FUNCTION public.get_gym_leaderboard(_gym_id uuid)
RETURNS TABLE (
  user_id uuid,
  personal_records jsonb,
  display_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ls.user_id,
    ls.personal_records,
    p.display_name,
    p.username,
    p.avatar_url
  FROM leaderboard_stats ls
  JOIN gym_memberships gm ON gm.user_id = ls.user_id
    AND gm.gym_id = _gym_id
    AND gm.is_active = true
  JOIN profiles p ON p.user_id = ls.user_id
  WHERE ls.personal_records IS NOT NULL;
$$;
