
-- Add reCAPTCHA settings to app_settings
INSERT INTO public.app_settings (key, value, label, description)
VALUES 
  ('recaptcha_enabled', 'false', 'reCAPTCHA Enabled', 'Enable/disable reCAPTCHA on auth pages'),
  ('recaptcha_site_key', '', 'reCAPTCHA Site Key', 'Google reCAPTCHA v2 site key (public)')
ON CONFLICT (key) DO NOTHING;
