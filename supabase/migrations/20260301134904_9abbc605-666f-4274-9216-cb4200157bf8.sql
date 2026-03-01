-- Add last_online column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_online timestamptz DEFAULT NULL;

-- Create index for sorting by last_online
CREATE INDEX IF NOT EXISTS idx_profiles_last_online ON public.profiles (last_online DESC NULLS LAST);