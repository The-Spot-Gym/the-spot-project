-- Tighten public read access for profiles and gyms
-- This fixes security findings about publicly readable user and business data.

BEGIN;

-- PROFILES: replace public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
USING (auth.role() = 'authenticated');

-- GYMS: replace public SELECT policy
DROP POLICY IF EXISTS "Gyms are viewable by everyone" ON public.gyms;
CREATE POLICY "Gyms are viewable by authenticated users"
ON public.gyms
AS RESTRICTIVE
FOR SELECT
USING (auth.role() = 'authenticated');

COMMIT;