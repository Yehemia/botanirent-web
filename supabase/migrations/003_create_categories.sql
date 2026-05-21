-- ============================================================
-- Migration 003: Tabel categories (kategori barang)
-- Pemisahan: Sewa, Retail Home Industry, Retail Reseller
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('sewa', 'retail')),
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Kategori barang: Sewa, Retail Home Industry, Retail Reseller.';

-- Seed kategori default
insert into public.categories (name, type, sort_order) values
  ('Paket Sewa', 'sewa', 1),
  ('Sewa Satuan', 'sewa', 2),
  ('Retail Home Industry', 'retail', 3),
  ('Retail Reseller', 'retail', 4);
