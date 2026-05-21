-- ============================================================
-- Migration 012: Setup Storage for Item Images
-- ============================================================

-- Create bucket for item images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS for item images (Public can read)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'item-images');

-- Only authenticated users (kasir/gudang/owner) can upload/modify
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'item-images' AND auth.role() = 'authenticated');
