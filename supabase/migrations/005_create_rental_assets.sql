-- ============================================================
-- Migration 005: Tabel rental_assets (unit fisik barang sewa)
-- Setiap unit punya kode aset & status independen
-- ============================================================

create table public.rental_assets (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  asset_code text not null,
  status text not null default 'ready' check (status in ('ready', 'rented', 'maintenance', 'washing')),
  notes text,
  last_status_change timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index untuk cari aset berdasarkan item dan status
create index idx_rental_assets_item on public.rental_assets (item_id);
create index idx_rental_assets_status on public.rental_assets (item_id, status);

-- Kode aset harus unik per item
create unique index idx_rental_assets_code_unique
  on public.rental_assets (item_id, asset_code);

comment on table public.rental_assets is 'Unit fisik individual barang sewa. 1 item bisa punya banyak unit.';
