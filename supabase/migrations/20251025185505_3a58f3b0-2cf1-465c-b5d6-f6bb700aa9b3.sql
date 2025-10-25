-- Feature 7: Workout streak calculation
-- Create a function to calculate and update streaks
CREATE OR REPLACE FUNCTION update_workout_streaks()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_last_workout_date date;
  v_current_streak int := 0;
  v_longest_streak int := 0;
  v_streak_count int := 1;
  v_prev_date date;
  workout_dates date[];
BEGIN
  v_user_id := NEW.user_id;
  
  -- Get all workout dates for this user, ordered by date
  SELECT ARRAY_AGG(recorded_at::date ORDER BY recorded_at::date DESC)
  INTO workout_dates
  FROM weight_records
  WHERE user_id = v_user_id;
  
  -- Calculate current streak (from most recent workout)
  IF array_length(workout_dates, 1) > 0 THEN
    v_last_workout_date := workout_dates[1];
    
    -- Only count as current streak if last workout was today or yesterday
    IF v_last_workout_date >= CURRENT_DATE - INTERVAL '1 day' THEN
      v_current_streak := 1;
      
      -- Count consecutive days backwards
      FOR i IN 2..array_length(workout_dates, 1) LOOP
        v_prev_date := workout_dates[i];
        
        IF v_last_workout_date - v_prev_date = 1 THEN
          v_current_streak := v_current_streak + 1;
          v_last_workout_date := v_prev_date;
        ELSE
          EXIT;
        END IF;
      END LOOP;
    END IF;
    
    -- Calculate longest streak
    v_longest_streak := 1;
    v_streak_count := 1;
    v_last_workout_date := workout_dates[1];
    
    FOR i IN 2..array_length(workout_dates, 1) LOOP
      v_prev_date := workout_dates[i];
      
      IF v_last_workout_date - v_prev_date = 1 THEN
        v_streak_count := v_streak_count + 1;
        IF v_streak_count > v_longest_streak THEN
          v_longest_streak := v_streak_count;
        END IF;
      ELSE
        v_streak_count := 1;
      END IF;
      
      v_last_workout_date := v_prev_date;
    END LOOP;
  END IF;
  
  -- Update leaderboard_stats
  UPDATE leaderboard_stats
  SET 
    current_streak = v_current_streak,
    longest_streak = GREATEST(v_longest_streak, COALESCE(longest_streak, 0)),
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on weight_records
CREATE TRIGGER update_streaks_on_workout
AFTER INSERT ON weight_records
FOR EACH ROW
EXECUTE FUNCTION update_workout_streaks();

-- Feature 8: Friend recommendations based on gym visits
-- Create gym_visits table
CREATE TABLE IF NOT EXISTS gym_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on gym_visits
ALTER TABLE gym_visits ENABLE ROW LEVEL SECURITY;

-- RLS policies for gym_visits
CREATE POLICY "Users can create their own gym visits"
ON gym_visits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own gym visits"
ON gym_visits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view gym visits of their friends"
ON gym_visits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = gym_visits.user_id)
      OR
      (friendships.friend_id = auth.uid() AND friendships.user_id = gym_visits.user_id)
    )
    AND friendships.status = 'accepted'
  )
);

-- Create index for better performance
CREATE INDEX idx_gym_visits_user_id ON gym_visits(user_id);
CREATE INDEX idx_gym_visits_gym_id ON gym_visits(gym_id);

-- Function to get friend recommendations based on shared gyms
CREATE OR REPLACE FUNCTION get_gym_based_friend_recommendations(current_user_id uuid, limit_count int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  shared_gyms_count bigint,
  common_gym_names text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COUNT(DISTINCT gv2.gym_id) as shared_gyms_count,
    ARRAY_AGG(DISTINCT g.name) as common_gym_names
  FROM gym_visits gv1
  JOIN gym_visits gv2 ON gv1.gym_id = gv2.gym_id AND gv1.user_id != gv2.user_id
  JOIN profiles p ON p.user_id = gv2.user_id
  JOIN gyms g ON g.id = gv2.gym_id
  WHERE gv1.user_id = current_user_id
    AND gv2.user_id != current_user_id
    -- Exclude existing friends
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Feature 9: Message read receipts
-- Add read_at column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone DEFAULT now();

-- Create policy to allow users to mark messages as read
CREATE POLICY "Users can mark messages as read in their conversations"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid uuid, reader_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET read_at = now()
  WHERE conversation_id = conversation_uuid
    AND sender_id != reader_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;