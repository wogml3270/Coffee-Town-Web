-- DESTRUCTIVE RESET: Coffee Town public game data is deleted.
-- Supabase Auth users, identities, Storage, and project configuration are preserved.
begin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

drop table if exists
  public.session_orders,
  public.game_sessions,
  public.user_upgrades,
  public.user_inventory,
  public.user_progress,
  public.profiles,
  public.recipe_step_inputs,
  public.recipe_steps,
  public.processing_rules,
  public.recipes,
  public.stations,
  public.ingredients,
  public.upgrades
cascade;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nickname_length check (nickname is null or char_length(trim(nickname)) between 2 and 16)
);

create unique index if not exists profiles_nickname_unique on public.profiles (lower(trim(nickname))) where nickname is not null;

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold bigint not null default 0 check (gold >= 0),
  unlocked_stage integer not null default 1 check (unlocked_stage between 1 and 12),
  upgrades jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress add column if not exists unlocked_stage integer not null default 1;
alter table public.user_progress add column if not exists upgrades jsonb not null default '{}'::jsonb;

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
revoke all on table public.profiles, public.user_progress from anon, authenticated;
grant select, insert, update on table public.profiles, public.user_progress to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "progress_select_own" on public.user_progress;
create policy "progress_select_own" on public.user_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "progress_insert_own" on public.user_progress;
create policy "progress_insert_own" on public.user_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "progress_update_own" on public.user_progress;
create policy "progress_update_own" on public.user_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, email, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'))
  on conflict (user_id) do update set email = excluded.email, avatar_url = excluded.avatar_url, updated_at = now();
  insert into public.user_progress (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users for each row execute function public.handle_new_user();

-- Recreate rows for Google users who authenticated before this reset.
insert into public.profiles (user_id, email, avatar_url)
select id, email, coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture') from auth.users
on conflict (user_id) do nothing;

insert into public.user_progress (user_id)
select id from auth.users
on conflict (user_id) do nothing;

commit;
