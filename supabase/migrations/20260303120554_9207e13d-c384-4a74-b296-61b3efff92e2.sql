
-- Schedule daily job match email at 07:00 WIB (00:00 UTC)
SELECT cron.schedule(
  'send-daily-job-match',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sbvuvpfeooqotscyonhz.supabase.co/functions/v1/send-daily-job-match',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidnV2cGZlb29xb3RzY3lvbmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODA3MzcsImV4cCI6MjA4NjM1NjczN30._YKgVjqpPvt-CDD95bgFFIFvsdSDonZ44Gg0fCxnd1w"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
