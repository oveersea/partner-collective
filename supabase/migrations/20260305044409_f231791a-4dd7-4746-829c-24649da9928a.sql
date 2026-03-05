CREATE OR REPLACE FUNCTION public.debit_credits_on_hiring_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
  cost INTEGER;
  acting_user_id UUID;
BEGIN
  cost := CASE WHEN NEW.hiring_type = 'fast' THEN 10 ELSE 1 END;
  NEW.credit_cost := cost * COALESCE(NEW.positions_count, 1);

  NEW.sla_deadline := CASE
    WHEN NEW.hiring_type = 'fast' THEN now() + INTERVAL '3 days'
    ELSE now() + INTERVAL '14 days'
  END;

  -- client_id references client_profiles.id, need to get actual user_id
  SELECT user_id INTO acting_user_id
  FROM public.client_profiles
  WHERE id = NEW.client_id;

  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION 'Client profile not found for id: %', NEW.client_id;
  END IF;

  SELECT balance INTO current_balance
  FROM public.credit_balances
  WHERE user_id = acting_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < NEW.credit_cost THEN
    RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', NEW.credit_cost, COALESCE(current_balance, 0);
  END IF;

  UPDATE public.credit_balances
  SET balance = balance - NEW.credit_cost,
      total_used = total_used + NEW.credit_cost,
      updated_at = now()
  WHERE user_id = acting_user_id;

  RETURN NEW;
END;
$$;