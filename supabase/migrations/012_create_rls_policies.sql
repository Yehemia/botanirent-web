-- ============================================================
-- Migration 012: Row Level Security (RLS) Policies
-- Isolasi data per cabang + RBAC per role
-- ============================================================

-- ==========================================
-- Helper functions untuk RLS
-- ==========================================

-- Ambil branch_id user yang sedang login
create or replace function public.user_branch_id()
returns uuid as $$
  select branch_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- Ambil role user yang sedang login
create or replace function public.user_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- ==========================================
-- Enable RLS di semua tabel
-- ==========================================

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.rental_assets enable row level security;
alter table public.packages enable row level security;
alter table public.package_items enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.bookings enable row level security;
alter table public.penalty_rules enable row level security;
alter table public.penalties enable row level security;
alter table public.activity_logs enable row level security;

-- ==========================================
-- Policies: branches
-- Owner bisa lihat & kelola semua, user lain hanya cabang sendiri
-- ==========================================

create policy "branches_select" on public.branches
  for select using (
    public.user_role() = 'owner'
    or id = public.user_branch_id()
  );

create policy "branches_insert" on public.branches
  for insert with check (public.user_role() = 'owner');

create policy "branches_update" on public.branches
  for update using (public.user_role() = 'owner');

create policy "branches_delete" on public.branches
  for delete using (public.user_role() = 'owner');

-- ==========================================
-- Policies: profiles
-- User bisa lihat profilnya sendiri, Owner bisa lihat semua
-- ==========================================

create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.user_role() = 'owner'
    or branch_id = public.user_branch_id()
  );

create policy "profiles_update" on public.profiles
  for update using (
    id = auth.uid()
    or public.user_role() = 'owner'
  );

-- ==========================================
-- Policies: categories (global, semua role bisa baca)
-- ==========================================

create policy "categories_select" on public.categories
  for select using (true);

create policy "categories_manage" on public.categories
  for all using (public.user_role() in ('owner', 'gudang'));

-- ==========================================
-- Policies: items (isolasi per cabang)
-- ==========================================

create policy "items_select" on public.items
  for select using (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

create policy "items_insert" on public.items
  for insert with check (
    public.user_role() in ('gudang', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

create policy "items_update" on public.items
  for update using (
    public.user_role() in ('gudang', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

create policy "items_delete" on public.items
  for delete using (
    public.user_role() in ('gudang', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

-- ==========================================
-- Policies: rental_assets (ikut item → ikut cabang)
-- ==========================================

create policy "rental_assets_select" on public.rental_assets
  for select using (
    exists (
      select 1 from public.items
      where items.id = rental_assets.item_id
      and (items.branch_id = public.user_branch_id() or public.user_role() = 'owner')
    )
  );

create policy "rental_assets_manage" on public.rental_assets
  for all using (
    public.user_role() in ('gudang', 'owner')
    and exists (
      select 1 from public.items
      where items.id = rental_assets.item_id
      and (items.branch_id = public.user_branch_id() or public.user_role() = 'owner')
    )
  );

-- ==========================================
-- Policies: packages & package_items (isolasi per cabang)
-- ==========================================

create policy "packages_select" on public.packages
  for select using (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

create policy "packages_manage" on public.packages
  for all using (
    public.user_role() in ('gudang', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

create policy "package_items_select" on public.package_items
  for select using (
    exists (
      select 1 from public.packages
      where packages.id = package_items.package_id
      and (packages.branch_id = public.user_branch_id() or public.user_role() = 'owner')
    )
  );

create policy "package_items_manage" on public.package_items
  for all using (
    public.user_role() in ('gudang', 'owner')
  );

-- ==========================================
-- Policies: customers (isolasi per cabang)
-- ==========================================

create policy "customers_select" on public.customers
  for select using (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

create policy "customers_manage" on public.customers
  for all using (
    public.user_role() in ('kasir', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

-- ==========================================
-- Policies: transactions & transaction_items
-- ==========================================

create policy "transactions_select" on public.transactions
  for select using (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

create policy "transactions_insert" on public.transactions
  for insert with check (
    public.user_role() in ('kasir', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

create policy "transactions_update" on public.transactions
  for update using (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

create policy "transaction_items_select" on public.transaction_items
  for select using (
    exists (
      select 1 from public.transactions
      where transactions.id = transaction_items.transaction_id
      and (transactions.branch_id = public.user_branch_id() or public.user_role() = 'owner')
    )
  );

create policy "transaction_items_manage" on public.transaction_items
  for all using (
    public.user_role() in ('kasir', 'owner')
  );

-- ==========================================
-- Policies: bookings
-- ==========================================

create policy "bookings_select" on public.bookings
  for select using (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

create policy "bookings_manage" on public.bookings
  for all using (
    public.user_role() in ('kasir', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

-- ==========================================
-- Policies: penalty_rules (global, Owner only manage)
-- ==========================================

create policy "penalty_rules_select" on public.penalty_rules
  for select using (true);

create policy "penalty_rules_manage" on public.penalty_rules
  for all using (public.user_role() = 'owner');

-- ==========================================
-- Policies: penalties (isolasi per cabang)
-- ==========================================

create policy "penalties_select" on public.penalties
  for select using (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

create policy "penalties_manage" on public.penalties
  for all using (
    public.user_role() in ('kasir', 'owner')
    and (branch_id = public.user_branch_id() or public.user_role() = 'owner')
  );

-- ==========================================
-- Policies: activity_logs (Owner bisa lihat semua, lainnya cabang sendiri)
-- ==========================================

create policy "activity_logs_select" on public.activity_logs
  for select using (
    public.user_role() = 'owner'
    or branch_id = public.user_branch_id()
  );

create policy "activity_logs_insert" on public.activity_logs
  for insert with check (
    branch_id = public.user_branch_id()
    or public.user_role() = 'owner'
  );

-- ==========================================
-- Auto-update updated_at timestamp
-- ==========================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Terapkan ke semua tabel yang punya kolom updated_at
create trigger set_updated_at before update on public.branches
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.items
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.rental_assets
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.packages
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.customers
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.transactions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.penalty_rules
  for each row execute function public.handle_updated_at();
