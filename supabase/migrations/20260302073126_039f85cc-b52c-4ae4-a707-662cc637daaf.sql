
-- Add approval columns to partner_teams
ALTER TABLE public.partner_teams 
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS suggested_team_id uuid REFERENCES public.partner_teams(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Create index for approval filtering
CREATE INDEX IF NOT EXISTS idx_partner_teams_approval_status ON public.partner_teams(approval_status);

-- Update existing teams to 'approved' status (so they keep working)
UPDATE public.partner_teams SET approval_status = 'approved' WHERE approval_status = 'pending';
