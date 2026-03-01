-- Create user_organizations table for organization experience
CREATE TABLE public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_name TEXT NOT NULL,
  role TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organizations" ON public.user_organizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own organizations" ON public.user_organizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own organizations" ON public.user_organizations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own organizations" ON public.user_organizations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all organizations" ON public.user_organizations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all organizations" ON public.user_organizations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_organizations_updated_at BEFORE UPDATE ON public.user_organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();