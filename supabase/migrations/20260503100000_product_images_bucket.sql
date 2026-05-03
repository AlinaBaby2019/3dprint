-- Public storage bucket for product images.
-- Product images must be publicly readable so the storefront can display them
-- without signed URLs.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Admin can upload and replace product images
create policy "Admin can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and current_user_is_admin());

-- Admin can delete product images
create policy "Admin can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and current_user_is_admin());

-- Admin can update product images
create policy "Admin can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and current_user_is_admin());

-- Everyone can read product images (public storefront)
create policy "Public can read product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');
