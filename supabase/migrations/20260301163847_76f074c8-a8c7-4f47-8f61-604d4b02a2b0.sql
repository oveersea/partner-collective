
-- Add slug and rich content fields to case_studies
ALTER TABLE public.case_studies
ADD COLUMN slug text UNIQUE,
ADD COLUMN content text,
ADD COLUMN client_logo_url text,
ADD COLUMN challenge text,
ADD COLUMN solution text,
ADD COLUMN results text,
ADD COLUMN testimonial_quote text,
ADD COLUMN testimonial_author text,
ADD COLUMN testimonial_role text;

-- Generate slugs from titles for existing rows
UPDATE public.case_studies 
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));

-- Make slug NOT NULL after populating
ALTER TABLE public.case_studies ALTER COLUMN slug SET NOT NULL;

-- Case study sections (vertical image/text blocks like Behance)
CREATE TABLE public.case_study_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id uuid NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  section_type text NOT NULL DEFAULT 'image', -- 'image', 'text', 'image_text'
  title text,
  body text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_study_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Case study sections are publicly readable"
ON public.case_study_sections FOR SELECT USING (true);

-- Case study <-> services linking table
CREATE TABLE public.case_study_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id uuid NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(case_study_id, service_id)
);

ALTER TABLE public.case_study_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Case study services are publicly readable"
ON public.case_study_services FOR SELECT USING (true);

-- Index for fast lookups
CREATE INDEX idx_case_study_sections_cs_id ON public.case_study_sections(case_study_id);
CREATE INDEX idx_case_study_services_cs_id ON public.case_study_services(case_study_id);
CREATE INDEX idx_case_studies_slug ON public.case_studies(slug);
