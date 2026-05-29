-- Security Hardening for Submission Workflows

-- 1. Secure stage_gate_reviews INSERT policy
DROP POLICY IF EXISTS "Reviewers can insert their own reviews" ON public.stage_gate_reviews;
CREATE POLICY "Reviewers can insert their own reviews" 
ON public.stage_gate_reviews FOR INSERT 
WITH CHECK (
  reviewer_id = auth.uid() AND 
  public.get_my_role() IN ('admin', 'reviewer')
);

-- 2. Protect sensitive columns in projects table
CREATE OR REPLACE FUNCTION public.protect_project_sensitive_columns()
RETURNS trigger AS $$
BEGIN
  -- If the user is an admin or reviewer, allow any changes
  IF public.get_my_role() IN ('admin', 'reviewer') THEN
    RETURN NEW;
  END IF;

  -- Otherwise, ignore changes to sensitive columns by reverting to OLD values
  NEW.stage = OLD.stage;
  NEW.status = OLD.status;
  NEW.ai_score = OLD.ai_score;
  NEW.ai_summary = OLD.ai_summary;
  NEW.owner_id = OLD.owner_id;
  NEW.is_public = OLD.is_public;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_project_sensitive_columns ON public.projects;
CREATE TRIGGER tr_protect_project_sensitive_columns
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.protect_project_sensitive_columns();


-- 3. Secure project_files table policies
DROP POLICY IF EXISTS "Users can insert project files" ON public.project_files;
CREATE POLICY "Users can insert project files" 
ON public.project_files FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND 
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their project files"
ON public.project_files FOR UPDATE
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their project files"
ON public.project_files FOR DELETE
USING (uploaded_by = auth.uid());


-- 4. Secure storage bucket policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( 
  bucket_id = 'project_files' AND 
  (storage.foldername(name))[1] = auth.uid()::text 
);

CREATE POLICY "Users can update their own files in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'project_files' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own files in storage"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'project_files' AND auth.uid() = owner );
