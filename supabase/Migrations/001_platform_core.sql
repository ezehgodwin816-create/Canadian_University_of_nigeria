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
