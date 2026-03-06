
-- Events table (similar to programs but for events)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  oveercode TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'conference',
  event_type TEXT NOT NULL DEFAULT 'offline', -- online, offline, hybrid
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, cancelled, completed
  
  -- Date & Time
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Location
  location TEXT,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  online_url TEXT,
  
  -- Pricing
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  early_bird_price_cents INTEGER,
  early_bird_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Capacity
  capacity INTEGER,
  registered_count INTEGER DEFAULT 0,
  
  -- Content
  thumbnail_url TEXT,
  organizer_name TEXT,
  organizer_logo_url TEXT,
  speakers JSONB, -- [{name, title, avatar_url, bio}]
  agenda JSONB, -- [{time, title, description, speaker}]
  highlights TEXT[],
  faq JSONB, -- [{question, answer}]
  
  -- Organizer
  created_by UUID REFERENCES auth.users NOT NULL,
  business_id UUID REFERENCES public.business_profiles(id),
  institution_id UUID REFERENCES public.institutions(id),
  
  -- Meta
  tags TEXT[],
  badge TEXT,
  level TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique slug
CREATE UNIQUE INDEX events_slug_idx ON public.events(slug);
CREATE UNIQUE INDEX events_oveercode_idx ON public.events(oveercode) WHERE oveercode IS NOT NULL;

-- Event orders/tickets table
CREATE TABLE public.event_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id),
  user_id UUID REFERENCES auth.users NOT NULL,
  order_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  ticket_count INTEGER NOT NULL DEFAULT 1,
  amount INTEGER NOT NULL,
  original_amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'IDR',
  discount_amount INTEGER DEFAULT 0,
  voucher_codes TEXT[],
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled, refunded
  
  -- Xendit
  xendit_invoice_id TEXT,
  xendit_invoice_url TEXT,
  xendit_paid_at TIMESTAMP WITH TIME ZONE,
  xendit_payment_method TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX event_orders_number_idx ON public.event_orders(order_number);

-- Generate slug trigger
CREATE OR REPLACE FUNCTION public.generate_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(NEW.title), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'), '-+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_event_slug
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.generate_event_slug();

-- Generate oveercode trigger
CREATE OR REPLACE FUNCTION public.generate_event_oveercode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.oveercode IS NULL THEN
    NEW.oveercode := public.generate_prefixed_oveercode('E', 'events');
  END IF;
  RETURN NEW;
END;
$$;

-- Add events to the prefixed_oveercode function's supported tables
-- First update generate_prefixed_oveercode to support events
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
    ELSIF target_table = 'events' THEN
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.events WHERE oveercode = result);
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

CREATE TRIGGER trg_generate_event_oveercode
BEFORE INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.generate_event_oveercode();

-- Generate event order number
CREATE OR REPLACE FUNCTION public.generate_event_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE today_str text; seq integer;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(NULLIF(split_part(order_number, '-', 3), '') AS integer)), 0) + 1
  INTO seq FROM public.event_orders WHERE order_number LIKE 'EV-' || today_str || '-%';
  RETURN 'EV-' || today_str || '-' || lpad(seq::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_event_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_event_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_event_order_number
BEFORE INSERT ON public.event_orders
FOR EACH ROW EXECUTE FUNCTION public.set_event_order_number();

-- Updated_at trigger
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_event_orders_updated_at BEFORE UPDATE ON public.event_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
-- Events: public read for published, creators can manage their own
CREATE POLICY "Anyone can view published events" ON public.events FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can manage own events" ON public.events FOR ALL USING (auth.uid() = created_by);

-- Event orders: users see own, admins see all
CREATE POLICY "Users can view own event orders" ON public.event_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own event orders" ON public.event_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all event orders" ON public.event_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
