
-- Allow anonymous users to read recaptcha settings on auth page
CREATE POLICY "Anyone can read recaptcha settings"
ON public.app_settings
FOR SELECT
TO anon
USING (key IN ('recaptcha_enabled', 'recaptcha_site_key'));
