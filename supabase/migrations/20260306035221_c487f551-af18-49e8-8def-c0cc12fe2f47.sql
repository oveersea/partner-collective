-- Allow public to view approved experiences
CREATE POLICY "Public can view approved experiences"
ON public.user_experiences
FOR SELECT
USING (status = 'approved');

-- Allow public to view approved education
CREATE POLICY "Public can view approved education"
ON public.user_education
FOR SELECT
USING (status = 'approved');
