
-- Table to track claims on orders and hiring requests
-- Users can claim as themselves, on behalf of a vendor, or a team
CREATE TABLE public.order_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- What is being claimed
  source_type TEXT NOT NULL CHECK (source_type IN ('service_order', 'hiring_request')),
  source_id UUID NOT NULL,
  -- Who is claiming
  user_id UUID NOT NULL,
  -- Representing whom
  claim_as TEXT NOT NULL DEFAULT 'personal' CHECK (claim_as IN ('personal', 'vendor', 'team')),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.partner_teams(id) ON DELETE SET NULL,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  cover_note TEXT,
  bid_amount NUMERIC,
  -- Admin review
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One claim per user per source
  UNIQUE (source_type, source_id, user_id)
);

-- Enable RLS
ALTER TABLE public.order_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view own claims"
ON public.order_claims FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all claims
CREATE POLICY "Admins can view all claims"
ON public.order_claims FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own claims
CREATE POLICY "Users can insert own claims"
ON public.order_claims FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can update claims (accept/reject)
CREATE POLICY "Admins can update claims"
ON public.order_claims FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can cancel their own pending claims
CREATE POLICY "Users can update own pending claims"
ON public.order_claims FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_order_claims_updated_at
BEFORE UPDATE ON public.order_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
