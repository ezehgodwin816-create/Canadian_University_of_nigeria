-- CUN FINAL PLATFORM HARDENING
-- Run after 001_platform_core.sql, 002_student_lifecycle.sql and 003_browser_integration.sql.
-- This migration makes application numbering server-authoritative and records status history.

CREATE OR REPLACE FUNCTION public.submit_application(p_payload jsonb)
RETURNS public.applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row public.applications;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.applications (
    application_number, user_id, email, first_name, last_name,
    programme_id, programme_name, status, entry_type, study_mode, data
  ) VALUES (
    'CUN/' || to_char(current_date,'YYYY') || '/' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10)),
    uid,
    lower(trim(COALESCE(p_payload->>'email',''))),
    COALESCE(p_payload->>'first_name',''),
    COALESCE(p_payload->>'last_name',''),
    NULLIF(p_payload->>'programme_id','')::uuid,
    COALESCE(p_payload->>'programme_name',''),
    'received',
    COALESCE(p_payload->>'entry_type','UTME'),
    COALESCE(p_payload->>'study_mode','Full-time'),
    COALESCE(p_payload->'data','{}'::jsonb)
  ) RETURNING * INTO row;

  RETURN row;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_application(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_application(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_status_history(application_id, from_status, to_status, actor_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS application_status_history_trigger ON public.applications;
CREATE TRIGGER application_status_history_trigger
AFTER UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.record_application_status_change();

REVOKE ALL ON FUNCTION public.record_application_status_change() FROM PUBLIC;

-- Keep authoritative application numbers collision-proof even if an old client is used.
CREATE UNIQUE INDEX IF NOT EXISTS applications_application_number_unique_idx
ON public.applications(application_number);

-- Common updated_at trigger for application records.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_set_updated_at ON public.applications;
CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Students may only see their own application status history.
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='application_status_history'
      AND policyname='applicant read own history final'
  ) THEN
    CREATE POLICY "applicant read own history final"
      ON public.application_status_history FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.applications a
          WHERE a.id = application_id AND a.user_id = auth.uid()
        ) OR public.is_privileged()
      );
  END IF;
END $$;
