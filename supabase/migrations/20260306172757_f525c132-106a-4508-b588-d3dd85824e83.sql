
-- Add check-in columns to enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS check_in_method TEXT, -- 'barcode', 'manual', 'oveercode'
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users;

-- Add check-in columns to program_orders
ALTER TABLE public.program_orders
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS check_in_method TEXT,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users;

-- Add check-in columns to event_orders
ALTER TABLE public.event_orders
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS check_in_method TEXT,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users;
