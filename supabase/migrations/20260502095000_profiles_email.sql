-- Add email column to profiles and sync it from auth.users via trigger.
-- This lets the admin see customer email without needing service-role access.

alter table public.profiles
  add column if not exists email text;

-- Update the new-user trigger to also copy email
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, preferred_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'preferred_locale', 'da')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

-- Sync email changes (e.g. user updates their email in Supabase Auth)
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.sync_profile_email();
