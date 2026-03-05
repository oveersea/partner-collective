
ALTER TABLE public.program_orders
  ADD COLUMN IF NOT EXISTS voucher_codes text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_amount numeric DEFAULT NULL;
