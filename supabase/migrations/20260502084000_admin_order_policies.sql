create policy "orders_admin_update"
on public.orders for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "deliveries_admin_update"
on public.deliveries for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
