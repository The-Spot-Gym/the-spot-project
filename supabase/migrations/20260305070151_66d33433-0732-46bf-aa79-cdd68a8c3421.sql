
CREATE OR REPLACE FUNCTION public.get_comprehensive_friend_recommendations(current_user_id uuid, limit_count integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, shared_gyms_count bigint, common_gym_names text[], mutual_friends_count bigint, recommendation_source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  IF current_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only query own recommendations';
  END IF;

  RETURN QUERY
  WITH
  existing_friends AS (
    SELECT f.friend_id as fid FROM friendships f WHERE f.user_id = current_user_id
    UNION
    SELECT f.user_id as fid FROM friendships f WHERE f.friend_id = current_user_id
  ),
  gym_based AS (
    SELECT 
      p.user_id, p.username, p.display_name, p.avatar_url,
      COUNT(DISTINCT gm2.gym_id) as shared_gyms_count,
      ARRAY_AGG(DISTINCT g.name) as common_gym_names,
      0::bigint as mutual_friends_count,
      'gym'::text as recommendation_source,
      0::double precision as distance_miles
    FROM gym_memberships gm1
    JOIN gym_memberships gm2 ON gm1.gym_id = gm2.gym_id AND gm1.user_id != gm2.user_id
    JOIN profiles p ON p.user_id = gm2.user_id
    JOIN gyms g ON g.id = gm2.gym_id
    WHERE gm1.user_id = current_user_id
      AND gm1.is_active = true
      AND gm2.is_active = true
      AND gm2.user_id != current_user_id
      AND gm2.user_id NOT IN (SELECT fid FROM existing_friends)
    GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ),
  mutual_friends_based AS (
    SELECT 
      p.user_id, p.username, p.display_name, p.avatar_url,
      0::bigint as shared_gyms_count,
      ARRAY[]::text[] as common_gym_names,
      COUNT(DISTINCT f2.user_id) as mutual_friends_count,
      'mutual_friend'::text as recommendation_source,
      0::double precision as distance_miles
    FROM friendships f1
    JOIN friendships f2 ON f1.friend_id = f2.user_id AND f1.status = 'accepted' AND f2.status = 'accepted'
    JOIN profiles p ON p.user_id = f2.friend_id
    WHERE f1.user_id = current_user_id
      AND f2.friend_id != current_user_id
      AND f2.friend_id NOT IN (SELECT fid FROM existing_friends)
    GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ),
  proximity_based AS (
    SELECT 
      p.user_id, p.username, p.display_name, p.avatar_url,
      0::bigint as shared_gyms_count,
      ARRAY[]::text[] as common_gym_names,
      0::bigint as mutual_friends_count,
      'nearby'::text as recommendation_source,
      MIN(
        3959 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(g1.latitude)) * cos(radians(g2.latitude)) *
            cos(radians(g2.longitude) - radians(g1.longitude)) +
            sin(radians(g1.latitude)) * sin(radians(g2.latitude))
          ))
        )
      ) as distance_miles
    FROM gym_memberships gm1
    JOIN gyms g1 ON g1.id = gm1.gym_id
    JOIN gyms g2 ON g1.id != g2.id
    JOIN gym_memberships gm2 ON gm2.gym_id = g2.id AND gm2.user_id != gm1.user_id
    JOIN profiles p ON p.user_id = gm2.user_id
    WHERE gm1.user_id = current_user_id
      AND gm1.is_active = true
      AND gm2.is_active = true
      AND gm2.user_id != current_user_id
      AND gm2.user_id NOT IN (SELECT fid FROM existing_friends)
      AND gm2.user_id NOT IN (SELECT gb.user_id FROM gym_based gb)
      AND gm2.user_id NOT IN (SELECT mf.user_id FROM mutual_friends_based mf)
    GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ),
  combined AS (
    SELECT * FROM gym_based
    UNION ALL
    SELECT * FROM mutual_friends_based WHERE user_id NOT IN (SELECT user_id FROM gym_based)
    UNION ALL  
    SELECT * FROM proximity_based
  )
  SELECT 
    c.user_id, c.username, c.display_name, c.avatar_url,
    c.shared_gyms_count,
    COALESCE(c.common_gym_names, ARRAY[]::text[]) as common_gym_names,
    c.mutual_friends_count,
    c.recommendation_source
  FROM combined c
  ORDER BY 
    (c.shared_gyms_count + c.mutual_friends_count) DESC,
    c.distance_miles ASC,
    c.recommendation_source ASC
  LIMIT limit_count;
END;
$$;
