-- 20260529000000_fix_rls_recursion.sql
-- Fixes infinite recursion between projects and project_members policies.

-- 1. Drop existing problematic recursive policies
DROP POLICY IF EXISTS "Projects update policy" ON public.projects;
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
DROP POLICY IF EXISTS "Projects insert policy" ON public.projects;
DROP POLICY IF EXISTS "Project members write policy" ON public.project_members;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Projects are viewable by owner" ON public.projects;

-- 2. Recreate project_members write policies (separating ALL into specific commands)
-- This avoids the ALL policy applying to SELECTs and causing infinite planner recursion.
CREATE POLICY "Project members insert policy"
ON public.project_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND (projects.owner_id = auth.uid() OR get_my_role() = 'admin')
  )
);

CREATE POLICY "Project members update policy"
ON public.project_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND (projects.owner_id = auth.uid() OR get_my_role() = 'admin')
  )
);

CREATE POLICY "Project members delete policy"
ON public.project_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND (projects.owner_id = auth.uid() OR get_my_role() = 'admin')
  )
);

-- 3. Recreate projects policies securely (fixing project_members.id typo)
CREATE POLICY "Projects select policy"
ON public.projects FOR SELECT
USING (
  is_public = true OR
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
  ) OR
  get_my_role() IN ('admin', 'reviewer', 'lab_manager')
);

CREATE POLICY "Projects update policy"
ON public.projects FOR UPDATE
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
  ) OR
  get_my_role() = 'admin'
);

CREATE POLICY "Projects insert policy"
ON public.projects FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
);
