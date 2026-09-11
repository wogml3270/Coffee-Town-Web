-- Coffee Town: complete public game-data reset and final schema
-- WARNING: This deletes every Coffee Town row in the public schema.
-- Preserved: auth.users, auth.identities, Storage, OAuth/provider settings.
-- Run this entire file once in the Supabase SQL Editor.

begin;

-- ---------------------------------------------------------------------------
-- 1. Remove current and legacy Coffee Town objects
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.purchase_upgrade(text) cascade;
drop function if exists public.record_shift_result(integer, integer, bigint, integer, integer, integer, integer, integer) cascade;
drop function if exists public.get_leaderboard(integer) cascade;

drop table if exists
  public.stage_best_scores,
  public.shift_results,
  public.player_upgrades,
  public.upgrade_prerequisites,
  public.upgrade_levels,
  public.upgrade_nodes,
  public.upgrade_categories,
  public.recipe_combinations,
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

-- ---------------------------------------------------------------------------
-- 2. Player profile and persistent progression
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nickname_length
    check (nickname is null or char_length(trim(nickname)) between 2 and 16)
);

create unique index profiles_nickname_unique
  on public.profiles (lower(trim(nickname)))
  where nickname is not null and trim(nickname) <> '';

create table public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold bigint not null default 0 check (gold >= 0),
  unlocked_stage integer not null default 1 check (unlocked_stage between 1 and 15),
  upgrades jsonb not null default '{}'::jsonb check (jsonb_typeof(upgrades) = 'object'),
  discovered_recipes jsonb not null default '[]'::jsonb check (jsonb_typeof(discovered_recipes) = 'array'),
  seen_menu_stages jsonb not null default '[]'::jsonb check (jsonb_typeof(seen_menu_stages) = 'array'),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;

revoke all on table public.profiles, public.user_progress from anon, authenticated;
grant select, insert, update on table public.profiles, public.user_progress to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy progress_select_own on public.user_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy progress_insert_own on public.user_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy progress_update_own on public.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (user_id) do update set
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

