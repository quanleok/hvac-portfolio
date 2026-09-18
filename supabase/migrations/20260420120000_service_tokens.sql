-- Service-token authentication for the REST API (Phase 3).
-- External agents use a long-lived bearer token to call /api/v1/marketing/*.
-- Tokens are SHA-256 hashed at rest; only the hash and a display prefix are stored.

create table if not exists public.service_tokens (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  token_hash    text not null unique,
  token_prefix  text not null,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  is_active     boolean not null default true,
  updated_at    timestamptz not null default now()
);

create index if not exists idx_service_tokens_active
  on public.service_tokens (is_active, token_hash);

drop trigger if exists trg_service_tokens_updated on public.service_tokens;
create trigger trg_service_tokens_updated
before update on public.service_tokens
for each row execute function public.set_updated_at();

alter table public.service_tokens enable row level security;

drop policy if exists "Authenticated users manage service tokens" on public.service_tokens;
create policy "Authenticated users manage service tokens"
on public.service_tokens for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
