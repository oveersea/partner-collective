-- Add SLA and assignment columns to orders table (service requests)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS sla_type text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS sla_deadline timestamptz,
ADD COLUMN IF NOT EXISTS assigned_to uuid,
ADD COLUMN IF NOT EXISTS assigned_vendor_id uuid REFERENCES public.business_profiles(id),
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Add SLA and assignment columns to opportunities table (project requests)
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS sla_type text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS sla_deadline timestamptz,
ADD COLUMN IF NOT EXISTS assigned_to uuid,
ADD COLUMN IF NOT EXISTS assigned_vendor_id uuid REFERENCES public.business_profiles(id),
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Create trigger to auto-set SLA deadline on orders
CREATE OR REPLACE FUNCTION public.set_order_sla_deadline()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := CASE
      WHEN NEW.sla_type = 'urgent' THEN now() + INTERVAL '3 days'
      WHEN NEW.sla_type = 'priority' THEN now() + INTERVAL '7 days'
      ELSE now() + INTERVAL '14 days'
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_order_sla_deadline
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_sla_deadline();

-- Create trigger to auto-set SLA deadline on opportunities (project requests)
CREATE OR REPLACE FUNCTION public.set_opportunity_sla_deadline()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.sla_deadline IS NULL AND NEW.job_type = 'project' THEN
    NEW.sla_deadline := CASE
      WHEN NEW.sla_type = 'urgent' THEN now() + INTERVAL '3 days'
      WHEN NEW.sla_type = 'priority' THEN now() + INTERVAL '7 days'
      ELSE now() + INTERVAL '14 days'
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_opportunity_sla_deadline
BEFORE INSERT ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.set_opportunity_sla_deadline();

-- Add indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sla_deadline ON public.orders(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_job_type_status ON public.opportunities(job_type, status);