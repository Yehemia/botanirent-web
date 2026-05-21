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
