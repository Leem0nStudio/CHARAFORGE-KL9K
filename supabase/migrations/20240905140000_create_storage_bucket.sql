
-- Create the main storage bucket for all public images if it doesn't already exist.
-- This includes character portraits, datapack covers, and user avatars.
-- The bucket is set to be public so that image URLs can be directly accessed.
INSERT INTO storage.buckets (id, name, public)
VALUES ('chara-images', 'chara-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies for the new bucket.
-- These policies control who can do what with the files inside the bucket.

-- 1. Allow all users (public) to view/read images from the bucket.
-- This is necessary for the app to display images to anyone visiting the site.
CREATE POLICY "Public read access for chara-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chara-images');

-- 2. Allow authenticated (logged-in) users to upload files.
-- This is the main security gate for adding new content.
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chara-images');

-- 3. Allow users to update their own files.
-- This is crucial for things like changing an avatar. The policy checks
-- that the user's ID (auth.uid()) matches the user ID embedded in the file path.
-- We will use a path structure like `avatars/:user_id` or `characters/:user_id/...`
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = (storage.foldername(name))[1]::uuid)
WITH CHECK (auth.uid() = (storage.foldername(name))[1]::uuid);


-- 4. Allow users to delete their own files.
-- Similar to the update policy, this ensures users can only delete content they own.
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = (storage.foldername(name))[1]::uuid);