-- Recreate clean public rows for accounts that already exist in Supabase Auth.
insert into public.profiles (user_id, email, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users;

insert into public.user_progress (user_id)
select id from auth.users;

-- ---------------------------------------------------------------------------
-- 3. Binary inventory combinations
-- ---------------------------------------------------------------------------

create table public.recipe_combinations (
  id bigint generated always as identity primary key,
  input_a text not null,
  input_b text not null,
  output_item text not null,
  sort_order integer not null unique,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint recipe_inputs_differ check (input_a <> input_b)
);

-- Order-independent uniqueness permits several routes to one output while
-- preventing duplicated A+B and B+A rows.
create unique index recipe_combinations_input_pair_unique
  on public.recipe_combinations (least(input_a, input_b), greatest(input_a, input_b));

alter table public.recipe_combinations enable row level security;
revoke all on table public.recipe_combinations from anon, authenticated;
grant select on table public.recipe_combinations to anon, authenticated;
create policy recipe_combinations_read on public.recipe_combinations
  for select to anon, authenticated using (enabled);

insert into public.recipe_combinations (input_a, input_b, output_item, sort_order) values
  ('espresso', 'cup', 'espresso_cup', 1),
  ('cup', 'ice', 'iced_cup', 2),
  ('iced_cup', 'milk', 'iced_milk_base', 3),
  ('espresso_cup', 'hot_water', 'americano', 4),
  ('espresso_cup', 'ice', 'iced_espresso_base', 5),
  ('iced_cup', 'espresso', 'iced_espresso_base', 6),
  ('iced_espresso_base', 'cold_water', 'iced_americano', 7),
  ('iced_espresso_base', 'milk', 'iced_latte', 8),
  ('iced_milk_base', 'espresso', 'iced_latte', 9),
  ('espresso_cup', 'steamed_milk', 'latte', 10),
  ('espresso_cup', 'vanilla_syrup', 'vanilla_espresso', 11),
  ('vanilla_espresso', 'steamed_milk', 'vanilla_latte', 12),
  ('espresso_cup', 'chocolate_sauce', 'mocha_base', 13),
  ('mocha_base', 'steamed_milk', 'mocha', 14),
  ('cup', 'vanilla_syrup', 'vanilla_cup', 15),
  ('vanilla_cup', 'steamed_milk', 'vanilla_milk_cup', 16),
  ('vanilla_milk_cup', 'espresso', 'caramel_base', 17),
  ('caramel_base', 'caramel_sauce', 'caramel_macchiato', 18),
  ('iced_cup', 'lemon_syrup', 'lemon_base', 19),
  ('lemon_base', 'sparkling_water', 'lemonade', 20),
  ('iced_cup', 'grapefruit_syrup', 'grapefruit_base', 21),
  ('grapefruit_base', 'sparkling_water', 'grapefruitade', 22),
  ('cup', 'yuzu_syrup', 'yuzu_base', 23),
  ('yuzu_base', 'hot_water', 'yuzu_tea', 24),
  ('cup', 'matcha_powder', 'matcha_cup', 25),
  ('matcha_cup', 'steamed_milk', 'matcha_latte', 26),
  ('cup', 'chocolate_sauce', 'chocolate_cup', 27),
  ('chocolate_cup', 'steamed_milk', 'chocolate_latte', 28),
  ('iced_cup', 'cold_brew_concentrate', 'cold_brew_base', 29),
  ('cold_brew_base', 'cold_water', 'cold_brew', 30),
  ('iced_cup', 'oat_milk', 'oat_cup', 31),
  ('oat_cup', 'cold_brew_concentrate', 'oat_cold_brew_base', 32),
  ('oat_cold_brew_base', 'vanilla_bean', 'vanilla_oat_cold_brew', 33);

-- Blender recipes are intentionally absent here. The blender consumes three
-- local inventory items atomically: flavor base + milk + ice.

-- ---------------------------------------------------------------------------
-- 4. Upgrade catalog, tree, prices and player ownership
-- ---------------------------------------------------------------------------

create table public.upgrade_categories (
  id text primary key,
  name text not null,
  display_order integer not null default 0,
  color text not null default '#6f8c78'
);

create table public.upgrade_nodes (
  id text primary key,
  category_id text not null references public.upgrade_categories(id) on delete restrict,
  name text not null,
  description text not null,
  effect_key text not null unique,
  max_level integer not null check (max_level between 1 and 10),
  position_x integer not null default 0,
  position_y integer not null default 0,
  is_premium boolean not null default false,
  enabled boolean not null default true,
  balance_version integer not null default 1
);

create table public.upgrade_levels (
  upgrade_id text not null references public.upgrade_nodes(id) on delete cascade,
  level integer not null check (level > 0),
  cost bigint not null check (cost >= 0),
  effect_value numeric not null default 0,
  effect_unit text not null default 'percent',
  primary key (upgrade_id, level)
);

create table public.upgrade_prerequisites (
  upgrade_id text not null references public.upgrade_nodes(id) on delete cascade,
  required_upgrade_id text not null references public.upgrade_nodes(id) on delete cascade,
  required_level integer not null check (required_level > 0),
  primary key (upgrade_id, required_upgrade_id),
  constraint upgrade_prerequisite_not_self check (upgrade_id <> required_upgrade_id)
);

create table public.player_upgrades (
  user_id uuid not null references auth.users(id) on delete cascade,
  upgrade_id text not null references public.upgrade_nodes(id) on delete cascade,
  level integer not null default 0 check (level >= 0),
  purchased_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, upgrade_id)
);

insert into public.upgrade_categories (id, name, display_order, color) values
  ('equipment', '설비', 1, '#9b6945'),
  ('barista', '바리스타', 2, '#527a69'),
  ('fever', '피버', 3, '#b56a45'),
  ('service', '서비스', 4, '#677e9b'),
  ('automation', '자동화', 5, '#aa842e');

insert into public.upgrade_nodes
  (id, category_id, name, description, effect_key, max_level, position_x, position_y, is_premium)
