CREATE POLICY "Service can insert login_tokens"
ON public.login_tokens FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service can update login_tokens"
ON public.login_tokens FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);