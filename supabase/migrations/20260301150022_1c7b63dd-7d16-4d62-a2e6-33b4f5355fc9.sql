
-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolios', 'portfolios', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload portfolio images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view portfolio images (public bucket)
CREATE POLICY "Portfolio images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'portfolios');

-- Allow users to update their own portfolio images
CREATE POLICY "Users can update own portfolio images" ON storage.objects
FOR UPDATE USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own portfolio images
CREATE POLICY "Users can delete own portfolio images" ON storage.objects
FOR DELETE USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);
