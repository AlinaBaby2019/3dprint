# Database Schema

The platform uses Supabase Postgres with Row Level Security enabled.

The schema is project-centered:

```text
profiles
  -> projects
    -> project_files
    -> quotes
    -> print_jobs
  -> orders
    -> order_items
    -> deliveries
```

## Migration

Initial migration:

```text
supabase/migrations/20260501143000_initial_schema.sql
```

It creates:

- Auth profile extension table
- Customer addresses
- Project workflow tables
- File metadata table
- Quote and order tables
- Print job and delivery tracking tables
- Product catalog table
- Material and color option tables
- Message table
- Enums for status fields
- Basic RLS policies
- Seed rows for PLA, PETG, ASA, TPU and standard colors

## Remote Safety

The local repo is not linked to a remote Supabase project yet.

Current CLI check showed an existing remote project named `FlexWork`. That
project must not be modified for this website.

Before pushing migrations, create or link a dedicated Supabase project for this
service.

Recommended project settings:

```text
Name: aarhus-3d-print
Region: West EU (Ireland)
Plan: Free
```

Because the account is on the free plan, keep the MVP lightweight:

- One Supabase project for this service
- One private storage bucket for customer uploads
- One public bucket or local static assets for product images
- Avoid background jobs in Supabase at the beginning
- Avoid large file storage until Cloudflare R2 is introduced

## Storage Buckets

Planned buckets:

```text
project-files   private
product-images  public
```

Customer model files and reference images should use private storage and signed
URLs. Product images can stay in the Next.js `public` folder for now.

Private customer upload paths should start with the authenticated user ID:

```text
{user_id}/projects/{project_id}/uploads/{filename}
{user_id}/projects/{project_id}/generated/{filename}
{user_id}/projects/{project_id}/approved/{filename}
{user_id}/projects/{project_id}/photos/{filename}
```

This path convention allows Supabase Storage RLS to restrict each customer to
their own files.

## Admin Access

Admin access is controlled through:

```text
profiles.is_admin
```

After the first admin user signs up, manually set:

```sql
update public.profiles
set is_admin = true
where id = '<auth-user-id>';
```

Do this only in the dedicated project for this website.
