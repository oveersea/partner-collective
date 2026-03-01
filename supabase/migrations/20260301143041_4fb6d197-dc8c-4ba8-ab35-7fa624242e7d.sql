
-- Create storage bucket for program thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-thumbnails', 'program-thumbnails', true);

-- Allow anyone to view thumbnails (public bucket)
CREATE POLICY "Public can view program thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-thumbnails');

-- Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload program thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'program-thumbnails');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update program thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'program-thumbnails');

-- Allow authenticated users to delete thumbnails
CREATE POLICY "Authenticated users can delete program thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'program-thumbnails');
