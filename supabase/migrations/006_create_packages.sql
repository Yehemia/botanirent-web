-- ============================================================
-- Migration 006: Tabel packages & package_items (paket bundling)
-- Paket sewa yang berisi beberapa item dengan harga khusus
-- ============================================================

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  package_price numeric(12,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_packages_branch on public.packages (branch_id);

create table public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  quantity int not null default 1,
  sort_order int not null default 0
);

create index idx_package_items_package on public.package_items (package_id);

-- Cegah item duplikat dalam satu paket
create unique index idx_package_items_unique
  on public.package_items (package_id, item_id);

comment on table public.packages is 'Paket bundling sewa dengan harga khusus.';
comment on table public.package_items is 'Item-item yang termasuk dalam sebuah paket.';
