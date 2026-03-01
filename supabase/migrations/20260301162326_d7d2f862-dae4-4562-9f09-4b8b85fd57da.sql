-- Add business_type column to distinguish vendors (job receivers) from companies (job givers)
ALTER TABLE public.business_profiles 
ADD COLUMN business_type text NOT NULL DEFAULT 'company';

-- Add index for filtering
CREATE INDEX idx_business_profiles_business_type ON public.business_profiles (business_type);

-- Add comment for clarity
COMMENT ON COLUMN public.business_profiles.business_type IS 'Type of business: company (job giver) or vendor (job receiver)';