-- CUN production content-management extension
-- Run after FINAL_DEPLOY.sql in Supabase SQL Editor.

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(), title text not null, slug text unique,
  category text not null, excerpt text, body text, image_url text, published_at timestamptz,
  is_published boolean not null default false, author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), title text not null, category text,
  event_date date not null, start_time time, end_time time, location text, description text,
  image_url text, registration_url text, is_published boolean not null default false,
  author_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.site_documents (
  id uuid primary key default gen_random_uuid(), title text not null, category text,
  file_path text not null, description text, is_published boolean not null default false,
  author_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null, body text not null,
  published_at timestamptz, is_published boolean not null default false,
  author_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(), title text not null, category text,
  image_url text not null, alt_text text, is_published boolean not null default false,
  author_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.faq_entries (
  id uuid primary key default gen_random_uuid(), category text not null, question text not null,
  answer text not null, is_published boolean not null default false,
  author_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);

alter table public.news_posts enable row level security;
alter table public.events enable row level security;
alter table public.site_documents enable row level security;
alter table public.announcements enable row level security;
alter table public.gallery_items enable row level security;
alter table public.faq_entries enable row level security;

drop policy if exists "public read published news" on public.news_posts;
create policy "public read published news" on public.news_posts for select using(is_published=true and published_at <= now());
drop policy if exists "admin manage news" on public.news_posts;
create policy "admin manage news" on public.news_posts for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public read published events" on public.events;
create policy "public read published events" on public.events for select using(is_published=true);
drop policy if exists "admin manage events" on public.events;
create policy "admin manage events" on public.events for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public read published documents" on public.site_documents;
create policy "public read published documents" on public.site_documents for select using(is_published=true);
drop policy if exists "admin manage documents" on public.site_documents;
create policy "admin manage documents" on public.site_documents for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public read published announcements" on public.announcements;
create policy "public read published announcements" on public.announcements for select using(is_published=true and published_at <= now());
drop policy if exists "admin manage announcements" on public.announcements;
create policy "admin manage announcements" on public.announcements for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public read published gallery" on public.gallery_items;
create policy "public read published gallery" on public.gallery_items for select using(is_published=true);
drop policy if exists "admin manage gallery" on public.gallery_items;
create policy "admin manage gallery" on public.gallery_items for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public read published faq" on public.faq_entries;
create policy "public read published faq" on public.faq_entries for select using(is_published=true);
drop policy if exists "admin manage faq" on public.faq_entries;
create policy "admin manage faq" on public.faq_entries for all using(public.is_admin()) with check(public.is_admin());

-- Allow an authenticated student to create a payment tied to their own fee record.
drop policy if exists "students create own payments" on public.payments;
create policy "students create own payments" on public.payments for insert to authenticated
with check(student_id=auth.uid());

-- Seed the verified public academic catalogue if the database catalogue is empty.
insert into public.faculties(code,name,description) values
('HS','Health Sciences','Health-related academic area publicly reported among CUN initial programmes.'),
('SC','School of Computing','Computing academic area publicly reported among CUN initial programmes.'),
('MSS','Management & Social Sciences','Management and social sciences academic area publicly reported among CUN initial programmes.')
on conflict(code) do update set name=excluded.name, description=excluded.description;

insert into public.departments(faculty_id,name)
select f.id,v.name from (values ('HS','Health Sciences'),('SC','Computing'),('MSS','Management & Social Sciences')) v(code,name)
join public.faculties f on f.code=v.code
where not exists(select 1 from public.departments d where d.faculty_id=f.id and lower(d.name)=lower(v.name));

insert into public.programmes(faculty_id,department_id,name,degree_type,duration,mode,overview,requirements,careers,is_active)
select f.id,d.id,p.name,p.degree_type,p.duration,'Full-time',p.overview,p.requirements,p.careers,true
from (values
('HS','Health Sciences','Physiotherapy','Professional undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('HS','Health Sciences','Public Health','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('HS','Health Sciences','Medical Laboratory Science','Professional undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('HS','Health Sciences','Nursing','Professional undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('SC','Computing','Cyber Security','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('SC','Computing','Information Technology','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('SC','Computing','Data Science','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('SC','Computing','Computer Science','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('MSS','Management & Social Sciences','Banking & Finance','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('MSS','Management & Social Sciences','Business Administration','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('MSS','Management & Social Sciences','Human Resource Management','Undergraduate programme','Programme-specific duration is set by the approved curriculum'),
('MSS','Management & Social Sciences','Mass Communication','Undergraduate programme','Programme-specific duration is set by the approved curriculum')
) p(code,department_name,name,degree_type,duration)
join public.faculties f on f.code=p.code
join public.departments d on d.faculty_id=f.id and lower(d.name)=lower(p.department_name)
where not exists(select 1 from public.programmes x where lower(x.name)=lower(p.name));
