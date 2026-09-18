-- Marketing Studio upgrade.
-- Expands platform coverage and stores queue/workflow metadata for
-- multi-platform campaign planning and later AI/OpenClaw automation.

alter table public.marketing_posts
  add column if not exists campaign_id uuid,
  add column if not exists campaign_name text,
  add column if not exists workflow jsonb not null default '{}'::jsonb;

update public.marketing_posts
set campaign_id = id
where campaign_id is null;

alter table public.marketing_posts
  alter column campaign_id set not null;

alter table public.marketing_posts
  drop constraint if exists marketing_posts_platform_check;

alter table public.marketing_posts
  add constraint marketing_posts_platform_check
  check (platform in ('facebook', 'sms', 'email', 'tiktok', 'youtube'));

create index if not exists idx_marketing_posts_campaign
  on public.marketing_posts (campaign_id, updated_at desc);

alter table public.marketing_accounts
  drop constraint if exists marketing_accounts_platform_check;

alter table public.marketing_accounts
  add constraint marketing_accounts_platform_check
  check (platform in ('facebook', 'sms', 'email', 'tiktok', 'youtube'));
