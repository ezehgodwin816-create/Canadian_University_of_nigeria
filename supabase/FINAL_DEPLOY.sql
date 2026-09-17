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
-- CUN Digital Platform: production core extension.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, role_id)
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check(content_type in ('page','news','event','announcement','faq','download','media','partnership','research','leadership','statistic')),
  slug text not null,
  title text not null,
  excerpt text,
  body jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check(status in ('draft','review','scheduled','published','archived')),
  published_at timestamptz,
  scheduled_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(content_type, slug)
);
create index if not exists content_items_search_idx on public.content_items using gin ((title || ' ' || coalesce(excerpt,'')) gin_trgm_ops);
create index if not exists content_items_publish_idx on public.content_items(content_type,status,published_at);

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.application_checklist (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  item_key text not null,
  label text not null,
  required boolean not null default true,
  state text not null default 'missing' check(state in ('missing','received','verified','rejected')),
  note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  unique(application_id,item_key)
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  offer_number text unique not null,
  programme_id uuid references public.programmes(id) on delete set null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'issued' check(status in ('issued','accepted','declined','expired','withdrawn')),
  letter_path text,
  accepted_at timestamptz
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  invoice_number text unique not null,
  currency char(3) not null default 'NGN',
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  due_date date,
  status text not null default 'open' check(status in ('draft','open','paid','partial','void','overdue')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check(amount >= 0),
  quantity integer not null default 1 check(quantity > 0)
);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  channel text not null check(channel in ('email','sms','whatsapp','in_app')),
  template text not null,
  destination text,
  provider_message_id text,
  status text not null default 'queued' check(status in ('queued','sent','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete set null,
  category text not null,
  subject text not null,
  description text not null,
  status text not null default 'open' check(status in ('open','in_progress','waiting','resolved','closed')),
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  message text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider,event_id)
);

create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete set null,
  request_type text not null check(request_type in ('access','correction','deletion','restriction','export','complaint')),
  status text not null default 'received' check(status in ('received','in_review','fulfilled','rejected','closed')),
  details text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

insert into public.roles(code,name) values
 ('super_admin','Super Administrator'),('admissions','Admissions'),('finance','Finance'),('registry','Registry'),('faculty_admin','Faculty Administration'),('communications','Communications'),('staff','Staff'),('student','Student'),('applicant','Applicant')
on conflict(code) do nothing;

-- helper: role lookup without recursive RLS.
create or replace function public.has_role(role_code text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=auth.uid() and r.code=role_code);
$$;

create or replace function public.is_privileged()
returns boolean language sql stable security definer set search_path=public as $$
 select public.has_role('super_admin') or public.has_role('admissions') or public.has_role('finance') or public.has_role('registry') or public.has_role('faculty_admin') or public.has_role('communications');
$$;

alter table public.site_settings enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.content_items enable row level security;
alter table public.application_status_history enable row level security;
alter table public.application_checklist enable row level security;
alter table public.offers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.notification_log enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.webhook_events enable row level security;
alter table public.data_requests enable row level security;

create policy "public read published content" on public.content_items for select using(status='published' and (published_at is null or published_at <= now()));
create policy "privileged manage content" on public.content_items for all using(public.is_privileged()) with check(public.is_privileged());
create policy "public read public settings" on public.site_settings for select using(is_public=true);
create policy "admins manage settings" on public.site_settings for all using(public.has_role('super_admin')) with check(public.has_role('super_admin'));
create policy "users read own roles" on public.user_roles for select using(user_id=auth.uid() or public.has_role('super_admin'));
create policy "super admins manage roles" on public.user_roles for all using(public.has_role('super_admin')) with check(public.has_role('super_admin'));
create policy "applicant read own history" on public.application_status_history for select using(exists(select 1 from public.applications a where a.id=application_id and a.user_id=auth.uid()) or public.is_privileged());
create policy "staff create history" on public.application_status_history for insert with check(public.is_privileged());
create policy "applicant read own checklist" on public.application_checklist for select using(exists(select 1 from public.applications a where a.id=application_id and a.user_id=auth.uid()) or public.is_privileged());
create policy "staff manage checklist" on public.application_checklist for all using(public.is_privileged()) with check(public.is_privileged());
create policy "applicant read own offers" on public.offers for select using(exists(select 1 from public.applications a where a.id=application_id and a.user_id=auth.uid()) or public.is_privileged());
create policy "staff manage offers" on public.offers for all using(public.is_privileged()) with check(public.is_privileged());
create policy "users read own invoices" on public.invoices for select using(profile_id=auth.uid() or public.is_privileged());
create policy "finance manage invoices" on public.invoices for all using(public.has_role('finance') or public.has_role('super_admin')) with check(public.has_role('finance') or public.has_role('super_admin'));
create policy "users read own invoice items" on public.invoice_items for select using(exists(select 1 from public.invoices i where i.id=invoice_id and (i.profile_id=auth.uid() or public.is_privileged())));
create policy "finance manage invoice items" on public.invoice_items for all using(public.has_role('finance') or public.has_role('super_admin')) with check(public.has_role('finance') or public.has_role('super_admin'));
create policy "users read own notifications" on public.notification_log for select using(user_id=auth.uid() or public.is_privileged());
create policy "staff read tickets" on public.support_tickets for select using(requester_id=auth.uid() or public.is_privileged());
create policy "users create tickets" on public.support_tickets for insert with check(requester_id=auth.uid());
create policy "staff manage tickets" on public.support_tickets for update using(public.is_privileged()) with check(public.is_privileged());
create policy "ticket participants read messages" on public.support_messages for select using(exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.requester_id=auth.uid() or public.is_privileged())));
create policy "ticket participants create messages" on public.support_messages for insert with check(author_id=auth.uid() and exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.requester_id=auth.uid() or public.is_privileged())));
create policy "admins read webhook events" on public.webhook_events for select using(public.has_role('super_admin'));
create policy "users create data requests" on public.data_requests for insert with check(requester_id=auth.uid());
create policy "users read own data requests" on public.data_requests for select using(requester_id=auth.uid() or public.is_privileged());
create policy "staff manage data requests" on public.data_requests for update using(public.has_role('registry') or public.has_role('super_admin')) with check(public.has_role('registry') or public.has_role('super_admin'));
-- CUN Digital Platform: student lifecycle, academic records, services and governance.
create table if not exists public.academic_sessions(id uuid primary key default gen_random_uuid(),name text unique not null,start_date date,end_date date,is_current boolean default false);
create table if not exists public.courses(id uuid primary key default gen_random_uuid(),code text unique not null,title text not null,credit_units integer not null default 1 check(credit_units>0),department_id uuid references public.departments(id) on delete set null,level integer,description text,is_active boolean default true);
create table if not exists public.course_offerings(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id) on delete cascade,session_id uuid references public.academic_sessions(id) on delete cascade,semester text not null,lecturer_id uuid references public.profiles(id) on delete set null,capacity integer,room text,timetable jsonb not null default '{}'::jsonb,unique(course_id,session_id,semester));
create table if not exists public.enrolments(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles(id) on delete cascade,offering_id uuid not null references public.course_offerings(id) on delete cascade,status text not null default 'registered' check(status in ('registered','dropped','completed','withdrawn')),created_at timestamptz default now(),unique(student_id,offering_id));
create table if not exists public.assessments(id uuid primary key default gen_random_uuid(),offering_id uuid not null references public.course_offerings(id) on delete cascade,name text not null,max_score numeric(6,2) not null check(max_score>0),weight numeric(6,2) not null check(weight>=0 and weight<=100));
create table if not exists public.grades(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.assessments(id) on delete cascade,student_id uuid not null references public.profiles(id) on delete cascade,score numeric(8,2) check(score>=0),grade text,status text default 'draft' check(status in ('draft','submitted','approved','published')),updated_at timestamptz default now(),unique(assessment_id,student_id));
create table if not exists public.transcript_requests(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles(id) on delete cascade,destination text,delivery_method text,status text default 'requested' check(status in ('requested','processing','ready','collected','cancelled')),fee_payment_id uuid references public.payments(id) on delete set null,created_at timestamptz default now());
create table if not exists public.attendance(id uuid primary key default gen_random_uuid(),offering_id uuid not null references public.course_offerings(id) on delete cascade,student_id uuid not null references public.profiles(id) on delete cascade,class_date date not null,state text not null check(state in ('present','absent','excused','late')),unique(offering_id,student_id,class_date));
create table if not exists public.hostel_rooms(id uuid primary key default gen_random_uuid(),building text not null,room_number text not null,beds integer not null check(beds>0),available_beds integer not null check(available_beds>=0),gender text,active boolean default true,unique(building,room_number));
create table if not exists public.hostel_allocations(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles(id) on delete cascade,room_id uuid not null references public.hostel_rooms(id) on delete restrict,session_id uuid references public.academic_sessions(id) on delete set null,status text default 'active' check(status in ('requested','allocated','active','ended','cancelled')),created_at timestamptz default now());
create table if not exists public.scholarship_applications(id uuid primary key default gen_random_uuid(),scholarship_id uuid not null references public.scholarships(id) on delete cascade,applicant_id uuid not null references public.profiles(id) on delete cascade,status text default 'submitted' check(status in ('draft','submitted','under_review','approved','rejected')),statement text,documents jsonb default '[]'::jsonb,created_at timestamptz default now(),unique(scholarship_id,applicant_id));
create table if not exists public.job_posts(id uuid primary key default gen_random_uuid(),title text not null,department text,description text not null,closing_date date,status text default 'open' check(status in ('draft','open','closed','archived')),created_at timestamptz default now());
create table if not exists public.job_applications(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.job_posts(id) on delete cascade,applicant_email text not null,full_name text not null,cv_path text,cover_letter text,status text default 'received' check(status in ('received','screening','shortlisted','interview','offered','rejected')),created_at timestamptz default now());
create table if not exists public.research_projects(id uuid primary key default gen_random_uuid(),title text not null,summary text,lead_id uuid references public.profiles(id) on delete set null,status text default 'active',start_date date,end_date date,metadata jsonb default '{}'::jsonb);
create table if not exists public.research_members(project_id uuid references public.research_projects(id) on delete cascade,profile_id uuid references public.profiles(id) on delete cascade,role text,primary key(project_id,profile_id));
create table if not exists public.feedback(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete set null,area text,score integer check(score between 1 and 5),message text,created_at timestamptz default now());
create table if not exists public.consent_records(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete set null,consent_type text not null,version text not null,granted boolean not null,source text,created_at timestamptz default now());

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check(status in ('draft','received','under_review','additional_info','accepted','rejected','withdrawn'));
drop policy if exists "applicant update own applications" on public.applications; create policy "applicant update own applications" on public.applications for update using(auth.uid()=user_id) with check(auth.uid()=user_id);

