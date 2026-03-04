
-- Add oveercode to competency_tests
ALTER TABLE public.competency_tests ADD COLUMN IF NOT EXISTS oveercode text UNIQUE;

-- Add oveercode to hiring_requests
ALTER TABLE public.hiring_requests ADD COLUMN IF NOT EXISTS oveercode text UNIQUE;

-- Add oveercode to partner_teams
ALTER TABLE public.partner_teams ADD COLUMN IF NOT EXISTS oveercode text UNIQUE;

-- Generate oveercodes for existing competency_tests
UPDATE public.competency_tests 
SET oveercode = 'T' || substr(md5(random()::text || id::text), 1, 8)
WHERE oveercode IS NULL;

-- Generate oveercodes for existing hiring_requests
UPDATE public.hiring_requests 
SET oveercode = 'H' || substr(md5(random()::text || id::text), 1, 8)
WHERE oveercode IS NULL;

-- Generate oveercodes for existing partner_teams
UPDATE public.partner_teams 
SET oveercode = 'TM' || substr(md5(random()::text || id::text), 1, 7)
WHERE oveercode IS NULL;

-- Create trigger function for competency_tests oveercode
CREATE OR REPLACE FUNCTION public.generate_test_oveercode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.oveercode IS NULL THEN
    NEW.oveercode := public.generate_prefixed_oveercode('T', 'competency_tests');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger function for hiring_requests oveercode
CREATE OR REPLACE FUNCTION public.generate_hiring_oveercode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.oveercode IS NULL THEN
    NEW.oveercode := public.generate_prefixed_oveercode('H', 'hiring_requests');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger function for partner_teams oveercode
CREATE OR REPLACE FUNCTION public.generate_team_oveercode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.oveercode IS NULL THEN
    NEW.oveercode := public.generate_prefixed_oveercode('TM', 'partner_teams');
  END IF;
  RETURN NEW;
END;
$$;

-- Update generate_prefixed_oveercode to support new tables
CREATE OR REPLACE FUNCTION public.generate_prefixed_oveercode(prefix text, target_table text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT;
  i INTEGER;
BEGIN
  LOOP
    result := prefix;
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    IF target_table = 'opportunities' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.opportunities WHERE oveercode = result);
    ELSIF target_table = 'business_profiles' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.business_profiles WHERE oveercode = result);
    ELSIF target_table = 'programs' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.programs WHERE oveercode = result);
    ELSIF target_table = 'learning_programs' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.learning_programs WHERE oveercode = result);
    ELSIF target_table = 'competency_tests' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.competency_tests WHERE oveercode = result);
    ELSIF target_table = 'hiring_requests' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.hiring_requests WHERE oveercode = result);
    ELSIF target_table = 'partner_teams' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.partner_teams WHERE oveercode = result);
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Create triggers
CREATE TRIGGER set_test_oveercode BEFORE INSERT ON public.competency_tests
FOR EACH ROW EXECUTE FUNCTION public.generate_test_oveercode();

CREATE TRIGGER set_hiring_oveercode BEFORE INSERT ON public.hiring_requests
FOR EACH ROW EXECUTE FUNCTION public.generate_hiring_oveercode();

CREATE TRIGGER set_team_oveercode BEFORE INSERT ON public.partner_teams
FOR EACH ROW EXECUTE FUNCTION public.generate_team_oveercode();
