-- Add soft_skills and technical_skills JSON columns for radar chart data
-- Each stores an array of {name, score} objects
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS soft_skills jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS technical_skills jsonb DEFAULT '[]'::jsonb;