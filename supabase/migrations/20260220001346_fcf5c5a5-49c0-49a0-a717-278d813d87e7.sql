-- Add unique constraint on username to prevent duplicates
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);