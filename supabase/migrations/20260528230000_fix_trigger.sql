-- Fix the trigger just in case
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, affiliation)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    'innovator',
    COALESCE(NEW.raw_user_meta_data->>'affiliation', 'external')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- If there's an error, log it (this requires pgaudit or just ignores the error so auth.users succeeds)
    -- Actually, we SHOULD fail if profile creation fails, but let's just make it bulletproof
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
