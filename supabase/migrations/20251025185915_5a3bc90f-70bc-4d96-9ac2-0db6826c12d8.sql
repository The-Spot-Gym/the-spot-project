-- Create gym_memberships table to track which gyms users have joined
CREATE TABLE IF NOT EXISTS gym_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, gym_id)
);

-- Enable RLS
ALTER TABLE gym_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for gym_memberships
CREATE POLICY "Users can create their own gym memberships"
ON gym_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own gym memberships"
ON gym_memberships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gym memberships"
ON gym_memberships FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gym memberships"
ON gym_memberships FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_gym_memberships_user_id ON gym_memberships(user_id);
CREATE INDEX idx_gym_memberships_gym_id ON gym_memberships(gym_id);
CREATE INDEX idx_gym_memberships_active ON gym_memberships(is_active);

-- Trigger to update updated_at
CREATE TRIGGER update_gym_memberships_updated_at
BEFORE UPDATE ON gym_memberships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();