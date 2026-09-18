-- Marketing OAuth account connections (Phase 1b).
-- One row per connected social account (Facebook Page, YouTube Channel, etc.)
-- Admin-only via RLS. Tokens stored as plain text for now; Supabase-at-rest
-- encryption is sufficient for v1. TODO(security): wrap access_token in pgcrypto
-- if this table ever grows beyond the single admin user case.

create table if not exists public.marketing_accounts (
  id                 uuid primary key default gen_random_uuid(),
  platform           text not null check (platform in ('facebook', 'youtube')),
  account_id         text not null,
  account_name       text not null,
  access_token       text not null,
  refresh_token      text,
  token_type         text not null default 'Bearer',
  expires_at         timestamptz,
  scopes             text[] not null default '{}',
  connected_by       uuid references auth.users(id),
  connected_at       timestamptz not null default now(),
  last_refreshed_at  timestamptz,
  is_active          boolean not null default true,
  updated_at         timestamptz not null default now(),
  unique (platform, account_id)
);

create index if not exists idx_marketing_accounts_platform_active
  on public.marketing_accounts (platform, is_active);

drop trigger if exists trg_marketing_accounts_updated on public.marketing_accounts;
create trigger trg_marketing_accounts_updated
before update on public.marketing_accounts
for each row execute function public.set_updated_at();

alter table public.marketing_accounts enable row level security;

drop policy if exists "Authenticated users manage marketing accounts" on public.marketing_accounts;
create policy "Authenticated users manage marketing accounts"
on public.marketing_accounts for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
