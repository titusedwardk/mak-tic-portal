-- Fix ghost user bug and apply input trimming
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_affiliation text;
  v_role text;
  v_full_name text;
BEGIN
  -- Safely extract and validate affiliation
  v_affiliation := COALESCE(NULLIF(NEW.raw_user_meta_data->>'affiliation', ''), 'external');
  IF v_affiliation NOT IN ('makerere_student', 'makerere_staff', 'makerere_alumni', 'external') THEN
    v_affiliation := 'external';
  END IF;

  v_role := 'innovator';

  -- Trim full name to prevent whitespace-only names
  v_full_name := TRIM(COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Unknown User'));
  IF v_full_name = '' THEN
    v_full_name := 'Unknown User';
  END IF;

  -- Insert into public.profiles with EXPLICIT CASTS to the custom enum types
  INSERT INTO public.profiles (id, email, full_name, role, affiliation)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.email, ''), 'no-email-' || NEW.id || '@mak.ac.ug'),
    v_full_name,
    v_role::public.user_role,
    v_affiliation::public.affiliation_type
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- RAISE EXCEPTION completely aborts the transaction, preventing Ghost Users
    -- in the auth.users table if the public.profiles insertion fails.
    RAISE EXCEPTION 'Failed to create profile for user %. Error: %', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
