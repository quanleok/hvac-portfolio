create table if not exists public.document_presets (
  id uuid primary key default gen_random_uuid(),
  document_type text not null unique check (document_type in ('quote', 'invoice')),
  title text,
  summary text,
  notes text,
  terms text,
  tax_rate decimal(5,2) not null default 0,
  discount_amount decimal(10,2) not null default 0,
  deposit_amount decimal(10,2) not null default 0,
  line_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_presets_type
on public.document_presets (document_type);

drop trigger if exists trg_document_presets_updated on public.document_presets;
create trigger trg_document_presets_updated
before update on public.document_presets
for each row execute function public.set_updated_at();

alter table public.document_presets enable row level security;

drop policy if exists "Authenticated users full access" on public.document_presets;
create policy "Authenticated users full access"
on public.document_presets for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
