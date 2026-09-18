create extension if not exists pgcrypto;

-- 1. media_sections: one row per "slot" on the site. Pre-seeded; admin edits config only.
create table if not exists public.media_sections (
  id text primary key,
  title text not null,
  kind text not null check (kind in ('single', 'strip')),
  enabled boolean not null default true,
  layout text not null default 'marquee' check (layout in ('marquee', 'grid', 'carousel')),
  scroll_direction text not null default 'left' check (scroll_direction in ('left', 'right')),
  scroll_speed text not null default 'medium' check (scroll_speed in ('slow', 'medium', 'fast')),
  items_visible int not null default 4 check (items_visible between 2 and 6),
  show_captions boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. media: one row per uploaded asset.
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video')),
  storage_path text not null,
  caption text,
  alt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. media_assignments: join table. One media can be in many sections.
create table if not exists public.media_assignments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete cascade,
  section_id text not null references public.media_sections(id) on delete cascade,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_id, section_id)
);

create index if not exists idx_media_created on public.media (created_at desc);
create index if not exists idx_media_assignments_section on public.media_assignments (section_id, sort_order);
create index if not exists idx_media_assignments_media on public.media_assignments (media_id);
create index if not exists idx_media_sections_sort on public.media_sections (sort_order);

drop trigger if exists trg_media_sections_updated on public.media_sections;
create trigger trg_media_sections_updated
before update on public.media_sections
for each row execute function public.set_updated_at();

drop trigger if exists trg_media_updated on public.media;
create trigger trg_media_updated
before update on public.media
for each row execute function public.set_updated_at();

drop trigger if exists trg_media_assignments_updated on public.media_assignments;
create trigger trg_media_assignments_updated
before update on public.media_assignments
for each row execute function public.set_updated_at();

alter table public.media_sections enable row level security;
alter table public.media enable row level security;
alter table public.media_assignments enable row level security;

-- Public read: anyone on the site can SELECT sections + published media + published assignments.
drop policy if exists "Public read sections" on public.media_sections;
create policy "Public read sections"
on public.media_sections for select
using (true);

drop policy if exists "Public read media" on public.media;
create policy "Public read media"
on public.media for select
using (true);

drop policy if exists "Public read published assignments" on public.media_assignments;
create policy "Public read published assignments"
on public.media_assignments for select
using (published = true);

-- Authenticated (admin) full access.
drop policy if exists "Authenticated users manage sections" on public.media_sections;
create policy "Authenticated users manage sections"
on public.media_sections for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage media" on public.media;
create policy "Authenticated users manage media"
on public.media for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage assignments" on public.media_assignments;
create policy "Authenticated users manage assignments"
on public.media_assignments for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Seed sections.
insert into public.media_sections (id, title, kind, sort_order) values
  ('hero-video',          'Hero video',                    'single', 10),
  ('about-building',      'About · building front',        'single', 20),
  ('tech-action-video',   'Tech action video',             'single', 30),
  ('service-area-video',  'Service area video',            'single', 40),
  ('technician-portrait', 'Technician portrait',           'single', 50),
  ('office-more',         'More from our office',          'strip',  60),
  ('team-at-work',        'Our team at work',              'strip',  70),
  ('equipment-installed', 'Equipment we install',          'strip',  80),
  ('field-locations',     'Field locations',               'strip',  90),
  ('gallery-people',      'Gallery · People',              'strip', 100),
  ('gallery-work',        'Gallery · Work',                'strip', 110),
  ('gallery-location',    'Gallery · Location',            'strip', 120),
  ('gallery-reviews',     'Gallery · Reviews',             'strip', 130)
on conflict (id) do nothing;
