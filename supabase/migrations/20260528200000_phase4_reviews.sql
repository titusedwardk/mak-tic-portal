-- Reviews Domain Migration

CREATE TABLE IF NOT EXISTS public.stage_gate_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gate text NOT NULL CHECK (gate IN ('submitted', 'screening', 'problem_validation', 'solution_viability', 'impact_assessment', 'prototype_review', 'commercialization', 'graduated', 'archived')),
  score_impact int CHECK (score_impact >= 1 AND score_impact <= 10),
  score_feasibility int CHECK (score_feasibility >= 1 AND score_feasibility <= 10),
  score_team int CHECK (score_team >= 1 AND score_team <= 10),
  score_innovation int CHECK (score_innovation >= 1 AND score_innovation <= 10),
  score_market int CHECK (score_market >= 1 AND score_market <= 10),
  weighted_total numeric(5,2) GENERATED ALWAYS AS ((score_impact * 0.25) + (score_feasibility * 0.20) + (score_team * 0.20) + (score_innovation * 0.15) + (score_market * 0.20)) STORED,
  comments text,
  recommendation text NOT NULL CHECK (recommendation IN ('advance', 'revise_resubmit', 'hold', 'reject')),
  is_ai_review boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gate text NOT NULL CHECK (gate IN ('submitted', 'screening', 'problem_validation', 'solution_viability', 'impact_assessment', 'prototype_review', 'commercialization', 'graduated', 'archived')),
  assigned_at timestamptz DEFAULT now(),
  deadline timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'reassigned'))
);

-- RLS Enablement
ALTER TABLE public.stage_gate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;

-- Stage Gate Reviews Policies
CREATE POLICY "Admins can view all reviews" 
ON public.stage_gate_reviews FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Reviewers can view their own reviews" 
ON public.stage_gate_reviews FOR SELECT 
USING (
  reviewer_id = auth.uid()
);

CREATE POLICY "Reviewers can insert their own reviews" 
ON public.stage_gate_reviews FOR INSERT 
WITH CHECK (
  reviewer_id = auth.uid()
);

CREATE POLICY "Admins can insert any review" 
ON public.stage_gate_reviews FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update all reviews" 
ON public.stage_gate_reviews FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Review Assignments Policies
CREATE POLICY "Admins can view all assignments" 
ON public.review_assignments FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Reviewers can view their own assignments" 
ON public.review_assignments FOR SELECT 
USING (
  reviewer_id = auth.uid()
);

CREATE POLICY "Admins can insert assignments" 
ON public.review_assignments FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update assignments" 
ON public.review_assignments FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Reviewers can update own assignment status" 
ON public.review_assignments FOR UPDATE 
USING (
  reviewer_id = auth.uid()
);