values
  ('speed', 'equipment', '설비 정비', '모든 설비의 제조 시간을 단계마다 12% 단축합니다.', 'speed', 5, 0, 0, false),
  ('espressoSpeed', 'equipment', '에스프레소 튜닝', '그라인더·에스프레소 머신·스팀·콜드브루 제조 시간을 단계마다 추가 5% 단축합니다.', 'espressoSpeed', 5, 1, 0, false),
  ('coldDrinkSpeed', 'equipment', '콜드 바 튜닝', '제빙기·탄산수 머신·블렌더 제조 시간을 단계마다 추가 5% 단축합니다.', 'coldDrinkSpeed', 5, 2, 0, false),
  ('movement', 'barista', '이동 훈련', '바리스타의 기본 이동속도를 단계마다 10% 높입니다.', 'movement', 5, 0, 1, false),
  ('multitask', 'barista', '멀티태스킹', '설비 작동 중에도 이동하여 다음 작업을 준비합니다.', 'multitask', 1, 1, 1, false),
  ('feverCharge', 'fever', '피버 충전', '2단계마다 피버 발동에 필요한 연속 주문 수를 1회 줄입니다.', 'feverCharge', 5, 0, 2, false),
  ('feverDuration', 'fever', '피버 지속', '피버 지속시간을 단계마다 3초 연장합니다.', 'feverDuration', 5, 1, 2, false),
  ('feverProfit', 'fever', '피버 매출 증폭', '피버 중 주문 골드 배율을 단계마다 0.35배 추가합니다.', 'feverProfit', 5, 2, 2, false),
  ('tips', 'service', '서비스 교육', '모든 주문의 팁과 정산 골드를 단계마다 6% 높입니다.', 'tips', 5, 0, 3, false),
  ('comboGuard', 'service', '서비스 회복', '오서빙 시 콤보 손실을 줄이고 최종 단계에서 완전히 보호합니다.', 'comboGuard', 2, 1, 3, false),
  ('automation', 'automation', '오토 바리스타 모듈', '발견한 유효 레시피의 재료가 모이면 자동으로 조합합니다.', 'automation', 1, 0, 4, true),
  ('autoServe', 'automation', '스마트 픽업 시스템', '현재 주문과 일치하는 완성 음료를 자동으로 서빙합니다.', 'autoServe', 1, 1, 4, true);

insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit)
select definition.id, generated_level, definition.base_cost * generated_level,
       definition.effect_per_level * generated_level, definition.unit
from (values
  ('speed', 8000::bigint, 12::numeric, 'percent'),
  ('espressoSpeed', 18000::bigint, 5::numeric, 'percent'),
  ('coldDrinkSpeed', 22000::bigint, 5::numeric, 'percent'),
  ('movement', 6000::bigint, 10::numeric, 'percent'),
  ('feverCharge', 12000::bigint, 0.5::numeric, 'combo'),
  ('feverDuration', 10000::bigint, 3::numeric, 'seconds'),
  ('feverProfit', 45000::bigint, 0.35::numeric, 'multiplier'),
  ('tips', 9000::bigint, 6::numeric, 'percent')
) as definition(id, base_cost, effect_per_level, unit)
cross join generate_series(1, 5) as generated_level;

insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit) values
  ('multitask', 1, 180000, 1, 'unlock'),
  ('comboGuard', 1, 120000, 1, 'combo'),
  ('comboGuard', 2, 650000, 2, 'combo'),
  ('automation', 1, 10000000, 1, 'unlock'),
  ('autoServe', 1, 50000000, 1, 'unlock');

insert into public.upgrade_prerequisites (upgrade_id, required_upgrade_id, required_level) values
  ('espressoSpeed', 'speed', 2),
  ('coldDrinkSpeed', 'espressoSpeed', 3),
  ('multitask', 'movement', 3),
  ('feverDuration', 'feverCharge', 2),
  ('feverProfit', 'feverDuration', 3),
  ('comboGuard', 'tips', 3),
  ('automation', 'speed', 5),
  ('automation', 'multitask', 1),
  ('automation', 'feverDuration', 3),
  ('automation', 'tips', 3),
  ('autoServe', 'automation', 1),
  ('autoServe', 'tips', 5),
  ('autoServe', 'feverProfit', 3);

alter table public.upgrade_categories enable row level security;
alter table public.upgrade_nodes enable row level security;
alter table public.upgrade_levels enable row level security;
alter table public.upgrade_prerequisites enable row level security;
alter table public.player_upgrades enable row level security;

