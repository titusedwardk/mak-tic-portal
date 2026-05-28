-- Create a storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project_files', 'project_files', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage RLS policies
-- 1. Anyone authenticated can insert (upload) a file if they link it to their own profile? 
-- Actually, storage policies are based on auth.uid() and path. Let's keep it simple: 
-- Authenticated users can upload to the project_files bucket.
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'project_files' );

-- 2. Owners can select their own files
CREATE POLICY "Users can view their own files" 
ON storage.objects FOR SELECT 
TO authenticated 
USING ( bucket_id = 'project_files' AND auth.uid() = owner );

-- Note: We also need to add policies for admins to view all files later.
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING ( 
  bucket_id = 'project_files' AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'reviewer')) 
);
