-- Create gyms table to store gym data from Google Places
CREATE TABLE public.gyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  rating NUMERIC,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  photo_url TEXT,
  phone_number TEXT,
  website TEXT,
  user_ratings_total INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- Everyone can view gyms
CREATE POLICY "Gyms are viewable by everyone" 
ON public.gyms 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_gyms_updated_at
BEFORE UPDATE ON public.gyms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for location-based queries
CREATE INDEX idx_gyms_location ON public.gyms(latitude, longitude);
CREATE INDEX idx_gyms_google_place_id ON public.gyms(google_place_id);