
-- Create partner_teams table
CREATE TABLE public.partner_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  skills TEXT[] DEFAULT '{}',
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_team_members table
CREATE TABLE public.partner_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.partner_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.partner_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_team_members ENABLE ROW LEVEL SECURITY;

-- RLS for partner_teams
CREATE POLICY "Anyone can view active teams"
  ON public.partner_teams FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create teams"
  ON public.partner_teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creator can update"
  ON public.partner_teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Team creator can delete"
  ON public.partner_teams FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS for partner_team_members
CREATE POLICY "Anyone can view team members"
  ON public.partner_team_members FOR SELECT
  USING (true);

CREATE POLICY "Team creator can manage members"
  ON public.partner_team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_teams
      WHERE id = team_id AND created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Members can leave or creator can remove"
  ON public.partner_team_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.partner_teams
      WHERE id = team_id AND created_by = auth.uid()
    )
  );

-- Auto-generate slug trigger
CREATE OR REPLACE FUNCTION public.generate_team_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(NEW.name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'), '-+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.partner_teams WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_partner_team_slug
BEFORE INSERT OR UPDATE ON public.partner_teams
FOR EACH ROW EXECUTE FUNCTION public.generate_team_slug();

-- Updated_at trigger
CREATE TRIGGER update_partner_teams_updated_at
BEFORE UPDATE ON public.partner_teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
