-- Staf & peran (role). Owner mengelola lewat dashboard di index.html (Login > tab Staf).
-- Jalankan sekali di Supabase SQL editor. Sesuaikan email bila perlu.
create table if not exists public.staff_roles (
  email text primary key,
  role text not null default 'kasir' check (role in ('kasir','admin','owner')),
  updated_at timestamptz not null default now()
);

-- Benih awal 3 akun (akun auth-nya dibuat di Supabase > Authentication > Users).
insert into public.staff_roles (email, role) values
  ('owner@gmail.com', 'owner'),
  ('admin@gmail.com', 'admin'),
  ('kasir@gmail.com', 'kasir')
on conflict (email) do update set role = excluded.role, updated_at = now();

alter table public.staff_roles enable row level security;

-- Apakah pemanggil berperan owner? (SECURITY DEFINER: baca tabel tanpa kena RLS.)
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff_roles
    where email = lower(auth.jwt() ->> 'email') and role = 'owner'
  );
$$;

-- Peran pemanggil saat ini (dipakai UI). Kosong = belum terdaftar.
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.staff_roles where email = lower(auth.jwt() ->> 'email');
$$;

grant execute on function public.is_owner() to authenticated;
grant execute on function public.my_role() to authenticated;

-- Hanya owner yang boleh melihat / mengubah daftar staf.
drop policy if exists staff_roles_owner_all on public.staff_roles;
create policy staff_roles_owner_all on public.staff_roles
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
