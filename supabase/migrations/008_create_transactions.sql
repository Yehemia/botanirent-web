-- ============================================================
-- Migration 008: Tabel transactions & transaction_items
-- Header + detail transaksi (sewa, retail, atau hybrid)
-- ============================================================

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  cashier_id uuid not null references public.profiles(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  transaction_code text not null,
  type text not null check (type in ('retail', 'rental', 'hybrid')),
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  change_amount numeric(12,2) not null default 0,
  payment_method text not null check (payment_method in ('cash', 'qris', 'transfer')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'expired')),
  midtrans_transaction_id text,
  midtrans_snap_token text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index untuk query riwayat transaksi
create index idx_transactions_branch on public.transactions (branch_id);
create index idx_transactions_cashier on public.transactions (cashier_id);
create index idx_transactions_customer on public.transactions (customer_id);
create index idx_transactions_code on public.transactions (transaction_code);
create index idx_transactions_date on public.transactions (branch_id, created_at desc);
create index idx_transactions_status on public.transactions (branch_id, payment_status);

-- Kode transaksi harus unik
create unique index idx_transactions_code_unique on public.transactions (transaction_code);

comment on table public.transactions is 'Header transaksi. Sewa harus lunas di depan, denda dihitung saat pengembalian.';

-- ============================================================
-- Detail item per transaksi
-- ============================================================

create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  rental_asset_id uuid references public.rental_assets(id) on delete set null,
  type text not null check (type in ('retail', 'rental', 'package')),
  item_name text not null,           -- snapshot nama saat transaksi
  quantity int not null default 1,
  unit_price numeric(12,2) not null, -- snapshot harga saat transaksi
  subtotal numeric(12,2) not null,
  rental_start_date date,
  rental_end_date date,
  rental_days int,
  rental_status text check (rental_status in ('active', 'returned', 'overdue', 'lost')),
  returned_at timestamptz,
  return_condition text check (return_condition in ('good', 'minor_damage', 'major_damage', 'lost')),
  return_notes text
);

-- Index untuk query detail transaksi
create index idx_transaction_items_txn on public.transaction_items (transaction_id);
create index idx_transaction_items_item on public.transaction_items (item_id);
create index idx_transaction_items_asset on public.transaction_items (rental_asset_id);
create index idx_transaction_items_rental_status on public.transaction_items (rental_status)
  where rental_status is not null;

comment on table public.transaction_items is 'Detail item per transaksi. Harga & nama di-snapshot saat checkout.';
