-- Fix trigger by properly casting text variables to their respective custom enum types
-- This prevents the PL/pgSQL type mismatch error that caused the fallback block to trigger.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_affiliation text;
  v_role text;
BEGIN
  -- Safely extract and validate affiliation
  v_affiliation := COALESCE(NULLIF(NEW.raw_user_meta_data->>'affiliation', ''), 'external');
  IF v_affiliation NOT IN ('makerere_student', 'makerere_staff', 'makerere_alumni', 'external') THEN
    v_affiliation := 'external';
  END IF;

  v_role := 'innovator';

  -- Insert into public.profiles with EXPLICIT CASTS to the custom enum types
  INSERT INTO public.profiles (id, email, full_name, role, affiliation)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.email, ''), 'no-email-' || NEW.id || '@mak.ac.ug'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Unknown User'),
    v_role::public.user_role,
    v_affiliation::public.affiliation_type
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- In the extremely rare case an error STILL occurs, we catch it, log it, and return NEW.
    -- We do not attempt a fallback insert because if the above fails, it's likely a schema mismatch
    -- that cannot be easily resolved with a hardcoded fallback (which would also likely fail).
    RAISE LOG 'CRITICAL: handle_new_user failed. Error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
