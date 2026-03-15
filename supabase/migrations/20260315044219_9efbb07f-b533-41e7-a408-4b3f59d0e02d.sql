
INSERT INTO public.app_settings (key, value, label, description)
VALUES ('email_sending_enabled', 'false', 'Email Sending', 'Global toggle to enable/disable all email sending')
ON CONFLICT (key) DO UPDATE SET value = 'false', updated_at = now();
