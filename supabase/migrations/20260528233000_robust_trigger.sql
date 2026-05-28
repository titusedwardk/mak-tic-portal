CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, affiliation)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'no-email@mak.ac.ug'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    'innovator',
    COALESCE(NEW.raw_user_meta_data->>'affiliation', 'external')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
