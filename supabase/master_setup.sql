DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.penalties CASCADE;
DROP TABLE IF EXISTS public.penalty_rules CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.transaction_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.package_items CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.rental_assets CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
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
 -- ============================================================
-- Migration 002: Tabel profiles (profil user)
-- Extends auth.users dengan data tambahan (role, cabang)
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  avatar_url text,
  role text not null default 'kasir' check (role in ('owner', 'kasir', 'gudang')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index untuk cari user berdasarkan cabang
create index idx_profiles_branch on public.profiles (branch_id);
create index idx_profiles_role on public.profiles (role);

comment on table public.profiles is 'Profil user yang extends auth.users. 1 user = 1 role, 1 cabang.';

-- Trigger: otomatis buat profile saat user baru sign up di Supabase Auth
--
-- KONSEP INTEGRASI AUTH DI SUPABASE:
--   1. Supabase menyimpan data login secara privat di tabel `auth.users`.
--   2. Kita tidak diperbolehkan memodifikasi tabel privat tersebut.
--   3. Oleh karena itu, kita membuat tabel pendamping `public.profiles`.
--   4. Fungsi ini bertindak sebagai jembatan otomatis: setiap kali ada baris baru masuk
--      di `auth.users`, fungsi ini akan di-trigger untuk meng-copy ID user tersebut 
--      dan membuat baris profile baru di skema publik kita secara otomatis.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id, -- ID user baru yang digenerate oleh auth.users
    -- coalescence: ambil full_name dari metadata pendaftaran (OAuth/Social/Sign up),
    -- jika kosong, jadikan alamat email sebagai nama default.
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Daftarkan trigger ke tabel auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
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
 -- ============================================================
-- Migration 009: Tabel bookings (blocking kalender)
-- Untuk cek ketersediaan aset sewa per tanggal
-- ============================================================

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  rental_asset_id uuid not null references public.rental_assets(id) on delete cascade,
  transaction_item_id uuid references public.transaction_items(id) on delete set null,
  branch_id uuid not null references public.branches(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'booked' check (status in ('booked', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Index utama: cek ketersediaan aset per range tanggal
create index idx_bookings_asset_dates on public.bookings (rental_asset_id, start_date, end_date);
create index idx_bookings_branch on public.bookings (branch_id);
create index idx_bookings_status on public.bookings (branch_id, status);

-- Constraint: tanggal akhir harus setelah tanggal mulai
alter table public.bookings add constraint chk_booking_dates check (end_date >= start_date);

comment on table public.bookings is 'Blocking kalender per unit aset sewa. Untuk cek availability.';
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
 -- ============================================================
-- Migration 011: Tabel activity_logs (log aktivitas)
-- Mencatat semua aksi user untuk audit trail
-- ============================================================

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  action text not null,
  entity_type text not null,  -- 'transaction', 'item', 'asset', 'customer', dll
  entity_id uuid,             -- FK ke entity terkait
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Index untuk filter log
create index idx_activity_logs_branch on public.activity_logs (branch_id);
create index idx_activity_logs_user on public.activity_logs (user_id);
create index idx_activity_logs_date on public.activity_logs (branch_id, created_at desc);
create index idx_activity_logs_action on public.activity_logs (branch_id, action);

comment on table public.activity_logs is 'Log aktivitas user untuk audit trail. Dilihat oleh Owner.';
 -- ============================================================
-- Migration 012: Row Level Security (RLS) Policies
-- Isolasi data per cabang + RBAC per role
-- ============================================================

-- ==========================================
-- HELPER FUNCTIONS UNTUK ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Ambil branch_id user yang sedang login
--
-- KONSEP STABLE & SECURITY DEFINER:
--   - security definer: Fungsi ini dieksekusi menggunakan hak akses pembuat fungsi (admin/postgres),
--     bukan hak akses user biasa yang login. Sangat penting karena user biasa tidak memiliki
--     hak untuk langsung membaca tabel public.profiles sebelum RLS disetujui.
--   - stable: Menandakan ke PostgreSQL bahwa fungsi ini mengembalikan nilai yang sama selama
--     satu query transaksi berlangsung. Ini mengoptimalkan performa agar database tidak memanggil
--     query SELECT profil berulang kali untuk setiap baris data yang difilter.
create or replace function public.user_branch_id()
returns uuid as $$
  -- auth.uid() adalah fungsi bawaan Supabase untuk mengambil ID user aktif dari token JWT
  select branch_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- Ambil role user yang sedang login (owner, kasir, atau gudang)
-- Sama seperti fungsi di atas, ini digunakan dalam filter RLS untuk membedakan otorisasi role (RBAC)
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
 -- ============================================================
-- Seed Data untuk Development BotaniRent
-- HARAP JALANKAN INI HANYA SETELAH SEMUA MIGRATION SELESAI
-- ============================================================

-- 1. Buat 2 Cabang (Bogor & Jakarta)
insert into public.branches (id, name, address, phone)
values 
  ('11111111-1111-1111-1111-111111111111', 'Botani Outdoor - Bogor', 'Jl. Pajajaran No. 1, Bogor', '081234567890'),
  ('22222222-2222-2222-2222-222222222222', 'Botani Outdoor - Jakarta', 'Jl. Sudirman No. 2, Jakarta', '081234567891')
on conflict do nothing;

-- 2. Kategori sudah di-seed di migration 003, kita butuh ID-nya untuk seed item
-- Asumsi nama kategori: 'Paket Sewa', 'Sewa Satuan', 'Retail Home Industry', 'Retail Reseller'

do $$
declare
  cat_sewa_satuan uuid;
  cat_retail_reseller uuid;
  branch_bogor uuid := '11111111-1111-1111-1111-111111111111';
  item_tenda uuid := '33333333-3333-3333-3333-333333333333';
  item_gas uuid := '44444444-4444-4444-4444-444444444444';
begin
  select id into cat_sewa_satuan from public.categories where name = 'Sewa Satuan' limit 1;
  select id into cat_retail_reseller from public.categories where name = 'Retail Reseller' limit 1;

  -- 3. Seed Items di Cabang Bogor
  insert into public.items (id, branch_id, category_id, name, description, barcode, rental_price_per_day, stock_total, stock_available)
  values 
    (item_tenda, branch_bogor, cat_sewa_satuan, 'Tenda Dome 4 Orang', 'Tenda double layer anti badai', 'TND-001', 45000, 5, 5);

  insert into public.items (id, branch_id, category_id, name, description, barcode, sell_price, stock_total, stock_available)
  values 
    (item_gas, branch_bogor, cat_retail_reseller, 'Gas Kaleng Hi-Cook 230g', 'Gas portabel untuk kompor', 'GAS-001', 25000, 50, 50);

  -- 4. Seed Rental Assets (Unit Fisik Tenda)
  insert into public.rental_assets (item_id, asset_code, status)
  values 
    (item_tenda, 'TND-001-A', 'ready'),
    (item_tenda, 'TND-001-B', 'ready'),
    (item_tenda, 'TND-001-C', 'rented'),
    (item_tenda, 'TND-001-D', 'maintenance'),
    (item_tenda, 'TND-001-E', 'ready');

end $$;

-- CATATAN UNTUK USER (PROFILES):
-- Karena tabel auth.users dikelola internal oleh Supabase, Anda harus membuat user lewat
-- Supabase Dashboard > Authentication > Add User.
-- Trigger `on_auth_user_created` akan otomatis membuat record di tabel `public.profiles`.
-- Setelah user terbuat, masuk ke SQL Editor dan jalankan query ini untuk update role-nya:
--
-- UPDATE public.profiles 
-- SET role = 'owner', branch_id = '11111111-1111-1111-1111-111111111111' 
-- WHERE email = 'email-anda@contoh.com';

