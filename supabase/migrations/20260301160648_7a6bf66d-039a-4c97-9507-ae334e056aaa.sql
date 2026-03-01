
-- Add media_urls (array of image/video URLs) and video_url to user_portfolios
ALTER TABLE public.user_portfolios 
  ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_type text DEFAULT 'url'; -- 'url' or 'upload'

-- Create a table to track per-user storage usage
CREATE TABLE IF NOT EXISTS public.user_storage_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  total_bytes bigint NOT NULL DEFAULT 0,
  max_bytes bigint NOT NULL DEFAULT 52428800, -- 50MB
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storage usage"
  ON public.user_storage_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storage usage"
  ON public.user_storage_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storage usage"
  ON public.user_storage_usage FOR UPDATE
  USING (auth.uid() = user_id);
