# CUN Digital Platform Architecture

The repository is now organised as one platform rather than a collection of disconnected demos.

**Surfaces:** public official website, admissions/applicant experience, student portal, staff portal, administration/CMS, finance, document centre, support, notifications, search, SEO and accessibility.

**Trust boundary:** the browser never decides permissions, payment success, admission status or access to private documents. Supabase/Postgres, RLS and Edge Functions are authoritative.

**Lifecycle:** content Draft -> Review -> Scheduled -> Published -> Archived. Application Draft -> Submitted -> Payment verified -> Checklist -> Review -> Offer -> Acceptance -> Onboarding. Invoice -> Pending -> Provider verification -> Paid -> Receipt. Document -> Private storage -> RLS -> short-lived signed URL.

**Roles:** Super Admin, Admissions, Finance, Registry, Faculty Admin, Communications, Staff, Student, Applicant.

Future features belong in this repository as migrations, Edge Functions, service modules and UI modules. Do not create separate mini-sites.
