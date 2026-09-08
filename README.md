# Canadian University of Nigeria — Digital Platform

This repository is a single, production-oriented university web platform. It is intentionally **not** a demo site and does not ship fake portal credentials, fake rankings, fake testimonials, invented executives, invented fees or public document links.

## What is included

### Public experience
- Premium institutional homepage and responsive navigation
- About, history, governance and leadership
- Faculties, departments and programme catalogue
- Admissions, requirements, application guidance and international admissions
- Fees and scholarships framework
- Academic calendar
- Campus, accommodation, library, health, student life, clubs and careers
- Research and research centres
- News, events, media, gallery and downloads
- Partnerships and institutional statistics framework
- Directory and contact experience
- Accessibility, privacy, cookies, terms and security disclosure
- Search, sitemap, robots, PWA shell and offline fallback

### Applicant platform
- Authenticated application lifecycle
- Draft/save/submit model
- Application status history
- Document checklist and private document storage
- Offer workflow and offer-letter storage
- Payment records and server-verified gateway architecture
- Notifications and support tickets

### Student platform
- Profile and programme identity
- Course catalogue and offerings
- Course registration/enrolment
- Assessments and grades
- Attendance
- Fee statements, invoices and receipts
- Transcript requests
- Accommodation requests/allocation
- Scholarships
- Notifications and support

### Staff / administration
- Role-based access model
- Admissions operations
- Finance operations
- Registry operations
- Faculty administration
- Communications/CMS
- Super-admin governance
- Audit logging
- Webhook event log
- Content workflow: Draft → Review → Scheduled → Published → Archived

### Backend
- Supabase/Postgres
- Row Level Security policies
- Private Storage
- Supabase Edge Functions
- Paystack webhook verification scaffold
- Payment intent scaffold
- Signed private document URL scaffold
- Notification log
- Support system
- Data-subject request workflow

## Important production rule
The browser is never authoritative for permission, payment success, admission status or private document access.

## Configuration
Copy `.env.example` into the deployment environment. Only the Supabase URL and anon key belong in browser configuration. Payment secrets, service-role keys, SMTP keys and provider tokens belong only in Supabase Edge Functions/server infrastructure.

## Database
Run, in order:
1. `supabase/schema.sql`
2. `supabase/migrations/001_platform_core.sql`
3. `supabase/migrations/002_student_lifecycle.sql`

Review every RLS policy against the final institutional roles before launch.

## Payment
The platform is structured for server-verified Paystack transactions. A browser callback must never mark a payment successful. Configure the Paystack webhook to `paystack-webhook` and set `PAYSTACK_SECRET_KEY` + `SUPABASE_SERVICE_ROLE_KEY` only as Edge Function secrets.

## Content verification
Populate sensitive facts only from authoritative CUN/NUC documents and approved institutional records. Every fee, leadership title, programme/accreditation status, contact channel, social account, partnership and statistic should have a source and review date.

## Legal
The privacy/terms/cookie material is a product framework, not legal advice. Obtain Nigerian privacy/legal counsel review before production, including NDPA, retention, minors, admissions records, payment processors, analytics consent, cross-border processing and data-subject rights.

## Testing
Run:

```bash
npm run check
```

The static check blocks known demo credentials/content from returning to the repository.

## Future development
Do **not** start a separate file/project for every new function. Add new capabilities to the same platform using:
- `js/services/` for browser service modules
- `supabase/migrations/` for schema changes
- `supabase/functions/` for trusted server operations
- existing portal/CMS surfaces for UI
- `docs/` for security, operations and feature specifications
- tests for every new workflow

The target is one coherent CUN digital platform, not a collection of disconnected pages.
