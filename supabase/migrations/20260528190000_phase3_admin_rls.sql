-- Add RLS policies for Admins and Reviewers

-- Allow admins and reviewers to view all projects
CREATE POLICY "Admins and reviewers can view all projects"
ON public.projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
  )
);

-- Allow admins to update any project (e.g. status, stage)
CREATE POLICY "Admins can update all projects"
ON public.projects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to view all project files
CREATE POLICY "Admins and reviewers can view all project files"
ON public.project_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
  )
);
