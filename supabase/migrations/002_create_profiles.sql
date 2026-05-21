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

-- Trigger: otomatis buat profile saat user baru sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