revoke all on table
  public.upgrade_categories,
  public.upgrade_nodes,
  public.upgrade_levels,
  public.upgrade_prerequisites,
  public.player_upgrades
from anon, authenticated;

grant select on table
  public.upgrade_categories,
  public.upgrade_nodes,
  public.upgrade_levels,
  public.upgrade_prerequisites
to anon, authenticated;
grant select on table public.player_upgrades to authenticated;

create policy upgrade_categories_read on public.upgrade_categories
  for select to anon, authenticated using (true);
create policy upgrade_nodes_read on public.upgrade_nodes
  for select to anon, authenticated using (enabled);
create policy upgrade_levels_read on public.upgrade_levels
  for select to anon, authenticated using (true);
create policy upgrade_prerequisites_read on public.upgrade_prerequisites
  for select to anon, authenticated using (true);
create policy player_upgrades_read_own on public.player_upgrades
  for select to authenticated using ((select auth.uid()) = user_id);

create function public.purchase_upgrade(p_upgrade_id text)
returns table (gold bigint, upgrade_id text, new_level integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := auth.uid();
  v_gold bigint;
  v_current_level integer;
  v_max_level integer;
  v_next_cost bigint;
  v_effect_key text;
begin
  if v_buyer is null then raise exception 'AUTH_REQUIRED'; end if;

  select progress.gold into v_gold
  from public.user_progress progress
  where progress.user_id = v_buyer
  for update;
  if v_gold is null then raise exception 'PROGRESS_NOT_FOUND'; end if;

  select node.max_level, node.effect_key into v_max_level, v_effect_key
  from public.upgrade_nodes node
  where node.id = p_upgrade_id and node.enabled;
  if v_max_level is null then raise exception 'UPGRADE_NOT_FOUND'; end if;

  select coalesce(owned.level, 0) into v_current_level
  from public.player_upgrades owned
  where owned.user_id = v_buyer and owned.upgrade_id = p_upgrade_id;
  v_current_level := coalesce(v_current_level, 0);
  if v_current_level >= v_max_level then raise exception 'MAX_LEVEL'; end if;

  if exists (
    select 1
    from public.upgrade_prerequisites requirement
    left join public.player_upgrades owned
      on owned.user_id = v_buyer
     and owned.upgrade_id = requirement.required_upgrade_id
    where requirement.upgrade_id = p_upgrade_id
      and coalesce(owned.level, 0) < requirement.required_level
  ) then
    raise exception 'PREREQUISITE_REQUIRED';
  end if;

  select configured.cost into v_next_cost
  from public.upgrade_levels configured
  where configured.upgrade_id = p_upgrade_id
    and configured.level = v_current_level + 1;
  if v_next_cost is null then raise exception 'LEVEL_NOT_CONFIGURED'; end if;
  if v_gold < v_next_cost then raise exception 'INSUFFICIENT_GOLD'; end if;

  insert into public.player_upgrades (user_id, upgrade_id, level, purchased_at, updated_at)
  values (v_buyer, p_upgrade_id, v_current_level + 1, now(), now())
  on conflict (user_id, upgrade_id) do update set
    level = excluded.level,
    updated_at = now();

  update public.user_progress progress set
    gold = progress.gold - v_next_cost,
    upgrades = jsonb_set(progress.upgrades, array[v_effect_key], to_jsonb(v_current_level + 1), true),
    updated_at = now()
  where progress.user_id = v_buyer
  returning progress.gold into v_gold;

  return query select v_gold, p_upgrade_id, v_current_level + 1;
end;
$$;

revoke all on function public.purchase_upgrade(text) from public, anon;
grant execute on function public.purchase_upgrade(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Shift scores and leaderboard
-- ---------------------------------------------------------------------------

create table public.shift_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_id integer not null check (stage_id between 1 and 15),
  score integer not null check (score between 0 and 10000000),
  earned_gold bigint not null check (earned_gold >= 0),
  completed_orders integer not null check (completed_orders >= 0),
  mistakes integer not null check (mistakes >= 0),
  discarded_items integer not null check (discarded_items >= 0),
  max_combo integer not null check (max_combo >= 0),
  average_satisfaction integer not null check (average_satisfaction between 0 and 100),
  created_at timestamptz not null default now()
);

create index shift_results_user_created_idx
  on public.shift_results (user_id, created_at desc);

create table public.stage_best_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_id integer not null check (stage_id between 1 and 15),
  best_score integer not null check (best_score between 0 and 10000000),
  shift_result_id bigint not null references public.shift_results(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (user_id, stage_id)
);

alter table public.shift_results enable row level security;
alter table public.stage_best_scores enable row level security;
revoke all on table public.shift_results, public.stage_best_scores from anon, authenticated;
grant select on table public.shift_results, public.stage_best_scores to authenticated;

create policy shift_results_select_own on public.shift_results
  for select to authenticated using ((select auth.uid()) = user_id);
create policy stage_best_scores_select_own on public.stage_best_scores
  for select to authenticated using ((select auth.uid()) = user_id);

create function public.record_shift_result(
  p_stage_id integer,
  p_score integer,
  p_earned_gold bigint,
  p_completed_orders integer,
  p_mistakes integer,
  p_discarded_items integer,
  p_max_combo integer,
  p_average_satisfaction integer
)
returns table (recorded_score integer, is_personal_best boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result_id bigint;
  v_previous_best integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_stage_id not between 1 and 15 or p_score not between 0 and 10000000 then
    raise exception 'INVALID_SHIFT_RESULT';
  end if;

  select best.best_score into v_previous_best
  from public.stage_best_scores best
  where best.user_id = v_user_id and best.stage_id = p_stage_id;

  insert into public.shift_results (
    user_id, stage_id, score, earned_gold, completed_orders, mistakes,
    discarded_items, max_combo, average_satisfaction
  ) values (
    v_user_id,
    p_stage_id,
    p_score,
    greatest(p_earned_gold, 0),
    greatest(p_completed_orders, 0),
    greatest(p_mistakes, 0),
    greatest(p_discarded_items, 0),
    greatest(p_max_combo, 0),
    least(greatest(p_average_satisfaction, 0), 100)
  )
  returning id into v_result_id;

  insert into public.stage_best_scores (user_id, stage_id, best_score, shift_result_id)
  values (v_user_id, p_stage_id, p_score, v_result_id)
  on conflict (user_id, stage_id) do update set
    best_score = excluded.best_score,
    shift_result_id = excluded.shift_result_id,
    updated_at = now()
  where excluded.best_score > public.stage_best_scores.best_score;

  return query
  select p_score, v_previous_best is null or p_score > v_previous_best;
end;
$$;

create function public.get_leaderboard(p_limit integer default 50)
returns table (
  rank_position bigint,
  nickname text,
  score bigint,
  stages_ranked bigint,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select
      best.user_id,
      sum(best.best_score)::bigint as total_score,
      count(*)::bigint as stage_count
    from public.stage_best_scores best
    group by best.user_id
  ), ranked_players as (
    select
      totals.user_id,
      row_number() over (
        order by totals.total_score desc, totals.stage_count desc, totals.user_id
      ) as calculated_rank,
      coalesce(
        nullif(trim(profile.nickname), ''),
        '바리스타 ' || upper(substr(md5(totals.user_id::text), 1, 4))
      ) as display_nickname,
      totals.total_score,
      totals.stage_count
    from totals
    left join public.profiles profile on profile.user_id = totals.user_id
  )
  select
    ranked_players.calculated_rank,
    ranked_players.display_nickname,
    ranked_players.total_score,
    ranked_players.stage_count,
    ranked_players.user_id = auth.uid()
  from ranked_players
  where ranked_players.calculated_rank <= least(greatest(coalesce(p_limit, 50), 1), 100)
     or ranked_players.user_id = auth.uid()
  order by ranked_players.calculated_rank;
$$;

revoke all on function public.record_shift_result(integer, integer, bigint, integer, integer, integer, integer, integer)
  from public, anon;
grant execute on function public.record_shift_result(integer, integer, bigint, integer, integer, integer, integer, integer)
  to authenticated;
revoke all on function public.get_leaderboard(integer) from public;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;

commit;

-- Optional verification after the transaction commits:
-- select table_name from information_schema.tables
-- where table_schema = 'public' order by table_name;
-- select count(*) as recipe_count from public.recipe_combinations;
-- select count(*) as upgrade_count from public.upgrade_nodes;
