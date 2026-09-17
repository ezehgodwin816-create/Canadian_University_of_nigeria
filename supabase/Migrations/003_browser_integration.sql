-- CUN browser integration hardening.
-- Run in Supabase SQL Editor after the existing schema/migrations.

-- Applicants must be authenticated to create authoritative applications.
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='applications'
      AND policyname='applications_authenticated_insert_own'
  ) THEN
    CREATE POLICY applications_authenticated_insert_own
      ON public.applications
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create the public profile row when Supabase Auth creates an account.
-- SECURITY DEFINER is required because auth.users is not exposed to the browser.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'student',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE
      WHEN COALESCE(EXCLUDED.full_name, '') <> '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Keep status lookup private: the browser should not receive a public policy
-- that permits enumeration of application records.
