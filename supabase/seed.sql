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
