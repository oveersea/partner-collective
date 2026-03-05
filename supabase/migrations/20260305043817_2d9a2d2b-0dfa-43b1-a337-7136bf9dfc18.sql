CREATE OR REPLACE FUNCTION public.debit_credits_on_hiring_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
  cost INTEGER;
BEGIN
  cost := CASE WHEN NEW.hiring_type = 'fast' THEN 10 ELSE 1 END;
  NEW.credit_cost := cost * COALESCE(NEW.positions_count, 1);

  NEW.sla_deadline := CASE
    WHEN NEW.hiring_type = 'fast' THEN now() + INTERVAL '3 days'
    ELSE now() + INTERVAL '14 days'
  END;

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
  ELSE
    SELECT balance INTO current_balance
    FROM public.credit_balances
    WHERE user_id = NEW.client_id
    FOR UPDATE;

    IF current_balance IS NULL OR current_balance < NEW.credit_cost THEN
      RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', NEW.credit_cost, COALESCE(current_balance, 0);
    END IF;

    UPDATE public.credit_balances
    SET balance = balance - NEW.credit_cost,
        total_used = total_used + NEW.credit_cost,
        updated_at = now()
    WHERE user_id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;