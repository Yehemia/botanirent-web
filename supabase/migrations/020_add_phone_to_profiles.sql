-- ============================================================
-- Migration 020: Tambah kolom phone ke profiles
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN phone text;

comment on column public.profiles.phone is 'Nomor telepon/WhatsApp aktif karyawan';
