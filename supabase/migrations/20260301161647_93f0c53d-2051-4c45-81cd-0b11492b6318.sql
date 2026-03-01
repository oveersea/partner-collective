
-- Allow all authenticated users to view open/unassigned orders for the marketplace
CREATE POLICY "Authenticated users can view open unassigned orders"
ON public.orders FOR SELECT
TO authenticated
USING (status = 'pending' AND assigned_to IS NULL);

-- Allow all authenticated users to view open hiring requests for the marketplace
CREATE POLICY "Authenticated users can view open hiring requests"
ON public.hiring_requests FOR SELECT
TO authenticated
USING (status = 'open');
