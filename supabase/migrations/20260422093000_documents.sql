create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  linked_service_id uuid references public.services(id) on delete set null,
  document_type text not null check (document_type in ('quote', 'invoice')),
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'approved', 'rejected', 'paid', 'past_due', 'void')
  ),
  document_number text not null unique,
  title text,
  summary text,
  notes text,
  terms text,
  issue_date date not null default current_date,
  due_date date,
  expires_on date,
  tax_rate decimal(5,2) not null default 0,
  discount_amount decimal(10,2) not null default 0,
  deposit_amount decimal(10,2) not null default 0,
  subtotal decimal(10,2) not null default 0,
  tax_amount decimal(10,2) not null default 0,
  total decimal(10,2) not null default 0,
  balance_due decimal(10,2) not null default 0,
  share_enabled boolean not null default true,
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  viewed_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  sort_order int not null default 0,
  description text not null,
  quantity decimal(10,2) not null default 1,
  unit_price decimal(10,2) not null default 0,
  line_total decimal(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_client on public.documents (client_id, created_at desc);
create index if not exists idx_documents_type on public.documents (document_type, status);
create index if not exists idx_documents_token on public.documents (public_token);
create index if not exists idx_document_items_document on public.document_items (document_id, sort_order asc);

drop trigger if exists trg_documents_updated on public.documents;
create trigger trg_documents_updated
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_document_items_updated on public.document_items;
create trigger trg_document_items_updated
before update on public.document_items
for each row execute function public.set_updated_at();

alter table public.documents enable row level security;
alter table public.document_items enable row level security;

drop policy if exists "Authenticated users full access" on public.documents;
create policy "Authenticated users full access"
on public.documents for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users full access" on public.document_items;
create policy "Authenticated users full access"
on public.document_items for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
