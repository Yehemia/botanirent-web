-- ============================================================
-- Migration 010: Tabel penalty_rules & penalties (denda)
-- Aturan denda global (diatur Owner) & record denda per item
-- ============================================================

-- Master aturan denda (global, berlaku untuk semua cabang)
create table public.penalty_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('late', 'minor_damage', 'major_damage', 'lost')),
  calculation_method text not null check (calculation_method in ('per_day', 'flat', 'percentage')),
  amount numeric(12,2) not null,  -- nominal atau persentase
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.penalty_rules is 'Master aturan denda. Diatur Owner, berlaku semua cabang.';

-- Seed aturan denda default
insert into public.penalty_rules (name, type, calculation_method, amount) values
  ('Denda Keterlambatan', 'late', 'per_day', 15000),
  ('Denda Kerusakan Ringan', 'minor_damage', 'flat', 50000),
  ('Denda Kerusakan Berat', 'major_damage', 'percentage', 25),
  ('Denda Kehilangan', 'lost', 'percentage', 100);

-- Record denda per pengembalian item
create table public.penalties (
  id uuid primary key default gen_random_uuid(),
  transaction_item_id uuid not null references public.transaction_items(id) on delete cascade,
  penalty_rule_id uuid references public.penalty_rules(id) on delete set null,
  branch_id uuid not null references public.branches(id) on delete cascade,
  type text not null check (type in ('late', 'minor_damage', 'major_damage', 'lost')),
  late_days int,
  calculated_amount numeric(12,2) not null,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_penalties_branch on public.penalties (branch_id);
create index idx_penalties_txn_item on public.penalties (transaction_item_id);
create index idx_penalties_status on public.penalties (branch_id, payment_status);

comment on table public.penalties is 'Record denda per pengembalian. Dihitung saat barang dikembalikan.';
