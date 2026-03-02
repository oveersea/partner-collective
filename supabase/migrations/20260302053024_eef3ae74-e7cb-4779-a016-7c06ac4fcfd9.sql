
-- Fix debit_credits_on_hiring_request trigger: wrong column names
CREATE OR REPLACE FUNCTION public.debit_credits_on_hiring_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
  cost INTEGER;
BEGIN
  cost := CASE WHEN NEW.hiring_type = 'fast' THEN 10 ELSE 1 END;
  NEW.credit_cost := cost * COALESCE(NEW.positions_count, 1);

  -- Set SLA deadline
  NEW.sla_deadline := CASE
    WHEN NEW.hiring_type = 'fast' THEN now() + INTERVAL '3 days'
    ELSE now() + INTERVAL '14 days'
  END;

  -- Only debit if business_id is set
  IF NEW.business_id IS NOT NULL THEN
    SELECT balance INTO current_balance
    FROM public.company_credits
    WHERE business_id = NEW.business_id
    FOR UPDATE;

    IF current_balance IS NULL OR current_balance < NEW.credit_cost THEN
      RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', NEW.credit_cost, COALESCE(current_balance, 0);
    END IF;

    UPDATE public.company_credits
    SET balance = balance - NEW.credit_cost
    WHERE business_id = NEW.business_id;

    INSERT INTO public.credit_transactions (business_id, type, amount, balance_after, description, hiring_request_id, created_by)
    VALUES (
      NEW.business_id, 'debit', -NEW.credit_cost,
      current_balance - NEW.credit_cost,
      'Hiring request: ' || NEW.title || ' (' || NEW.hiring_type || ')',
      NEW.id, NEW.client_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix refund_credits_on_cancel trigger: wrong column names
CREATE OR REPLACE FUNCTION public.refund_credits_on_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'open' THEN
    IF NEW.business_id IS NOT NULL THEN
      SELECT balance INTO current_balance
      FROM public.company_credits
      WHERE business_id = NEW.business_id
      FOR UPDATE;

      UPDATE public.company_credits
      SET balance = balance + NEW.credit_cost
      WHERE business_id = NEW.business_id;

      INSERT INTO public.credit_transactions (business_id, type, amount, balance_after, description, hiring_request_id)
      VALUES (
        NEW.business_id, 'refund', NEW.credit_cost,
        COALESCE(current_balance, 0) + NEW.credit_cost,
        'Refund: ' || NEW.title || ' (cancelled before sourcing)',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix auto_create_shortage_alert trigger: wrong column names
CREATE OR REPLACE FUNCTION public.auto_create_shortage_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  matching_count INTEGER;
  shortage INTEGER;
BEGIN
  IF NEW.required_skills IS NULL OR array_length(NEW.required_skills, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO matching_count
  FROM public.profiles
  WHERE skills && NEW.required_skills
    AND opportunity_availability IN ('available', 'open');

  shortage := COALESCE(NEW.positions_count, 1) - matching_count;

  IF shortage > 0 AND NEW.business_id IS NOT NULL THEN
    INSERT INTO public.talent_shortage_alerts (
      hiring_request_id, business_id, skill_tags, shortage_count,
      status, sla_type, sla_deadline
    ) VALUES (
      NEW.id, NEW.business_id, NEW.required_skills, shortage,
      'open', NEW.hiring_type, NEW.sla_deadline
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix INSERT RLS policy: client_id is NOT auth.uid(), it's a client_profiles.id
DROP POLICY IF EXISTS "Company admins can create hiring requests" ON public.hiring_requests;
CREATE POLICY "Company admins can create hiring requests"
ON public.hiring_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_profiles
    WHERE client_profiles.id = hiring_requests.client_id
    AND client_profiles.user_id = auth.uid()
  )
  OR is_business_admin(auth.uid(), business_id)
);

-- Fix UPDATE policy similarly
DROP POLICY IF EXISTS "Company admins can update hiring requests" ON public.hiring_requests;
CREATE POLICY "Company admins can update hiring requests"
ON public.hiring_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM client_profiles
    WHERE client_profiles.id = hiring_requests.client_id
    AND client_profiles.user_id = auth.uid()
  )
  OR is_business_admin(auth.uid(), business_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
