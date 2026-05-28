-- Phase 5+ Massive Migration
-- Contains all remaining domains: Mentorship, Challenges, Community, Funding, Facilities, LMS, IP, System

-- ==============================================================================
-- 1. Mentorship Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  expertise_sectors text[] NOT NULL,
  max_mentees int DEFAULT 5,
  current_mentees int DEFAULT 0,
  availability jsonb NOT NULL,
  languages text[] DEFAULT '{english}',
  rating_avg numeric(3,2) DEFAULT 0,
  total_sessions int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.mentor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz
);

CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.mentor_assignments(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link text,
  mentor_notes text,
  innovator_rating int CHECK (innovator_rating >= 1 AND innovator_rating <= 5)
);

-- ==============================================================================
-- 2. Challenges Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  sponsor_name text,
  prize_amount numeric(12,2) DEFAULT 0,
  sector_tags text[] NOT NULL,
  sdg_tags int[] DEFAULT '{}',
  submission_deadline timestamptz NOT NULL,
  judging_deadline timestamptz NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'judging', 'closed', 'archived')),
  max_submissions int,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  submitter_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  community_votes int DEFAULT 0,
  judge_score_avg numeric(5,2),
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'shortlisted', 'winner', 'runner_up', 'not_selected')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 3. Community / Forum Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  slug text UNIQUE NOT NULL,
  sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  is_pinned boolean DEFAULT false,
  reply_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- 4. Funding Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.funding_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_budget numeric(14,2) NOT NULL,
  disbursed numeric(14,2) DEFAULT 0,
  currency text DEFAULT 'UGX',
  reporting_template jsonb,
  contact_email text,
  active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.funding_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.funding_sources(id) ON DELETE CASCADE,
  total_amount numeric(12,2) NOT NULL,
  disbursed_amount numeric(12,2) DEFAULT 0,
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'suspended'))
);

CREATE TABLE IF NOT EXISTS public.funding_tranches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL REFERENCES public.funding_allocations(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  milestone_id uuid, -- skipping foreign key for simplicity if project_milestones is missing
  payment_method text DEFAULT 'mtn_momo' CHECK (payment_method IN ('mtn_momo', 'airtel_money', 'bank_transfer')),
  payment_ref text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'milestone_met', 'processing', 'disbursed', 'failed')),
  disbursed_at timestamptz
);

-- ==============================================================================
-- 5. Facilities Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('maker_space', 'design_lab', 'meeting_room', 'event_space', 'equipment')),
  description text,
  capacity int,
  location text NOT NULL,
  requires_training boolean DEFAULT false,
  training_course_id uuid, -- skipping FK to courses for circular deps
  active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  booked_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  purpose text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  approved_by uuid REFERENCES public.profiles(id)
);

-- ==============================================================================
-- 6. Resources / LMS Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('entrepreneurship', 'technical', 'legal', 'financial', 'safety')),
  duration_minutes int NOT NULL,
  is_required boolean DEFAULT false,
  sort_order int DEFAULT 0,
  published boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  video_url text,
  sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  score int
);

-- ==============================================================================
-- 7. IP Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ip_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL,
  filing_date date,
  registration_number text,
  status text DEFAULT 'pending',
  jurisdiction text
);

-- ==============================================================================
-- 8. System Domain
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('review_assigned', 'stage_advanced', 'funding_disbursed', 'mentor_matched', 'challenge_open', 'booking_approved', 'system')),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- RLS Activation & Basic Admin Policies
-- ==============================================================================
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_tranches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Allow Admins to do everything (for brevity in this massive migration)
-- For public or portal tables, we'll open READ access.
CREATE POLICY "Public Read Access" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.mentor_profiles FOR SELECT USING (true);

-- User-specific read access
CREATE POLICY "Users can read own submissions" ON public.challenge_submissions FOR SELECT USING (auth.uid() = submitter_id);
CREATE POLICY "Users can read own bookings" ON public.bookings FOR SELECT USING (auth.uid() = booked_by);
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own course progress" ON public.course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own project comments" ON public.project_comments FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_comments.project_id AND projects.owner_id = auth.uid()));

-- Insert capabilities
CREATE POLICY "Users can insert forum posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can insert forum replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can insert submissions" ON public.challenge_submissions FOR INSERT WITH CHECK (auth.uid() = submitter_id);
CREATE POLICY "Users can book facilities" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = booked_by);
CREATE POLICY "Users can track course progress" ON public.course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System tables are Admin Only by default if not specified above.
