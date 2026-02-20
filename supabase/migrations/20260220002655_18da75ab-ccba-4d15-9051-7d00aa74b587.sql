-- Create table to track gym search rate limiting
CREATE TABLE public.gym_search_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  searched_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_search_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search logs"
  ON public.gym_search_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search logs"
  ON public.gym_search_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient rate limit queries
CREATE INDEX idx_gym_search_log_user_date ON public.gym_search_log (user_id, searched_at);

-- Add auth.uid() validation to RPC functions

CREATE OR REPLACE FUNCTION public.get_comprehensive_friend_recommendations(current_user_id uuid, limit_count integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, shared_gyms_count bigint, common_gym_names text[], mutual_friends_count bigint, recommendation_source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization check
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
      COUNT(DISTINCT gv2.gym_id) as shared_gyms_count,
      ARRAY_AGG(DISTINCT g.name) as common_gym_names,
      0::bigint as mutual_friends_count,
      'gym'::text as recommendation_source
    FROM gym_visits gv1
    JOIN gym_visits gv2 ON gv1.gym_id = gv2.gym_id AND gv1.user_id != gv2.user_id
    JOIN profiles p ON p.user_id = gv2.user_id
    JOIN gyms g ON g.id = gv2.gym_id
    WHERE gv1.user_id = current_user_id
      AND gv2.user_id != current_user_id
      AND gv2.user_id NOT IN (SELECT fid FROM existing_friends)
    GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ),
  mutual_friends_based AS (
    SELECT 
      p.user_id, p.username, p.display_name, p.avatar_url,
      0::bigint as shared_gyms_count,
      ARRAY[]::text[] as common_gym_names,
      COUNT(DISTINCT f2.user_id) as mutual_friends_count,
      'mutual_friend'::text as recommendation_source
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
      'nearby'::text as recommendation_source
    FROM gym_visits gv1
    JOIN gyms g1 ON g1.id = gv1.gym_id
    JOIN gyms g2 ON 
      (3959 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(g1.latitude)) * cos(radians(g2.latitude)) *
          cos(radians(g2.longitude) - radians(g1.longitude)) +
          sin(radians(g1.latitude)) * sin(radians(g2.latitude))
        ))
      )) <= 20
      AND g1.id != g2.id
    JOIN gym_visits gv2 ON gv2.gym_id = g2.id AND gv2.user_id != gv1.user_id
    JOIN profiles p ON p.user_id = gv2.user_id
    WHERE gv1.user_id = current_user_id
      AND gv2.user_id != current_user_id
      AND gv2.user_id NOT IN (SELECT fid FROM existing_friends)
    GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ),
  combined AS (
    SELECT * FROM gym_based
    UNION ALL
    SELECT * FROM mutual_friends_based WHERE user_id NOT IN (SELECT user_id FROM gym_based)
    UNION ALL  
    SELECT * FROM proximity_based WHERE user_id NOT IN (SELECT user_id FROM gym_based) AND user_id NOT IN (SELECT user_id FROM mutual_friends_based)
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
    c.recommendation_source ASC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_gym_based_friend_recommendations(current_user_id uuid, limit_count integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, shared_gyms_count bigint, common_gym_names text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization check
  IF current_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only query own recommendations';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id, p.username, p.display_name, p.avatar_url,
    COUNT(DISTINCT gv2.gym_id) as shared_gyms_count,
    ARRAY_AGG(DISTINCT g.name) as common_gym_names
  FROM gym_visits gv1
  JOIN gym_visits gv2 ON gv1.gym_id = gv2.gym_id AND gv1.user_id != gv2.user_id
  JOIN profiles p ON p.user_id = gv2.user_id
  JOIN gyms g ON g.id = gv2.gym_id
  WHERE gv1.user_id = current_user_id
    AND gv2.user_id != current_user_id
    AND NOT EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.user_id = current_user_id AND f.friend_id = gv2.user_id)
        OR
        (f.friend_id = current_user_id AND f.user_id = gv2.user_id)
      )
    )
  GROUP BY p.user_id, p.username, p.display_name, p.avatar_url
  ORDER BY shared_gyms_count DESC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conversation_uuid uuid, reader_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization check
  IF reader_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only mark own messages as read';
  END IF;

  UPDATE messages
  SET read_at = now()
  WHERE conversation_id = conversation_uuid
    AND sender_id != reader_user_id
    AND read_at IS NULL;
END;
$function$;