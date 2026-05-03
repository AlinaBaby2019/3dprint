create policy "payments_admin_write"
on public.payments for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
