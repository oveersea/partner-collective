
-- Create case_studies table
CREATE TABLE public.case_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT NOT NULL,
  industry TEXT,
  image_url TEXT,
  cta_label TEXT DEFAULT 'Baca selengkapnya',
  cta_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

-- Public read for active case studies
CREATE POLICY "Anyone can view active case studies"
ON public.case_studies
FOR SELECT
USING (is_active = true);

-- Admin can manage
CREATE POLICY "Admins can manage case studies"
ON public.case_studies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed with initial data from existing hardcoded case studies
INSERT INTO public.case_studies (title, description, company_name, industry, cta_label, sort_order, is_featured) VALUES
('Transformasi Digital Nusantara', 'Bagaimana PT Nusantara Digital membangun tim tech berkualitas dalam waktu singkat melalui platform Oveersea.', 'PT Nusantara Digital', 'Fintech', 'Baca cerita', 1, true),
('Skalabilitas Tim Logistik', 'Logistik Indonesia berhasil menemukan 50+ talenta operasional berkualitas di seluruh nusantara.', 'Logistik Indonesia', 'Logistics', 'Baca cerita', 2, true),
('Dari Startup ke Scale-up', 'TechVenture ID mempercepat pertumbuhan dengan merekrut developer senior melalui Oveersea.', 'TechVenture ID', 'Tech Startup', 'Baca cerita', 3, true),
('Inovasi Healthcare', 'MedikaCare menemukan talenta medtech terbaik untuk mengembangkan platform telehealth mereka.', 'MedikaCare', 'Healthcare', 'Baca cerita', 4, false);

-- Trigger for updated_at
CREATE TRIGGER update_case_studies_updated_at
BEFORE UPDATE ON public.case_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
