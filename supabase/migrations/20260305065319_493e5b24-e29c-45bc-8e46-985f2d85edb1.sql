
-- Create security definer function to check gym membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_gym_member(_user_id uuid, _gym_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_memberships
    WHERE user_id = _user_id AND gym_id = _gym_id AND is_active = true
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view members at their gyms" ON public.gym_memberships;

-- Recreate it using the security definer function
CREATE POLICY "Users can view members at their gyms"
ON public.gym_memberships
FOR SELECT
TO authenticated
USING (
  public.is_gym_member(auth.uid(), gym_id)
);
