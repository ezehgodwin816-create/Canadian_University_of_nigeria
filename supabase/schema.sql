-- Canadian University of Nigeria — production Supabase foundation
-- Run in Supabase SQL Editor. Review with counsel/security before production.
create extension if not exists "pgcrypto";

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('staff','admin'));
$$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'applicant' check(role in ('student','staff','admin','applicant')),
  student_id text unique,
  staff_id text unique,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists faculties (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid references faculties(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists programmes (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid references faculties(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  name text not null,
  degree_type text,
  duration text,
  mode text,
  overview text,
  requirements text,
  careers text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  application_number text unique not null default ('CUN-' || to_char(now(),'YYYY') || '-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,8))),
  user_id uuid references profiles(id) on delete set null,
  email text not null,
  first_name text,
  last_name text,
  programme_id uuid references programmes(id) on delete set null,
  programme_name text,
  status text not null default 'received' check(status in ('draft','received','under_review','accepted','rejected','withdrawn')),
  entry_type text,
  study_mode text,
  data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists fee_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  session text not null,
  amount numeric(14,2) not null check(amount >= 0),
  description text not null,
  due_date date,
  status text not null default 'outstanding' check(status in ('outstanding','partial','paid','waived'))
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  fee_record_id uuid references fee_records(id) on delete set null,
  student_id uuid not null references profiles(id) on delete cascade,
  amount numeric(14,2) not null check(amount > 0),
  reference text unique not null,
  provider text not null default 'paystack',
  status text not null default 'pending' check(status in ('pending','success','failed','refunded')),
  paid_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists academic_calendar (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  description text,
  published boolean not null default false
);

create table if not exists scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  eligibility text,
  application_deadline date,
  is_active boolean not null default true
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists applications_email_idx on applications(lower(email));
create index if not exists applications_status_idx on applications(status);
create index if not exists payments_student_idx on payments(student_id);
create index if not exists calendar_dates_idx on academic_calendar(start_date);

-- RLS
do $$ declare t text; begin
  foreach t in array array[
    'profiles','faculties','departments','programmes','applications',
    'application_documents','fee_records','payments','academic_calendar',
    'scholarships','enquiries','audit_log'
  ] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

-- Public catalogue
drop policy if exists "public read active programmes" on programmes;
create policy "public read active programmes" on programmes for select using (is_active=true);

drop policy if exists "public read faculties" on faculties;
create policy "public read faculties" on faculties for select using (true);

drop policy if exists "public read departments" on departments;
create policy "public read departments" on departments for select using (true);

drop policy if exists "public read published calendar" on academic_calendar;
create policy "public read published calendar" on academic_calendar for select using (published=true);

drop policy if exists "public read active scholarships" on scholarships;
create policy "public read active scholarships" on scholarships for select using (is_active=true);

-- Profiles
create policy "own profile read" on profiles for select using (auth.uid()=id or public.is_admin());
create policy "own profile update" on profiles for update using (auth.uid()=id) with check(auth.uid()=id);
create policy "admins manage profiles" on profiles for all using(public.is_admin()) with check(public.is_admin());

-- Applications: applicant sees/creates own; staff can review; no public listing
create policy "applicant read own applications" on applications for select
  using (auth.uid()=user_id or lower(email)=lower(coalesce(auth.jwt()->>'email','')) or public.is_staff());
create policy "applicant create application" on applications for insert
  with check (user_id=auth.uid() or lower(email)=lower(coalesce(auth.jwt()->>'email','')));
create policy "staff manage applications" on applications for update using(public.is_staff()) with check(public.is_staff());

create policy "applicant read own documents" on application_documents for select
  using (exists(select 1 from applications a where a.id=application_id and (a.user_id=auth.uid() or public.is_staff())));
create policy "applicant upload own documents" on application_documents for insert
  with check (exists(select 1 from applications a where a.id=application_id and a.user_id=auth.uid()));

-- Finance: students see their own; staff/admin manage
create policy "student read own fees" on fee_records for select using(student_id=auth.uid() or public.is_staff());
create policy "staff manage fees" on fee_records for all using(public.is_staff()) with check(public.is_staff());

create policy "student read own payments" on payments for select using(student_id=auth.uid() or public.is_staff());
create policy "staff manage payments" on payments for all using(public.is_staff()) with check(public.is_staff());

-- Enquiries: anonymous inserts only; staff can read/manage
create policy "public submit enquiry" on enquiries for insert with check(length(message) between 1 and 5000);
create policy "staff read enquiries" on enquiries for select using(public.is_staff());
create policy "staff update enquiries" on enquiries for update using(public.is_staff()) with check(public.is_staff());

-- Audit is append-only for the application layer; admin reads.
create policy "staff read audit" on audit_log for select using(public.is_admin());
create policy "authenticated write audit" on audit_log for insert with check(auth.uid()=actor_id);

-- Storage
insert into storage.buckets(id,name,public) values ('application-documents','application-documents',false)
on conflict(id) do nothing;

drop policy if exists "users upload application docs" on storage.objects;
create policy "users upload application docs" on storage.objects
for insert to authenticated
with check (
  bucket_id='application-documents'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists "users read own application docs" on storage.objects;
create policy "users read own application docs" on storage.objects
for select to authenticated
using (
  bucket_id='application-documents'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.is_staff())
);

drop policy if exists "staff delete application docs" on storage.objects;
create policy "staff delete application docs" on storage.objects
for delete to authenticated using(bucket_id='application-documents' and public.is_staff());

-- Never expose service-role credentials in the frontend.
