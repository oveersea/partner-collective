
-- Drop old user_services table (has different structure)
DROP TABLE IF EXISTS public.user_services CASCADE;

-- Service categories (e.g., Marketing, IT, Design)
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service categories viewable by everyone" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.service_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services (sub-services with required skills)
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  min_match_pct INTEGER NOT NULL DEFAULT 70,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User services (linked to catalog)
CREATE TABLE public.user_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User services viewable by everyone" ON public.user_services FOR SELECT USING (true);
CREATE POLICY "Users manage own services insert" ON public.user_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own services update" ON public.user_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own services delete" ON public.user_services FOR DELETE USING (auth.uid() = user_id);

-- Skill match function
CREATE OR REPLACE FUNCTION public.calculate_service_match(p_user_skills TEXT[], p_required_skills TEXT[])
RETURNS NUMERIC
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE matched INTEGER := 0; total INTEGER;
BEGIN
  total := array_length(p_required_skills, 1);
  IF total IS NULL OR total = 0 THEN RETURN 100; END IF;
  SELECT COUNT(*) INTO matched FROM unnest(p_required_skills) rs WHERE LOWER(rs) = ANY(SELECT LOWER(unnest(p_user_skills)));
  RETURN ROUND((matched::NUMERIC / total::NUMERIC) * 100, 2);
END;
$$;

-- Seed categories
INSERT INTO public.service_categories (name, slug, description, icon, sort_order) VALUES
  ('Marketing', 'marketing', 'Layanan pemasaran digital & tradisional', 'Megaphone', 1),
  ('Teknologi', 'teknologi', 'Pengembangan software & infrastruktur IT', 'Code', 2),
  ('Desain', 'desain', 'Desain visual, UX/UI, dan branding', 'Palette', 3),
  ('Bisnis', 'bisnis', 'Konsultasi bisnis, operasional, & manajemen', 'Briefcase', 4),
  ('Konten', 'konten', 'Penulisan, videografi, & produksi konten', 'FileText', 5),
  ('Keuangan', 'keuangan', 'Akuntansi, pajak, & perencanaan keuangan', 'Calculator', 6);

-- Seed services
INSERT INTO public.services (category_id, name, slug, description, required_skills, min_match_pct, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='marketing'), 'Digital Marketing', 'digital-marketing', 'Strategi pemasaran digital end-to-end', ARRAY['marketing', 'digital marketing', 'copywriting', 'analytics'], 70, 1),
  ((SELECT id FROM service_categories WHERE slug='marketing'), 'Social Media Management', 'social-media-management', 'Kelola akun sosial media & kampanye', ARRAY['social media', 'content creation', 'copywriting', 'analytics'], 70, 2),
  ((SELECT id FROM service_categories WHERE slug='marketing'), 'SEO & SEM', 'seo-sem', 'Optimasi mesin pencari & iklan berbayar', ARRAY['seo', 'sem', 'google ads', 'analytics', 'keyword research'], 70, 3),
  ((SELECT id FROM service_categories WHERE slug='marketing'), 'Email Marketing', 'email-marketing', 'Kampanye email & marketing automation', ARRAY['email marketing', 'copywriting', 'marketing automation', 'analytics'], 70, 4),
  ((SELECT id FROM service_categories WHERE slug='teknologi'), 'Web Development', 'web-development', 'Pengembangan website & web app', ARRAY['javascript', 'html', 'css', 'react', 'web development'], 70, 1),
  ((SELECT id FROM service_categories WHERE slug='teknologi'), 'Mobile Development', 'mobile-development', 'Pengembangan aplikasi mobile', ARRAY['mobile development', 'react native', 'flutter', 'ios', 'android'], 70, 2),
  ((SELECT id FROM service_categories WHERE slug='teknologi'), 'Data Analytics', 'data-analytics', 'Analisis data & business intelligence', ARRAY['data analytics', 'sql', 'python', 'tableau', 'statistics'], 70, 3),
  ((SELECT id FROM service_categories WHERE slug='teknologi'), 'Cloud & DevOps', 'cloud-devops', 'Infrastruktur cloud & CI/CD', ARRAY['aws', 'docker', 'kubernetes', 'ci/cd', 'devops'], 70, 4),
  ((SELECT id FROM service_categories WHERE slug='desain'), 'UI/UX Design', 'ui-ux-design', 'Desain antarmuka & pengalaman pengguna', ARRAY['ui design', 'ux design', 'figma', 'prototyping', 'user research'], 70, 1),
  ((SELECT id FROM service_categories WHERE slug='desain'), 'Graphic Design', 'graphic-design', 'Desain grafis & visual branding', ARRAY['graphic design', 'adobe photoshop', 'adobe illustrator', 'branding'], 70, 2),
  ((SELECT id FROM service_categories WHERE slug='desain'), 'Motion Graphics', 'motion-graphics', 'Animasi & video grafis', ARRAY['after effects', 'motion graphics', 'animation', 'video editing'], 70, 3),
  ((SELECT id FROM service_categories WHERE slug='bisnis'), 'Business Consulting', 'business-consulting', 'Konsultasi strategi & operasional bisnis', ARRAY['business strategy', 'management consulting', 'project management', 'analytics'], 70, 1),
  ((SELECT id FROM service_categories WHERE slug='bisnis'), 'HR & Recruitment', 'hr-recruitment', 'Manajemen SDM & proses rekrutmen', ARRAY['recruitment', 'human resources', 'talent acquisition', 'people management'], 70, 2),
  ((SELECT id FROM service_categories WHERE slug='konten'), 'Content Writing', 'content-writing', 'Penulisan artikel, blog, & copy', ARRAY['writing', 'copywriting', 'content strategy', 'seo'], 70, 1),
  ((SELECT id FROM service_categories WHERE slug='konten'), 'Video Production', 'video-production', 'Produksi video & videografi', ARRAY['video editing', 'videography', 'adobe premiere', 'storytelling'], 70, 2),
  ((SELECT id FROM service_categories WHERE slug='keuangan'), 'Accounting & Tax', 'accounting-tax', 'Jasa akuntansi & perpajakan', ARRAY['accounting', 'tax', 'financial reporting', 'bookkeeping'], 70, 1),
  ((SELECT id FROM service_categories WHERE slug='keuangan'), 'Financial Planning', 'financial-planning', 'Perencanaan keuangan & investasi', ARRAY['financial planning', 'investment', 'budgeting', 'risk management'], 70, 2);

-- Triggers
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_services_updated_at BEFORE UPDATE ON public.user_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