alter table public.academic_sessions enable row level security; alter table public.courses enable row level security; alter table public.course_offerings enable row level security; alter table public.enrolments enable row level security; alter table public.assessments enable row level security; alter table public.grades enable row level security; alter table public.transcript_requests enable row level security; alter table public.attendance enable row level security; alter table public.hostel_rooms enable row level security; alter table public.hostel_allocations enable row level security; alter table public.scholarship_applications enable row level security; alter table public.job_posts enable row level security; alter table public.job_applications enable row level security; alter table public.research_projects enable row level security; alter table public.research_members enable row level security; alter table public.feedback enable row level security; alter table public.consent_records enable row level security;

create policy "public read current sessions" on public.academic_sessions for select using(is_current=true);
create policy "public read active courses" on public.courses for select using(is_active=true);
create policy "public read offerings" on public.course_offerings for select using(true);
create policy "students read own enrolments" on public.enrolments for select using(student_id=auth.uid() or public.is_privileged());
create policy "students create own enrolments" on public.enrolments for insert with check(student_id=auth.uid());
create policy "staff manage enrolments" on public.enrolments for all using(public.is_privileged()) with check(public.is_privileged());
create policy "students read own grades" on public.grades for select using(student_id=auth.uid() or public.is_privileged());
create policy "staff manage grades" on public.grades for all using(public.is_privileged()) with check(public.is_privileged());
create policy "students manage transcript requests" on public.transcript_requests for select using(student_id=auth.uid() or public.is_privileged());
create policy "students create transcript requests" on public.transcript_requests for insert with check(student_id=auth.uid());
create policy "registry manage transcript requests" on public.transcript_requests for all using(public.has_role('registry') or public.has_role('super_admin')) with check(public.has_role('registry') or public.has_role('super_admin'));
create policy "students read attendance" on public.attendance for select using(student_id=auth.uid() or public.is_privileged());
create policy "staff manage attendance" on public.attendance for all using(public.is_privileged()) with check(public.is_privileged());
create policy "students read rooms" on public.hostel_rooms for select using(active=true);
create policy "students read own hostel" on public.hostel_allocations for select using(student_id=auth.uid() or public.is_privileged());
create policy "students request hostel" on public.hostel_allocations for insert with check(student_id=auth.uid());
create policy "staff manage hostel" on public.hostel_allocations for all using(public.is_privileged()) with check(public.is_privileged());
create policy "applicants read own scholarship applications" on public.scholarship_applications for select using(applicant_id=auth.uid() or public.is_privileged());
create policy "applicants create scholarship applications" on public.scholarship_applications for insert with check(applicant_id=auth.uid());
create policy "scholarship staff manage" on public.scholarship_applications for all using(public.is_privileged()) with check(public.is_privileged());
create policy "public read open jobs" on public.job_posts for select using(status='open');
create policy "staff manage jobs" on public.job_posts for all using(public.has_role('registry') or public.has_role('super_admin')) with check(public.has_role('registry') or public.has_role('super_admin'));
create policy "applicant read own job applications" on public.job_applications for select using(lower(applicant_email)=lower(coalesce(auth.jwt()->>'email','')) or public.is_privileged());
create policy "public create job application" on public.job_applications for insert with check(length(full_name) between 2 and 200 and length(applicant_email) between 5 and 320);
create policy "public read research" on public.research_projects for select using(true);
create policy "public read research members" on public.research_members for select using(true);
create policy "users create feedback" on public.feedback for insert with check(user_id=auth.uid() or user_id is null);
create policy "users manage own consent" on public.consent_records for select using(user_id=auth.uid() or public.is_privileged());
create policy "users create consent" on public.consent_records for insert with check(user_id=auth.uid());
update storage.buckets set public=false, file_size_limit=10485760, allowed_mime_types=array['application/pdf','image/jpeg','image/png'] where id='application-documents';
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
