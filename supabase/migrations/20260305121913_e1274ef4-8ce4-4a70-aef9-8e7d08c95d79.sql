
CREATE TABLE public.hiring_matched_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_request_id uuid NOT NULL REFERENCES public.hiring_requests(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'profile' CHECK (source_type IN ('profile', 'archive')),
  profile_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  candidate_archive_id uuid REFERENCES public.candidates_archive(id) ON DELETE SET NULL,
  match_score numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'shortlisted' CHECK (status IN ('shortlisted', 'submitted', 'accepted', 'rejected')),
  notes text,
  matched_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT at_least_one_candidate CHECK (profile_user_id IS NOT NULL OR candidate_archive_id IS NOT NULL)
);

ALTER TABLE public.hiring_matched_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hiring matched candidates"
ON public.hiring_matched_candidates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_hmc_hiring_request ON public.hiring_matched_candidates(hiring_request_id);
CREATE INDEX idx_hmc_profile_user ON public.hiring_matched_candidates(profile_user_id);
CREATE INDEX idx_hmc_archive ON public.hiring_matched_candidates(candidate_archive_id);
