create extension if not exists "pgcrypto";

create type public.customer_type as enum ('private', 'business');
create type public.project_type as enum (
  'print_existing_model',
  'image_to_model',
  'text_to_model',
  'custom_design',
  'product_customization',
  'business_batch'
);
create type public.project_status as enum (
  'draft',
  'uploaded',
  'needs_review',
  'quoted',
  'approved',
  'in_production',
  'completed',
  'cancelled'
);
create type public.file_role as enum (
  'original_upload',
  'reference_image',
  'generated_model',
  'repaired_model',
  'sliced_file',
  'preview_image',
  'final_photo'
);
create type public.quote_status as enum (
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
  'cancelled'
);
create type public.order_status as enum (
  'pending_payment',
  'paid',
  'in_production',
  'ready',
  'fulfilled',
  'refunded',
  'cancelled'
);
create type public.print_job_status as enum (
  'queued',
  'printing',
  'post_processing',
  'ready',
  'failed',
  'reprinting',
  'done'
);
create type public.delivery_status as enum (
  'not_required',
  'pickup_ready',
  'out_for_delivery',
  'shipped',
  'delivered',
  'failed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_locale text not null default 'da',
  customer_type public.customer_type not null default 'private',
  company_name text,
  cvr text,
  ean text,
  invoice_email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Default',
  full_name text not null,
  line1 text not null,
  line2 text,
  postal_code text not null,
  city text not null,
  country text not null default 'Denmark',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.material_options (
  id text primary key,
  name text not null,
  description jsonb not null default '{}'::jsonb,
  multiplier numeric(8,2) not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.color_options (
  id text primary key,
  name text not null,
  hex text,
  material_id text references public.material_options(id) on delete set null,
  in_stock boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type public.project_type not null,
  status public.project_status not null default 'draft',
  title text,
  notes text,
  selected_material text references public.material_options(id),
  selected_color text,
  selected_quality text,
  quantity integer not null default 1 check (quantity > 0),
  delivery_method text,
  estimate_low_dkk integer,
  estimate_high_dkk integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  role public.file_role not null default 'original_upload',
  storage_provider text not null default 'supabase',
  bucket text not null,
  path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.quote_status not null default 'draft',
  amount_dkk integer not null check (amount_dkk >= 0),
  currency text not null default 'DKK',
  admin_notes text,
  customer_notes text,
  expires_at timestamptz,
  expected_completion_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  status public.order_status not null default 'pending_payment',
  total_dkk integer not null default 0 check (total_dkk >= 0),
  currency text not null default 'DKK',
  customer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_type text not null,
  title text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_dkk integer not null default 0 check (unit_price_dkk >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  status public.print_job_status not null default 'queued',
  material_id text references public.material_options(id),
  color text,
  printer_name text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  actual_minutes integer check (actual_minutes is null or actual_minutes >= 0),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.delivery_status not null default 'not_required',
  method text not null,
  address_id uuid references public.addresses(id) on delete set null,
  tracking_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  category text,
  base_price_dkk integer not null check (base_price_dkk >= 0),
  image_path text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses(user_id);
create index projects_user_id_idx on public.projects(user_id);
create index projects_status_idx on public.projects(status);
create index project_files_project_id_idx on public.project_files(project_id);
create index quotes_project_id_idx on public.quotes(project_id);
create index orders_user_id_idx on public.orders(user_id);
create index print_jobs_status_idx on public.print_jobs(status);
create index products_active_idx on public.products(is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger print_jobs_set_updated_at
before update on public.print_jobs
for each row execute function public.set_updated_at();

create trigger deliveries_set_updated_at
before update on public.deliveries
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, preferred_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'preferred_locale', 'da')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.quotes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.print_jobs enable row level security;
alter table public.deliveries enable row level security;
alter table public.products enable row level security;
alter table public.messages enable row level security;
alter table public.material_options enable row level security;
alter table public.color_options enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.current_user_is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.current_user_is_admin())
with check (id = auth.uid() or public.current_user_is_admin());

create policy "addresses_owner_all"
on public.addresses for all
using (user_id = auth.uid() or public.current_user_is_admin())
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "projects_owner_or_admin_select"
on public.projects for select
using (user_id = auth.uid() or public.current_user_is_admin());

create policy "projects_owner_or_admin_insert"
on public.projects for insert
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "projects_owner_or_admin_update"
on public.projects for update
using (user_id = auth.uid() or public.current_user_is_admin())
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "project_files_owner_or_admin_select"
on public.project_files for select
using (user_id = auth.uid() or public.current_user_is_admin());

create policy "project_files_owner_or_admin_insert"
on public.project_files for insert
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "quotes_owner_or_admin_select"
on public.quotes for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = quotes.project_id and projects.user_id = auth.uid()
  )
);

create policy "orders_owner_or_admin_select"
on public.orders for select
using (user_id = auth.uid() or public.current_user_is_admin());

create policy "order_items_owner_or_admin_select"
on public.order_items for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  )
);

