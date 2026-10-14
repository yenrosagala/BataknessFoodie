-- Walk-in (kasir) orders: add a channel so in-store orders can be told apart
-- from online ones. Online rows default to 'online'; the kasir page writes 'kasir'.
-- Run once in the Supabase SQL editor.
alter table public.orders add column if not exists channel text not null default 'online';
create index if not exists orders_channel_idx on public.orders (channel);
