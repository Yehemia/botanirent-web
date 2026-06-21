-- ============================================================
-- Migration 018: Tambah kolom deactivation_notes di tabel branches
-- ============================================================

ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS deactivation_notes text;

comment on column public.branches.deactivation_notes is 'Catatan/alasan mengapa cabang dinonaktifkan.';
