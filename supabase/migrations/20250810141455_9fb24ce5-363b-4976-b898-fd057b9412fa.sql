
-- 1) Ensure profiles are auto-created for new auth users (trigger)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) Backfill profiles for existing auth users (no-op for already populated)
insert into public.profiles (id, name, email)
select u.id,
       coalesce(u.raw_user_meta_data->>'name', 'New User'),
       u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3) Fix the category constraint on security_updates so edge function inserts work
alter table public.security_updates
  drop constraint if exists check_update_category;

alter table public.security_updates
  add constraint check_update_category
  check (
    update_category is null
    or update_category in (
      'dat', 'dat_file', 'amcore', 'engine', 'content',
      'epo', 'policy', 'exploit', 'medical', 'intelligence',
      'gateway', 'email'
    )
  );

-- 4) Public RPC to list users without requiring admin login
-- SECURITY DEFINER with restricted search_path to avoid privilege escalation
create or replace function public.get_all_profiles_public()
returns table(
  id uuid,
  name text,
  email text,
  department text
)
language sql
security definer
set search_path = public
as $$
  select id, name, email, department
  from public.profiles
  order by name nulls last;
$$;
