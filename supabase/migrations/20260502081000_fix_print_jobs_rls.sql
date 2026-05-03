drop policy if exists "print_jobs_owner_or_admin_select" on public.print_jobs;

create policy "print_jobs_owner_or_admin_select"
on public.print_jobs for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = print_jobs.project_id and projects.user_id = auth.uid()
  )
  or exists (
    select 1 from public.orders
    where orders.id = print_jobs.order_id and orders.user_id = auth.uid()
  )
);
