begin;

create extension if not exists pgcrypto;

create table if not exists public.ingredients (
  id text primary key,
  name text not null,
  category text not null check (category in ('COFFEE','WATER','DAIRY','ALT_MILK','SYRUP','POWDER','FRUIT','TEA','TOPPING','CONTAINER','DRINK')),
  state text not null check (state in ('RAW','GROUND','LIQUID','FROZEN','STEAMED','FOAMED','EXTRACT','FINISHED')),
  temperature text not null default 'AMBIENT' check (temperature in ('AMBIENT','COLD','HOT')),
  unlock_level integer not null default 1 check (unlock_level > 0),
  base_cost integer not null default 0 check (base_cost >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stations (
  id text primary key,
  name text not null,
  process_type text not null check (process_type in ('GRIND','BREW_ESPRESSO','BREW_COLD','HEAT','CHILL','STEAM','FOAM','BLEND','SHAKE','MIX','TOP','DISPENSE')),
  unlock_level integer not null default 1 check (unlock_level > 0),
  base_duration_sec integer not null check (base_duration_sec > 0),
  base_slots integer not null default 1 check (base_slots > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id text primary key,
  name text not null,
  output_item_id text not null references public.ingredients(id),
  unlock_level integer not null default 1 check (unlock_level > 0),
  reward_gold integer not null default 0 check (reward_gold >= 0),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_steps (
  recipe_id text not null references public.recipes(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  station_id text not null references public.stations(id),
  process_type text not null,
  output_item_id text not null references public.ingredients(id),
  duration_sec integer not null check (duration_sec > 0),
  primary key (recipe_id, step_order)
);

create table if not exists public.recipe_step_inputs (
  recipe_id text not null,
  step_order integer not null,
  ingredient_id text not null references public.ingredients(id),
  quantity integer not null default 1 check (quantity > 0),
  primary key (recipe_id, step_order, ingredient_id),
  foreign key (recipe_id, step_order) references public.recipe_steps(recipe_id, step_order) on delete cascade
);

create table if not exists public.processing_rules (
  id text primary key,
  station_id text not null references public.stations(id),
  process_type text not null,
  input_item_id text not null references public.ingredients(id),
  input_quantity integer not null default 1 check (input_quantity > 0),
  output_item_id text not null references public.ingredients(id),
  duration_sec integer not null check (duration_sec > 0),
  unlock_level integer not null default 1 check (unlock_level > 0)
);

create table if not exists public.upgrades (
  id text primary key,
  station_id text references public.stations(id),
  name text not null,
  description text not null,
  effect_type text not null check (effect_type in ('SPEED','SLOTS','STORAGE','TIP','PATIENCE','STARTING_STOCK')),
  effect_value numeric not null check (effect_value > 0),
  max_level integer not null default 5 check (max_level > 0),
  base_cost integer not null check (base_cost > 0),
  cost_multiplier numeric not null default 1.6 check (cost_multiplier >= 1),
  unlock_level integer not null default 1 check (unlock_level > 0)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold bigint not null default 0 check (gold >= 0),
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level > 0),
  unlocked_recipes text[] not null default array['americano_hot','cafe_latte_hot']::text[],
  updated_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id text not null references public.ingredients(id),
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);

create table if not exists public.user_upgrades (
  user_id uuid not null references auth.users(id) on delete cascade,
  upgrade_id text not null references public.upgrades(id),
  level integer not null default 1 check (level > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, upgrade_id)
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','COMPLETED','ABANDONED')),
  duration_sec integer not null default 300 check (duration_sec > 0),
  remaining_sec integer not null default 300 check (remaining_sec >= 0),
  earned_gold integer not null default 0 check (earned_gold >= 0),
  earned_xp integer not null default 0 check (earned_xp >= 0),
  board_state jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.session_orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null references public.recipes(id),
  status text not null default 'WAITING' check (status in ('WAITING','SERVED','EXPIRED')),
  reward_gold integer not null check (reward_gold >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists game_sessions_user_id_idx on public.game_sessions(user_id);
create index if not exists session_orders_user_id_idx on public.session_orders(user_id);
create index if not exists session_orders_session_id_idx on public.session_orders(session_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Guest'))
  on conflict (user_id) do nothing;
  insert into public.user_progress(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.ingredients enable row level security;
alter table public.stations enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_step_inputs enable row level security;
alter table public.processing_rules enable row level security;
alter table public.upgrades enable row level security;
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_inventory enable row level security;
alter table public.user_upgrades enable row level security;
alter table public.game_sessions enable row level security;
alter table public.session_orders enable row level security;

create policy "catalog ingredients readable" on public.ingredients for select to anon, authenticated using (true);
create policy "catalog stations readable" on public.stations for select to anon, authenticated using (true);
create policy "catalog recipes readable" on public.recipes for select to anon, authenticated using (is_active);
create policy "catalog recipe steps readable" on public.recipe_steps for select to anon, authenticated using (true);
create policy "catalog step inputs readable" on public.recipe_step_inputs for select to anon, authenticated using (true);
create policy "catalog processing rules readable" on public.processing_rules for select to anon, authenticated using (true);
create policy "catalog upgrades readable" on public.upgrades for select to anon, authenticated using (true);

create policy "own profile select" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own progress select" on public.user_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "own progress insert" on public.user_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own progress update" on public.user_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own inventory all" on public.user_inventory for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own upgrades all" on public.user_upgrades for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own sessions all" on public.game_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own session orders all" on public.session_orders for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.user_progress;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.game_sessions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.session_orders;
exception when duplicate_object then null; end $$;

commit;
