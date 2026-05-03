create policy "quotes_admin_insert"
on public.quotes for insert
with check (public.current_user_is_admin());

create policy "quotes_admin_update"
on public.quotes for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "print_jobs_admin_insert"
on public.print_jobs for insert
with check (public.current_user_is_admin());

create policy "print_jobs_admin_update"
on public.print_jobs for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
