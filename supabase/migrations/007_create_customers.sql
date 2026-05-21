-- ============================================================
-- Migration 007: Tabel customers (data pelanggan/penyewa)
-- Diinput oleh kasir, bukan oleh pelanggan sendiri
-- ============================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index untuk pencarian pelanggan
create index idx_customers_branch on public.customers (branch_id);
create index idx_customers_name on public.customers (branch_id, full_name);
create index idx_customers_phone on public.customers (branch_id, phone);

comment on table public.customers is 'Data pelanggan/penyewa. Diinput oleh kasir untuk tracking penyewaan.';
