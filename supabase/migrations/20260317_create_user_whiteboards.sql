create extension if not exists pgcrypto;

create table if not exists public.user_whiteboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Quadro',
  content jsonb not null default '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_whiteboards_user_id_idx on public.user_whiteboards(user_id);
create index if not exists user_whiteboards_updated_at_idx on public.user_whiteboards(updated_at desc);

alter table public.user_whiteboards enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_whiteboards'
      and policyname = 'Users can read own whiteboards'
  ) then
    create policy "Users can read own whiteboards"
      on public.user_whiteboards
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_whiteboards'
      and policyname = 'Users can insert own whiteboards'
  ) then
    create policy "Users can insert own whiteboards"
      on public.user_whiteboards
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_whiteboards'
      and policyname = 'Users can update own whiteboards'
  ) then
    create policy "Users can update own whiteboards"
      on public.user_whiteboards
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_whiteboards'
      and policyname = 'Users can delete own whiteboards'
  ) then
    create policy "Users can delete own whiteboards"
      on public.user_whiteboards
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

create or replace function public.set_user_whiteboards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_user_whiteboards_updated_at'
  ) then
    create trigger set_user_whiteboards_updated_at
      before update on public.user_whiteboards
      for each row
      execute function public.set_user_whiteboards_updated_at();
  end if;
end
$$;
