# CUN Final Digital Platform

This is the consolidated CUN website + portal repository intended to be the single handoff package.

## Included
- Public university website and responsive design system
- Supabase Auth integration
- Applicant admissions workflow
- Student portal
- Administrator portal
- Application status history
- Academic lifecycle foundation (sessions, offerings, enrolments, assessments, grades, attendance)
- Finance foundation (fees, invoices, payments, Paystack webhook)
- Application document storage and signed access foundation
- Scholarships, accommodation, careers, research, alumni and support foundations
- RLS/security policies, Edge Functions and deployment configuration
- Legal/security/operations documentation

## One-time deployment
1. Create/configure the Supabase project.
2. Open `supabase/FINAL_DEPLOY.sql` and run it in the Supabase SQL Editor.
3. Deploy the functions under `supabase/functions/` with Supabase CLI.
4. Create the required private storage bucket `application-documents` if it is not created by the SQL.
5. Put only the Supabase project URL and publishable/anon browser key in `js/config.js`.
6. Never put the Supabase service-role key or Paystack secret in browser files.

## Important
This repository deliberately does not invent current CUN leadership, fees, contacts, rankings, accreditation claims or other facts that have not been verified. Those should be populated from authoritative university sources before public launch.

Run `npm run check` for the static integrity check.
