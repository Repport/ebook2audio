
-- Create a new storage bucket for audio files
INSERT INTO storage.buckets (id, name)
VALUES ('audio_cache', 'audio_cache')
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio_cache');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio_cache');
