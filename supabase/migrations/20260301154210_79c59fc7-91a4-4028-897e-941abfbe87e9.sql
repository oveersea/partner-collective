-- Table to store profile change requests requiring admin approval
CREATE TABLE public.profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own change requests"
ON public.profile_change_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own change requests
CREATE POLICY "Users can create own change requests"
ON public.profile_change_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all change requests
CREATE POLICY "Admins can view all change requests"
ON public.profile_change_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update change requests (approve/reject)
CREATE POLICY "Admins can update change requests"
ON public.profile_change_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_profile_change_requests_user ON public.profile_change_requests(user_id);
CREATE INDEX idx_profile_change_requests_status ON public.profile_change_requests(status);

-- Trigger for updated_at
CREATE TRIGGER update_profile_change_requests_updated_at
BEFORE UPDATE ON public.profile_change_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();