-- Menu dinamis: storefront membaca tabel ini (anon, public read);
-- owner (authenticated) menambah/mengubah/menghapus lewat dashboard di index.html (Login > tab Menu).
-- Jalankan sekali di Supabase SQL editor. data/menu.json hanya jadi benih awal
-- (dipakai storefront sebagai fallback sebelum SQL ini dijalankan).
create table if not exists public.menu_items (
  id          text primary key,
  name        text not null,
  category    text not null default 'Lainnya',
  description text not null default '',
  price       int  not null check (price >= 0),
  unit        text not null default 'porsi',
  available   boolean not null default true,
  best_seller boolean not null default false,
  images      text[]  not null default '{}',
  sort        bigint  not null default 0,
  created_at  timestamptz not null default now()
);

-- idempotent: tambah kolom images jika tabel dibuat sebelum kolom ini ada
alter table public.menu_items add column if not exists images text[] not null default '{}';

alter table public.menu_items enable row level security;

-- siapa saja boleh membaca menu (nama & harga memang publik)
drop policy if exists "public read menu" on public.menu_items;
create policy "public read menu" on public.menu_items
  for select to anon, authenticated using (true);

-- hanya owner (authenticated) yang boleh menulis
drop policy if exists "owner write menu" on public.menu_items;
create policy "owner write menu" on public.menu_items
  for all to authenticated using (true) with check (true);

grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;

-- Benih dari data/menu.json (idempoten: lewati jika id sudah ada)
insert into public.menu_items (id, name, category, description, price, unit, available, best_seller, sort) values
  ('arsik',            'Arsik Ikan Mas',   'Lauk',               'Ikan mas dimasak dengan andaliman dan kecombrang. Hidangan khas adat Batak.', 85000, 'porsi',   true,  true,  1),
  ('saksang',          'Saksang',          'Lauk',               'Daging cincang dimasak lama dengan bumbu kaya rempah. [ISI] jenis daging.',   75000, 'porsi',   true,  true,  2),
  ('mie-gomak',        'Mie Gomak',        'Mie & Camilan',      'Mie tebal khas Batak dengan bumbu rempah dan andaliman.',                     35000, 'porsi',   true,  true,  3),
  ('itak',             'Itak Gurgur',      'Mie & Camilan',      'Manisan tepung beras tradisional, cocok untuk oleh-oleh.',                    30000, 'bungkus', true,  false, 4),
  ('sambal-andaliman', 'Sambal Andaliman', 'Sambal & Oleh-oleh', 'Sambal pedas dengan sensasi andaliman. Tahan lama.',                          45000, 'botol',   true,  true,  5),
  ('kopi',             'Kopi Sidikalang',  'Kopi',               'Kopi Sumatera Utara. [ISI] gramasi dan jenis gilingan.',                      60000, '250 g',   false, false, 6)
on conflict (id) do nothing;
