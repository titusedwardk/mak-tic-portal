-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  role text NOT NULL DEFAULT 'innovator' CHECK (role IN ('innovator', 'reviewer', 'mentor', 'admin', 'lab_manager', 'investor', 'public')),
  affiliation text NOT NULL DEFAULT 'external' CHECK (affiliation IN ('makerere_student', 'makerere_staff', 'makerere_alumni', 'external')),
  student_id text,
  department text,
  bio text,
  skills text[] DEFAULT '{}',
  linkedin_url text,
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, affiliation)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'innovator',
    COALESCE(NEW.raw_user_meta_data->>'affiliation', 'external')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  problem_statement text NOT NULL,
  proposed_solution text NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track text NOT NULL CHECK (track IN ('early_idea', 'prototype', 'market_ready', 'ip_only', 'challenge_response')),
  sector text[] NOT NULL,
  sdg_tags int[] DEFAULT '{}',
  stage text NOT NULL DEFAULT 'submitted' CHECK (stage IN ('submitted', 'screening', 'problem_validation', 'solution_viability', 'impact_assessment', 'prototype_review', 'commercialization', 'graduated', 'archived')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'withdrawn', 'rejected')),
  support_needed text[] NOT NULL,
  ai_score numeric(5,2),
  ai_summary text,
  ai_sdg_reasoning text,
  is_public boolean DEFAULT false,
  pitch_video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Trigger for project slug
CREATE OR REPLACE FUNCTION public.generate_project_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || substr(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_project_slug ON public.projects;
CREATE TRIGGER set_project_slug
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.generate_project_slug();

-- Project files table
CREATE TABLE IF NOT EXISTS public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pitch_deck', 'business_plan', 'prototype_doc', 'demo_video', 'financial_model', 'ip_doc', 'other')),
  storage_path text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Draft)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Projects are viewable by owner" ON public.projects FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Project files viewable by owner" ON public.project_files FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_files.project_id AND projects.owner_id = auth.uid()));
CREATE POLICY "Users can insert project files" ON public.project_files FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
