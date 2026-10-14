-- Jatah harian: berapa banyak tiap item untuk suatu tanggal.
-- Owner (authenticated) yang mengatur lewat dashboard di index.html (Login > tab Jatah harian).
create table if not exists public.daily_plans (
  date    date not null,
  item_id text not null,
  daily_limit int  not null check (daily_limit >= 0),
  unique (date, item_id)
);

alter table public.daily_plans enable row level security;

drop policy if exists "owner crud plans" on public.daily_plans;
create policy "owner crud plans" on public.daily_plans
  for all to authenticated using (true) with check (true);

-- Sisa hari ini per item. Hanya agregat (item, jumlah), tanpa data pelanggan,
-- jadi aman dipanggil tanpa login. SECURITY DEFINER menembus RLS karena
-- anon tidak boleh membaca tabel orders / daily_plans secara langsung.
create or replace function public.remaining_today()
returns jsonb
language sql
security definer
set search_path = public
set timezone = 'Asia/Jakarta'  -- "hari ini" dihitung waktu Jakarta
as $$
  select coalesce(jsonb_agg(row_to_json(j))::jsonb, '[]'::jsonb)
  from (
    select p.item_id as id,
           greatest(p.daily_limit - coalesce(o.sold, 0), 0) as remaining
    from daily_plans p
    left join (
      select (x.item ->> 'id') as item_id, sum((x.item ->> 'qty')::int) as sold
      from orders,
           jsonb_array_elements(
             case when jsonb_typeof(orders.items) = 'array' then orders.items else '[]'::jsonb end
           ) as x(item)
      where orders.created_at::date = current_date
      group by 1
    ) o on o.item_id = p.item_id
    where p.date = current_date
  ) j;
$$;

grant execute on function public.remaining_today() to anon, authenticated;