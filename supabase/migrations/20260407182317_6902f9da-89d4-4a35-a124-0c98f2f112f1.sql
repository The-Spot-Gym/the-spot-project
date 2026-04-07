
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'gym_owner');

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Partnered gyms table
CREATE TABLE public.partnered_gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  contact_email text,
  contact_phone text,
  website text,
  social_links jsonb DEFAULT '{}'::jsonb,
  mma_enabled boolean NOT NULL DEFAULT false,
  mma_webpage_url text,
  mma_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partnered_gyms ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_partnered_gyms_updated_at BEFORE UPDATE ON public.partnered_gyms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partnered gym managers (create BEFORE the function that references it)
CREATE TABLE public.partnered_gym_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.partnered_gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, user_id)
);
ALTER TABLE public.partnered_gym_managers ENABLE ROW LEVEL SECURITY;

-- NOW create the function that references partnered_gym_managers
CREATE OR REPLACE FUNCTION public.is_partnered_gym_manager(_user_id uuid, _gym_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partnered_gym_managers
    WHERE user_id = _user_id AND gym_id = _gym_id
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- RLS for partnered_gyms
CREATE POLICY "Authenticated users can view partnered gyms" ON public.partnered_gyms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert partnered gyms" ON public.partnered_gyms FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins or managers can update partnered gyms" ON public.partnered_gyms FOR UPDATE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), id));
CREATE POLICY "Admins can delete partnered gyms" ON public.partnered_gyms FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS for partnered_gym_managers
CREATE POLICY "Authenticated can view managers" ON public.partnered_gym_managers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert managers" ON public.partnered_gym_managers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete managers" ON public.partnered_gym_managers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Partnered gym classes
CREATE TABLE public.partnered_gym_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.partnered_gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  instructor text,
  is_mma boolean NOT NULL DEFAULT false,
  registration_url text,
  max_capacity integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partnered_gym_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view classes" ON public.partnered_gym_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert classes" ON public.partnered_gym_classes FOR INSERT TO authenticated WITH CHECK (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can update classes" ON public.partnered_gym_classes FOR UPDATE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can delete classes" ON public.partnered_gym_classes FOR DELETE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE TRIGGER update_partnered_gym_classes_updated_at BEFORE UPDATE ON public.partnered_gym_classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Announcements
CREATE TABLE public.partnered_gym_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.partnered_gyms(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partnered_gym_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view announcements" ON public.partnered_gym_announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert announcements" ON public.partnered_gym_announcements FOR INSERT TO authenticated WITH CHECK (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can update announcements" ON public.partnered_gym_announcements FOR UPDATE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can delete announcements" ON public.partnered_gym_announcements FOR DELETE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE TRIGGER update_partnered_gym_announcements_updated_at BEFORE UPDATE ON public.partnered_gym_announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Gallery images
CREATE TABLE public.partnered_gym_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.partnered_gyms(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partnered_gym_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view images" ON public.partnered_gym_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert images" ON public.partnered_gym_images FOR INSERT TO authenticated WITH CHECK (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can update images" ON public.partnered_gym_images FOR UPDATE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can delete images" ON public.partnered_gym_images FOR DELETE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));

-- Locations
CREATE TABLE public.partnered_gym_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.partnered_gyms(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric,
  longitude numeric,
  phone text,
  hours jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partnered_gym_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view locations" ON public.partnered_gym_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert locations" ON public.partnered_gym_locations FOR INSERT TO authenticated WITH CHECK (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can update locations" ON public.partnered_gym_locations FOR UPDATE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE POLICY "Managers can delete locations" ON public.partnered_gym_locations FOR DELETE TO authenticated USING (public.is_partnered_gym_manager(auth.uid(), gym_id));
CREATE TRIGGER update_partnered_gym_locations_updated_at BEFORE UPDATE ON public.partnered_gym_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partnered gym memberships
CREATE TABLE public.partnered_gym_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.partnered_gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, user_id)
);
ALTER TABLE public.partnered_gym_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view partnered gym memberships" ON public.partnered_gym_memberships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join partnered gyms" ON public.partnered_gym_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.partnered_gym_memberships FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave partnered gyms" ON public.partnered_gym_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_partnered_gym_memberships_updated_at BEFORE UPDATE ON public.partnered_gym_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to assign admin by email
CREATE OR REPLACE FUNCTION public.assign_admin_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  IF _user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Assign admin now
SELECT public.assign_admin_by_email('sashakourakin@gmail.com');
