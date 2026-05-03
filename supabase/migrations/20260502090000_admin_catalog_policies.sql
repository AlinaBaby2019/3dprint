create policy "materials_admin_write"
on public.material_options for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "colors_admin_write"
on public.color_options for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "products_admin_write"
on public.products for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
