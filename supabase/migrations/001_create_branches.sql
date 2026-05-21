-- ============================================================
-- Migration 001: Tabel branches (cabang/toko)
-- Tabel utama untuk sistem multi-cabang
-- ============================================================

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index untuk filter cabang aktif
create index idx_branches_active on public.branches (is_active);

comment on table public.branches is 'Data cabang/toko. Root entity untuk isolasi data multi-cabang.';
