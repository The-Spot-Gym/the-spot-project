-- Fix the restrictive policies that are blocking access
-- Replace with PERMISSIVE policies (the default behavior)

BEGIN;

-- PROFILES: drop restrictive policy and create permissive one
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- GYMS: drop restrictive policy and create permissive one
DROP POLICY IF EXISTS "Gyms are viewable by authenticated users" ON public.gyms;
CREATE POLICY "Gyms are viewable by authenticated users"
ON public.gyms
FOR SELECT
USING (auth.role() = 'authenticated');

COMMIT;