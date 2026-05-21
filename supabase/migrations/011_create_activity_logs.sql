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
