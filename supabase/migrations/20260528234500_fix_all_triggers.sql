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

  INSERT INTO public.profiles (id, email, full_name, role, affiliation)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.email, ''), 'no-email-' || NEW.id || '@mak.ac.ug'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Unknown User'),
    v_role,
    v_affiliation
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Fallback: If EVERYTHING else fails, just insert the bare minimum required by the schema
    -- We'll try to insert using hardcoded safe values to prevent complete signup failure
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, role, affiliation)
      VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.email, ''), 'fallback-' || NEW.id || '@mak.ac.ug'),
        'Fallback User',
        'innovator',
        'external'
      );
    EXCEPTION
      WHEN others THEN
        -- If even the fallback fails, something is fundamentally broken with the table schema or permissions
        RAISE LOG 'CRITICAL: handle_new_user completely failed. Error: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
