
CREATE TABLE public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_login_logs_user_date ON public.login_logs (user_id, logged_in_at DESC);

CREATE POLICY "Users can insert own login logs"
ON public.login_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all login logs"
ON public.login_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own login logs"
ON public.login_logs FOR SELECT
USING (auth.uid() = user_id);
