
-- Create app_settings key-value table for admin configurations
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings
CREATE POLICY "Authenticated users can read settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default profile reminder interval
INSERT INTO public.app_settings (key, value, label, description)
VALUES ('profile_reminder_interval_days', '5', 'Profile Reminder Interval (days)', 'Interval in days for sending profile completion reminder emails');

-- Function to update the marketing cron schedule with a new interval
CREATE OR REPLACE FUNCTION public.update_profile_reminder_cron(interval_days integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  job_exists boolean;
  cron_expr text;
  sql_command text;
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Build cron expression: run at 02:00 UTC every N days
  cron_expr := '0 2 */' || interval_days || ' * *';

  SELECT EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'send-marketing-email-every-2-days') INTO job_exists;

  IF job_exists THEN
    PERFORM cron.unschedule('send-marketing-email-every-2-days');
  END IF;

  sql_command := E'SELECT net.http_post(\n'
    || E'  url := ''https://sbvuvpfeooqotscyonhz.supabase.co/functions/v1/send-marketing-email'',\n'
    || E'  headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidnV2cGZlb29xb3RzY3lvbmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODA3MzcsImV4cCI6MjA4NjM1NjczN30._YKgVjqpPvt-CDD95bgFFIFvsdSDonZ44Gg0fCxnd1w"}''::jsonb,\n'
    || E'  body := ''{}''::jsonb\n'
    || E') AS request_id;';

  PERFORM cron.schedule(
    'send-marketing-email-every-2-days',
    cron_expr,
    sql_command
  );

  -- Update the setting value
  UPDATE public.app_settings
  SET value = interval_days::text, updated_at = now(), updated_by = auth.uid()
  WHERE key = 'profile_reminder_interval_days';
END;
$$;
