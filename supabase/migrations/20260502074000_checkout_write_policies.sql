create policy "orders_owner_insert"
on public.orders for insert
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "order_items_owner_insert"
on public.order_items for insert
with check (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  )
);

create policy "deliveries_owner_insert"
on public.deliveries for insert
with check (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = deliveries.order_id and orders.user_id = auth.uid()
  )
);
