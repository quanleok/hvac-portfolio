create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  address text,
  city text,
  zip text,
  source text not null default 'manual' check (source in ('website', 'manual', 'referral')),
  status text not null default 'active' check (status in ('lead', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_date date not null default current_date,
  service_type text not null check (
    service_type in (
      'ac_repair',
      'ac_tuneup',
      'furnace_repair',
      'furnace_tuneup',
      'install',
      'duct',
      'maintenance',
      'inspection',
      'other'
    )
  ),
  description text,
  cost decimal(10,2),
  payment_status text not null default 'paid' check (payment_status in ('paid', 'pending', 'invoiced')),
  follow_up_date date,
  follow_up_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  unit_type text not null check (
    unit_type in ('ac', 'furnace', 'heat_pump', 'mini_split', 'thermostat', 'duct', 'other')
  ),
  brand text,
  model text,
  install_year int,
  warranty_expires date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_name on public.clients using gin (to_tsvector('english', name));
create index if not exists idx_clients_phone on public.clients (phone);
create index if not exists idx_clients_city on public.clients (city);
create index if not exists idx_clients_status on public.clients (status);
create index if not exists idx_clients_created on public.clients (created_at desc);
create index if not exists idx_services_client on public.services (client_id);
create index if not exists idx_services_date on public.services (service_date desc);
create index if not exists idx_services_follow_up on public.services (follow_up_date)
where follow_up_date is not null;
create index if not exists idx_equipment_client on public.equipment (client_id);
create index if not exists idx_notes_client on public.notes (client_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists trg_equipment_updated on public.equipment;
create trigger trg_equipment_updated
before update on public.equipment
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.equipment enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Authenticated users full access" on public.clients;
create policy "Authenticated users full access"
on public.clients for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users full access" on public.services;
create policy "Authenticated users full access"
on public.services for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users full access" on public.equipment;
create policy "Authenticated users full access"
on public.equipment for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users full access" on public.notes;
create policy "Authenticated users full access"
on public.notes for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create or replace function public.search_clients(search_term text)
returns setof public.clients
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.clients
  where
    name ilike '%' || search_term || '%'
    or phone ilike '%' || search_term || '%'
    or address ilike '%' || search_term || '%'
    or city ilike '%' || search_term || '%'
    or email ilike '%' || search_term || '%'
  order by updated_at desc;
$$;
