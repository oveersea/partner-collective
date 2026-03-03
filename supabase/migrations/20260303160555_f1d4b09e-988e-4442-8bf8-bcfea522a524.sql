
-- API Keys table for mobile app integration
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- first 8 chars for display
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scopes TEXT[] DEFAULT ARRAY['auth']::TEXT[],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only superadmin can manage API keys
CREATE POLICY "Superadmin can manage api_keys"
ON public.api_keys FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Login tokens table (one-time tokens generated via API key)
CREATE TABLE public.login_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_tokens ENABLE ROW LEVEL SECURITY;

-- No direct client access to login_tokens
CREATE POLICY "No direct access to login_tokens"
ON public.login_tokens FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
