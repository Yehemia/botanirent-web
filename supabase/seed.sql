-- ============================================================
-- FILE: supabase/seed.sql
-- TUJUAN: Memasukkan data uji coba awal (Seed Data) untuk pengembangan.
-- 
-- MENGAPA KODE INI DITULIS?
--   Saat mengembangkan aplikasi di lokal, database sering kali di-reset/dikosongkan.
--   File ini mempercepat proses testing dengan langsung menyediakan:
--     1. 2 Cabang toko (Bogor dan Jakarta)
--     2. Item inventaris (Tenda Dome untuk sewa & Gas Kaleng untuk dibeli)
--     3. Unit aset fisik tenda individual (ready/rented/maintenance)
-- ============================================================

-- 1. SEED DATA CABANG (BRANCHES)
-- Menggunakan ID UUID statis (hardcoded) agar kita bisa mereferensikannya secara konsisten di file seed lain.
insert into public.branches (id, name, address, phone)
values 
  ('11111111-1111-1111-1111-111111111111', 'Botani Outdoor - Bogor', 'Jl. Pajajaran No. 1, Bogor', '081234567890'),
  ('22222222-2222-2222-2222-222222222222', 'Botani Outdoor - Jakarta', 'Jl. Sudirman No. 2, Jakarta', '081234567891')
on conflict do nothing; -- Mencegah error jika data cabang dengan ID ini sudah ada di database

-- 2. SEED DATA ITEM INVENTARIS & ASET FISIK
-- Menggunakan blok anonim PostgreSQL (do $$ ... $$) agar kita bisa mendeklarasikan variabel
-- dan mengambil ID Kategori aktif secara dinamis sebelum melakukan insert item.
do $$
declare
  cat_sewa_satuan uuid;
  cat_retail_reseller uuid;
  branch_bogor uuid := '11111111-1111-1111-1111-111111111111';
  item_tenda uuid := '33333333-3333-3333-3333-333333333333';
  item_gas uuid := '44444444-4444-4444-4444-444444444444';
begin
  -- Cari ID Kategori 'Sewa Satuan' dan 'Retail Reseller' yang di-insert oleh migration tabel categories
  select id into cat_sewa_satuan from public.categories where name = 'Sewa Satuan' limit 1;
  select id into cat_retail_reseller from public.categories where name = 'Retail Reseller' limit 1;

  -- 3. SEED ITEMS DI CABANG BOGOR
  -- Memasukkan tenda dome sebagai item bertipe sewa (mempunya rental_price_per_day, sell_price bernilai null)
  insert into public.items (id, branch_id, category_id, name, description, barcode, rental_price_per_day, stock_total, stock_available)
  values 
    (item_tenda, branch_bogor, cat_sewa_satuan, 'Tenda Dome 4 Orang', 'Tenda double layer anti badai', 'TND-001', 45000, 5, 5);

  -- Memasukkan gas kaleng sebagai item bertipe retail untuk dibeli (sell_price aktif, rental_price_per_day null)
  insert into public.items (id, branch_id, category_id, name, description, barcode, sell_price, stock_total, stock_available)
  values 
    (item_gas, branch_bogor, cat_retail_reseller, 'Gas Kaleng Hi-Cook 230g', 'Gas portabel untuk kompor', 'GAS-001', 25000, 50, 50);

  -- 4. SEED ASET FISIK RENTAL (RENTAL ASSETS)
  -- Untuk item 'Tenda Dome 4 Orang' (id item_tenda), kita daftarkan 5 unit fisik tenda nyata di lapangan
  -- dengan kode aset unik masing-masing serta status awalnya.
  insert into public.rental_assets (item_id, asset_code, status)
  values 
    (item_tenda, 'TND-001-A', 'ready'),
    (item_tenda, 'TND-001-B', 'ready'),
    (item_tenda, 'TND-001-C', 'rented'),      -- Tenda C disimulasikan sedang disewa
    (item_tenda, 'TND-001-D', 'maintenance'), -- Tenda D disimulasikan sedang rusak / diservis
    (item_tenda, 'TND-001-E', 'ready');

end $$;

-- ============================================================
-- PANDUAN PENGUJIAN USER (PROFILES):
-- Karena Supabase Auth mengelola tabel auth.users di skema internal yang dilindungi, 
-- Anda harus menambahkan akun user secara manual melalui Supabase Dashboard > Authentication.
-- Setelah akun user terdaftar, trigger on_auth_user_created di PostgreSQL akan otomatis 
-- meng-insert profil baru ke tabel public.profiles.
--
-- Langkah terakhir: Jalankan query berikut di SQL Editor untuk menaikkan level role menjadi Owner:
--
-- UPDATE public.profiles 
-- SET role = 'owner', branch_id = '11111111-1111-1111-1111-111111111111' 
-- WHERE email = 'email-anda@contoh.com';
-- ============================================================