create policy "print_jobs_owner_or_admin_select"
on public.print_jobs for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = print_jobs.project_id and projects.user_id = auth.uid()
  )
);

create policy "deliveries_owner_or_admin_select"
on public.deliveries for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = deliveries.order_id and orders.user_id = auth.uid()
  )
);

create policy "products_public_read"
on public.products for select
using (is_active = true or public.current_user_is_admin());

create policy "messages_owner_or_admin_select"
on public.messages for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = messages.project_id and projects.user_id = auth.uid()
  )
  or exists (
    select 1 from public.orders
    where orders.id = messages.order_id and orders.user_id = auth.uid()
  )
);

create policy "messages_owner_or_admin_insert"
on public.messages for insert
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "materials_public_read"
on public.material_options for select
using (is_active = true or public.current_user_is_admin());

create policy "colors_public_read"
on public.color_options for select
using (is_active = true or public.current_user_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'project-files',
    'project-files',
    false,
    104857600,
    array[
      'model/stl',
      'model/obj',
      'application/octet-stream',
      'application/pdf',
      'application/zip',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  ),
  (
    'product-images',
    'product-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

create policy "project_files_owner_read"
on storage.objects for select
using (
  bucket_id = 'project-files'
  and (
    public.current_user_is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "project_files_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and (
    public.current_user_is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "project_files_owner_update"
on storage.objects for update
using (
  bucket_id = 'project-files'
  and (
    public.current_user_is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'project-files'
  and (
    public.current_user_is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "project_files_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'project-files'
  and (
    public.current_user_is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product_images_admin_write"
on storage.objects for all
using (bucket_id = 'product-images' and public.current_user_is_admin())
with check (bucket_id = 'product-images' and public.current_user_is_admin());

insert into public.material_options (id, name, description, multiplier) values
  ('pla', 'PLA', '{"en":"Indoor models and visual prototypes","da":"Indendørs modeller og visuelle prototyper","zh":"室内模型和外观原型"}', 1.00),
  ('petg', 'PETG', '{"en":"Durable practical parts","da":"Holdbare praktiske dele","zh":"耐用实用零件"}', 1.25),
  ('asa', 'ASA', '{"en":"Outdoor and warmer environments","da":"Udendørs og varmere miljøer","zh":"户外和较高温环境"}', 1.60),
  ('tpu', 'TPU', '{"en":"Flexible parts and bumpers","da":"Fleksible dele og støddæmpere","zh":"柔性件和缓冲件"}', 1.90);

insert into public.color_options (id, name, hex, material_id, in_stock) values
  ('black', 'Black', '#111827', null, true),
  ('white', 'White', '#f8fafc', null, true),
  ('grey', 'Grey', '#6b7280', null, true),
  ('custom', 'Custom color', null, null, false);
