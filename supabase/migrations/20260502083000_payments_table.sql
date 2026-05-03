create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  status text not null default 'pending',
  amount_dkk integer not null check (amount_dkk >= 0),
  currency text not null default 'DKK',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments(order_id);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy "payments_owner_or_admin_select"
on public.payments for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = payments.order_id and orders.user_id = auth.uid()
  )
);
