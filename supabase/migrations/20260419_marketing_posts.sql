-- Marketing social-post composer (Phase 1a).
-- Stores one row per drafted/scheduled/posted social post plus its attached media.
-- Admin-only via RLS; no public read.

create extension if not exists pgcrypto;

-- 1. marketing_posts: one row per Facebook post or YouTube upload.
create table if not exists public.marketing_posts (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null check (platform in ('facebook', 'youtube')),
  status        text not null default 'draft'
                check (status in ('draft', 'scheduled', 'posted', 'archived')),
  body          text,
  title         text,
  scheduled_at  timestamptz,
  reminded_at   timestamptz,
  posted_at     timestamptz,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. marketing_post_media: one row per image/video attached to a post.
create table if not exists public.marketing_post_media (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.marketing_posts(id) on delete cascade,
  kind           text not null check (kind in ('image', 'video')),
  storage_path   text not null,
  mime_type      text not null,
  size_bytes     bigint not null,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_marketing_posts_status_scheduled
  on public.marketing_posts (status, scheduled_at);

create index if not exists idx_marketing_post_media_post
  on public.marketing_post_media (post_id, sort_order);

-- Reuse the shared updated_at trigger function created by 20260417_media_management.sql
drop trigger if exists trg_marketing_posts_updated on public.marketing_posts;
create trigger trg_marketing_posts_updated
before update on public.marketing_posts
for each row execute function public.set_updated_at();

alter table public.marketing_posts enable row level security;
alter table public.marketing_post_media enable row level security;

drop policy if exists "Authenticated users manage marketing posts" on public.marketing_posts;
create policy "Authenticated users manage marketing posts"
on public.marketing_posts for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage marketing post media" on public.marketing_post_media;
create policy "Authenticated users manage marketing post media"
on public.marketing_post_media for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
