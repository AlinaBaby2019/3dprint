create or replace function public.set_default_address(p_address_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id
  from public.addresses
  where id = p_address_id;

  if v_user_id is null or v_user_id != auth.uid() then
    raise exception 'Address not found or not owned by current user';
  end if;

  update public.addresses
  set is_default = (id = p_address_id)
  where user_id = v_user_id;
end;
$$;
