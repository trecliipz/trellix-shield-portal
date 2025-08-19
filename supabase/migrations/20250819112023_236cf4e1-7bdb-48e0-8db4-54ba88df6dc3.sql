
  -- 1) Create table to persist EPO server connections
  create table if not exists public.epo_connections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    name text not null,
    type text not null default 'Type EPO',
    server_url text not null,
    username text not null,
    port integer not null default 8443,
    status text not null default 'disconnected',
    last_sync timestamp with time zone,
    version text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
  );

  -- 2) RLS: enable and set policies
  alter table public.epo_connections enable row level security;

  -- Admins can manage all connections
  create policy "Admins can manage all epo connections"
    on public.epo_connections
    for all
    using (has_role(auth.uid(), 'admin'::app_role))
    with check (has_role(auth.uid(), 'admin'::app_role));

  -- Users can view their own connections
  create policy "Users can view their own epo connections"
    on public.epo_connections
    for select
    using (auth.uid() = user_id);

  -- Users can insert their own connections
  create policy "Users can insert their own epo connections"
    on public.epo_connections
    for insert
    with check (auth.uid() = user_id);

  -- Users can update their own connections
  create policy "Users can update their own epo connections"
    on public.epo_connections
    for update
    using (auth.uid() = user_id);

  -- Users can delete their own connections
  create policy "Users can delete their own epo connections"
    on public.epo_connections
    for delete
    using (auth.uid() = user_id);

  -- 3) Keep updated_at current
  drop trigger if exists set_updated_at_on_epo_connections on public.epo_connections;
  create trigger set_updated_at_on_epo_connections
    before update on public.epo_connections
    for each row execute function public.update_updated_at_column();

  -- 4) Helpful indexes and realtime support
  create index if not exists idx_epo_connections_user_id on public.epo_connections(user_id);

  -- Optional but useful if we add realtime listeners later
  alter table public.epo_connections replica identity full;
  alter publication supabase_realtime add table public.epo_connections;
  