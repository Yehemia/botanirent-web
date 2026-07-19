-- ============================================================
-- Migration 021: Tambahkan UNIQUE constraint untuk phone dan email
-- ============================================================

-- 1. Profiles (Staff Accounts)
-- Menghindari duplikasi nomor WhatsApp pada akun staff
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);

-- 2. Customers (Penyewa/Pelanggan)
-- Menghindari duplikasi nomor WhatsApp/HP dan Email pada pelanggan
ALTER TABLE public.customers ADD CONSTRAINT customers_phone_key UNIQUE (phone);
ALTER TABLE public.customers ADD CONSTRAINT customers_email_key UNIQUE (email);
