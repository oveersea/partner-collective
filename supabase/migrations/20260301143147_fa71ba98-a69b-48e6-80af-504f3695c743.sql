
-- Create junction table for program instructors
CREATE TABLE public.program_instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, instructor_id)
);

ALTER TABLE public.program_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view program instructors"
ON public.program_instructors FOR SELECT
USING (true);

CREATE POLICY "Admins can manage program instructors"
ON public.program_instructors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
