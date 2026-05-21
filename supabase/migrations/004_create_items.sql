-- ============================================================
-- Migration 004: Tabel items (master data barang)
-- Barang sewa dan retail, terikat per cabang
-- ============================================================

create table public.items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text,
  barcode text,
  image_url text,
  rental_price_per_day numeric(12,2),  -- null jika retail
  sell_price numeric(12,2),            -- null jika sewa
  stock_total int not null default 0,
  stock_available int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index untuk performa query
create index idx_items_branch on public.items (branch_id);
create index idx_items_category on public.items (category_id);
create index idx_items_barcode on public.items (branch_id, barcode);
create index idx_items_active on public.items (branch_id, is_active);

-- Barcode harus unik di dalam satu cabang (boleh null)
create unique index idx_items_barcode_unique
  on public.items (branch_id, barcode)
  where barcode is not null;

comment on table public.items is 'Master data barang (sewa & retail). Stok terpisah per cabang.';
