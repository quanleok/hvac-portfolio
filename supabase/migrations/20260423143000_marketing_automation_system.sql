-- Marketing automation system.
-- Adds campaign, asset, OpenClaw job, and audit-event tables while keeping the
-- existing marketing_posts/manual launchpad flow intact.

create extension if not exists pgcrypto;

alter table public.marketing_posts
  drop constraint if exists marketing_posts_status_check;

alter table public.marketing_posts
  add constraint marketing_posts_status_check
  check (status in ('draft', 'needs_ai', 'ready', 'scheduled', 'posted', 'failed', 'archived'));

create table if not exists public.marketing_campaigns (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  status             text not null default 'active'
                     check (status in ('active', 'paused', 'completed', 'archived')),
  template_key        text,
  title              text,
  body               text,
  offer              text,
  call_to_action     text,
  notes              text,
  selected_platforms text[] not null default '{}',
  media_strategy     text not null default 'text-only'
                     check (media_strategy in ('library', 'upload', 'generate-now', 'queue-ai', 'text-only')),
  scheduled_at       timestamptz,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

insert into public.marketing_campaigns (
  id,
  name,
  template_key,
  title,
  body,
  offer,
  call_to_action,
  notes,
  selected_platforms,
  media_strategy,
  scheduled_at,
  created_by,
  created_at,
  updated_at
)
select distinct on (p.campaign_id)
  p.campaign_id,
  coalesce(p.campaign_name, p.title, nullif(left(p.body, 60), ''), 'Marketing queue item'),
  p.workflow ->> 'templateKey',
  p.title,
  p.body,
  p.workflow ->> 'offer',
  p.workflow ->> 'callToAction',
  p.workflow ->> 'notes',
  coalesce(
    array(
      select jsonb_array_elements_text(
        case
          when jsonb_typeof(p.workflow -> 'selectedPlatforms') = 'array'
            then p.workflow -> 'selectedPlatforms'
          else '[]'::jsonb
        end
      )
    ),
    array[p.platform]
  ),
  coalesce(p.workflow ->> 'mediaMode', 'text-only'),
  p.scheduled_at,
  p.created_by,
  p.created_at,
  p.updated_at
from public.marketing_posts p
where p.campaign_id is not null
on conflict (id) do nothing;

alter table public.marketing_posts
  drop constraint if exists marketing_posts_campaign_id_fkey;

alter table public.marketing_posts
  add constraint marketing_posts_campaign_id_fkey
  foreign key (campaign_id) references public.marketing_campaigns(id) on delete cascade;

create table if not exists public.marketing_assets (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.marketing_campaigns(id) on delete cascade,
  post_id         uuid references public.marketing_posts(id) on delete cascade,
  media_id        uuid references public.media(id) on delete set null,
  generation_id   uuid references public.ai_generations(id) on delete set null,
  source          text not null check (source in ('library', 'upload', 'ai', 'openclaw')),
  kind            text not null check (kind in ('image', 'video', 'audio')),
  storage_path    text,
  external_url    text,
  mime_type       text,
  size_bytes      bigint,
  label           text,
  approval_status text not null default 'approved'
                  check (approval_status in ('draft', 'approved', 'rejected')),
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create table if not exists public.marketing_agent_jobs (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.marketing_campaigns(id) on delete cascade,
  post_id      uuid references public.marketing_posts(id) on delete cascade,
  job_type     text not null
               check (job_type in ('adapt_copy', 'generate_image', 'generate_video', 'assemble_video', 'publish', 'manual_review')),
  status       text not null default 'queued'
               check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  priority     int not null default 0,
  input        jsonb not null default '{}'::jsonb,
  output       jsonb not null default '{}'::jsonb,
  error        text,
  attempts     int not null default 0,
  locked_at    timestamptz,
  locked_by    text,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.marketing_events (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete cascade,
  post_id     uuid references public.marketing_posts(id) on delete cascade,
  actor       text not null default 'admin',
  event_type  text not null,
  event_data  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_marketing_campaigns_status_updated
  on public.marketing_campaigns (status, updated_at desc);

create index if not exists idx_marketing_posts_campaign_status
  on public.marketing_posts (campaign_id, status, updated_at desc);

create index if not exists idx_marketing_assets_campaign
  on public.marketing_assets (campaign_id, created_at desc);

create index if not exists idx_marketing_assets_post
  on public.marketing_assets (post_id, created_at desc);

create index if not exists idx_marketing_agent_jobs_status_priority
  on public.marketing_agent_jobs (status, priority desc, created_at);

create index if not exists idx_marketing_agent_jobs_post_status
  on public.marketing_agent_jobs (post_id, status);

create index if not exists idx_marketing_events_campaign
  on public.marketing_events (campaign_id, created_at desc);

drop trigger if exists trg_marketing_campaigns_updated on public.marketing_campaigns;
create trigger trg_marketing_campaigns_updated
before update on public.marketing_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists trg_marketing_agent_jobs_updated on public.marketing_agent_jobs;
create trigger trg_marketing_agent_jobs_updated
before update on public.marketing_agent_jobs
for each row execute function public.set_updated_at();

alter table public.marketing_campaigns enable row level security;
alter table public.marketing_assets enable row level security;
alter table public.marketing_agent_jobs enable row level security;
alter table public.marketing_events enable row level security;

drop policy if exists "Authenticated users manage marketing campaigns" on public.marketing_campaigns;
create policy "Authenticated users manage marketing campaigns"
on public.marketing_campaigns for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage marketing assets" on public.marketing_assets;
create policy "Authenticated users manage marketing assets"
on public.marketing_assets for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage marketing agent jobs" on public.marketing_agent_jobs;
create policy "Authenticated users manage marketing agent jobs"
on public.marketing_agent_jobs for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage marketing events" on public.marketing_events;
create policy "Authenticated users manage marketing events"
on public.marketing_events for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
