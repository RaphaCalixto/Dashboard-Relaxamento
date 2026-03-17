-- Optional category field for task grouping/filtering.
alter table public.user_tasks
add column if not exists category text;

-- Restrict category values used by the app.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_tasks_category_check'
  ) then
    alter table public.user_tasks
      add constraint user_tasks_category_check
      check (category is null or category in ('work', 'home', 'personal', 'other'));
  end if;
end
$$;

create index if not exists user_tasks_user_id_category_idx
  on public.user_tasks (user_id, category);

comment on column public.user_tasks.category is
  'Optional category for filtering tasks: work, home, personal, other.';
