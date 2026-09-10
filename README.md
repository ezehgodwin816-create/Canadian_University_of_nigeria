# Canadian University of Nigeria — Production Web Platform

This package upgrades the existing CUN website without removing the working site structure, existing image assets, authentication flow, application workflow or responsive portal navigation.

## Included
- Premium responsive public website layer
- Structured programme/faculty/department catalogue
- Programme search and filtering
- Admissions and 14-step application guide
- Fees and authenticated payment guidance
- News and events content system
- Global search
- FAQ search
- Contact enquiry form backed by Supabase
- Student portal with fee_records-first finance loading and Paystack payment flow
- Staff portal using live permitted database records
- Authorised admin dashboard for applications, users, programmes, news, events and audit log
- SEO metadata, canonical URLs, robots.txt, sitemap and JSON-ready structured content architecture
- Accessibility and mobile improvements
- Existing assets preserved

## Important deployment step
Run `supabase/FINAL_DEPLOY.sql` and then `supabase/CONTENT_MANAGEMENT.sql` in Supabase. The SQL is designed for RLS and uses only browser-safe public configuration in `js/config.js`. Never place a service-role or secret key in frontend files.

## Public data policy
The public CUN website currently exposes a limited institutional profile. This build therefore uses verified public regulatory records and published launch reports for the academic catalogue and avoids inventing staff, fees, phone numbers, social accounts, rankings or programme accreditation claims.

## GitHub Pages
The site remains static and deployable from the repository root. Supabase provides authentication, database, storage and payment verification services.
