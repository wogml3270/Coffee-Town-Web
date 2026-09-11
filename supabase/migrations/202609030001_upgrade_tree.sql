begin;

create table if not exists public.upgrade_categories (
  id text primary key,
  name text not null,
  display_order integer not null default 0,
  color text not null default '#6f8c78'
);

create table if not exists public.upgrade_nodes (
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

create table if not exists public.upgrade_levels (
  upgrade_id text not null references public.upgrade_nodes(id) on delete cascade,
  level integer not null check (level > 0),
  cost bigint not null check (cost >= 0),
  effect_value numeric not null default 0,
  effect_unit text not null default 'percent',
  primary key (upgrade_id, level)
);

create table if not exists public.upgrade_prerequisites (
  upgrade_id text not null references public.upgrade_nodes(id) on delete cascade,
  required_upgrade_id text not null references public.upgrade_nodes(id) on delete cascade,
  required_level integer not null check (required_level > 0),
  primary key (upgrade_id, required_upgrade_id),
  check (upgrade_id <> required_upgrade_id)
);

create table if not exists public.player_upgrades (
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
  ('automation', '자동화', 5, '#aa842e')
on conflict (id) do update set name = excluded.name, display_order = excluded.display_order, color = excluded.color;

insert into public.upgrade_nodes
  (id, category_id, name, description, effect_key, max_level, position_x, position_y, is_premium)
values
  ('speed', 'equipment', '설비 정비', '모든 설비의 제조 시간을 단축합니다.', 'speed', 5, 0, 0, false),
  ('espressoSpeed', 'equipment', '에스프레소 튜닝', '그라인더·에스프레소 머신·스팀·콜드브루 제조 시간을 추가 단축합니다.', 'espressoSpeed', 5, 1, 0, false),
  ('coldDrinkSpeed', 'equipment', '콜드 바 튜닝', '제빙기·탄산수 머신·블렌더 제조 시간을 추가 단축합니다.', 'coldDrinkSpeed', 5, 2, 0, false),
  ('movement', 'barista', '이동 훈련', '바리스타의 기본 이동속도를 높입니다.', 'movement', 5, 0, 1, false),
  ('multitask', 'barista', '멀티태스킹', '설비 작동 중에도 이동하여 다음 작업을 준비합니다.', 'multitask', 1, 1, 1, false),
  ('feverCharge', 'fever', '피버 충전', '피버 발동에 필요한 연속 주문 수를 줄입니다.', 'feverCharge', 5, 0, 2, false),
  ('feverDuration', 'fever', '피버 지속', '피버 모드가 유지되는 시간을 늘립니다.', 'feverDuration', 5, 1, 2, false),
  ('feverProfit', 'fever', '피버 매출 증폭', '피버 중 주문 골드 배율을 높입니다.', 'feverProfit', 5, 2, 2, false),
  ('tips', 'service', '서비스 교육', '모든 주문의 골드 보너스를 높입니다.', 'tips', 5, 0, 3, false),
  ('comboGuard', 'service', '서비스 회복', '잘못된 서빙으로 잃는 콤보를 줄이거나 완전히 보호합니다.', 'comboGuard', 2, 1, 3, false),
  ('automation', 'automation', '오토 바리스타 모듈', '유효한 재료 조합을 자동으로 처리합니다.', 'automation', 1, 3, 1, true),
  ('autoServe', 'automation', '스마트 픽업 시스템', '현재 주문의 완성 음료를 즉시 자동 서빙합니다.', 'autoServe', 1, 4, 1, true)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  effect_key = excluded.effect_key,
  max_level = excluded.max_level,
  position_x = excluded.position_x,
  position_y = excluded.position_y,
  is_premium = excluded.is_premium;

insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit)
select id, level, base_cost * level, effect_per_level * level, unit
from (values
  ('speed', 8000::bigint, 12::numeric, 'percent'),
  ('espressoSpeed', 18000::bigint, 5::numeric, 'percent'),
  ('coldDrinkSpeed', 22000::bigint, 5::numeric, 'percent'),
  ('movement', 6000::bigint, 10::numeric, 'percent'),
  ('feverCharge', 12000::bigint, 0.5::numeric, 'combo'),
  ('feverDuration', 10000::bigint, 3::numeric, 'seconds'),
  ('feverProfit', 45000::bigint, 0.35::numeric, 'multiplier'),
  ('tips', 9000::bigint, 6::numeric, 'percent')
) as definitions(id, base_cost, effect_per_level, unit)
cross join generate_series(1, 5) as level
on conflict (upgrade_id, level) do update set
  cost = excluded.cost,
  effect_value = excluded.effect_value,
  effect_unit = excluded.effect_unit;

insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit)
values
  ('multitask', 1, 180000, 1, 'unlock'),
  ('comboGuard', 1, 120000, 1, 'combo'),
  ('comboGuard', 2, 650000, 2, 'combo'),
  ('automation', 1, 10000000, 1, 'unlock'),
  ('autoServe', 1, 50000000, 1, 'unlock')
on conflict (upgrade_id, level) do update set cost = excluded.cost, effect_value = excluded.effect_value;

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
  ('autoServe', 'feverProfit', 3)
on conflict (upgrade_id, required_upgrade_id) do update set required_level = excluded.required_level;

insert into public.player_upgrades (user_id, upgrade_id, level, purchased_at, updated_at)
select progress.user_id, node.id, least((entry.value)::integer, node.max_level), now(), now()
from public.user_progress progress
cross join lateral jsonb_each_text(coalesce(progress.upgrades, '{}'::jsonb)) entry
join public.upgrade_nodes node on node.effect_key = entry.key
where entry.value ~ '^[0-9]+$' and (entry.value)::integer > 0
on conflict (user_id, upgrade_id) do update set
  level = greatest(public.player_upgrades.level, excluded.level),
  updated_at = now();

alter table public.upgrade_categories enable row level security;
alter table public.upgrade_nodes enable row level security;
alter table public.upgrade_levels enable row level security;
alter table public.upgrade_prerequisites enable row level security;
alter table public.player_upgrades enable row level security;

grant select on public.upgrade_categories, public.upgrade_nodes, public.upgrade_levels, public.upgrade_prerequisites to anon, authenticated;
grant select on public.player_upgrades to authenticated;

drop policy if exists "upgrade_categories_read" on public.upgrade_categories;
drop policy if exists "upgrade_nodes_read" on public.upgrade_nodes;
drop policy if exists "upgrade_levels_read" on public.upgrade_levels;
drop policy if exists "upgrade_prerequisites_read" on public.upgrade_prerequisites;
drop policy if exists "player_upgrades_read_own" on public.player_upgrades;
create policy "upgrade_categories_read" on public.upgrade_categories for select to anon, authenticated using (true);
create policy "upgrade_nodes_read" on public.upgrade_nodes for select to anon, authenticated using (enabled);
create policy "upgrade_levels_read" on public.upgrade_levels for select to anon, authenticated using (true);
create policy "upgrade_prerequisites_read" on public.upgrade_prerequisites for select to anon, authenticated using (true);
create policy "player_upgrades_read_own" on public.player_upgrades for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.purchase_upgrade(p_upgrade_id text)
returns table (gold bigint, upgrade_id text, new_level integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  buyer uuid := auth.uid();
  current_gold bigint;
  current_level integer;
  maximum_level integer;
  next_cost bigint;
  effect_name text;
begin
  if buyer is null then raise exception 'AUTH_REQUIRED'; end if;

  select progress.gold into current_gold
  from public.user_progress progress where progress.user_id = buyer for update;
  if current_gold is null then raise exception 'PROGRESS_NOT_FOUND'; end if;

  select node.max_level, node.effect_key into maximum_level, effect_name
  from public.upgrade_nodes node where node.id = p_upgrade_id and node.enabled;
  if maximum_level is null then raise exception 'UPGRADE_NOT_FOUND'; end if;

  select coalesce(player.level, 0) into current_level
  from public.player_upgrades player where player.user_id = buyer and player.upgrade_id = p_upgrade_id;
  current_level := coalesce(current_level, 0);
  if current_level >= maximum_level then raise exception 'MAX_LEVEL'; end if;

  if exists (
    select 1 from public.upgrade_prerequisites requirement
    left join public.player_upgrades owned
      on owned.user_id = buyer and owned.upgrade_id = requirement.required_upgrade_id
    where requirement.upgrade_id = p_upgrade_id and coalesce(owned.level, 0) < requirement.required_level
  ) then raise exception 'PREREQUISITE_REQUIRED'; end if;

  select level_data.cost into next_cost from public.upgrade_levels level_data
  where level_data.upgrade_id = p_upgrade_id and level_data.level = current_level + 1;
  if next_cost is null then raise exception 'LEVEL_NOT_CONFIGURED'; end if;
  if current_gold < next_cost then raise exception 'INSUFFICIENT_GOLD'; end if;

  insert into public.player_upgrades (user_id, upgrade_id, level, purchased_at, updated_at)
  values (buyer, p_upgrade_id, current_level + 1, now(), now())
  on conflict (user_id, upgrade_id) do update set level = excluded.level, updated_at = now();

  update public.user_progress progress set
    gold = progress.gold - next_cost,
    upgrades = jsonb_set(progress.upgrades, array[effect_name], to_jsonb(current_level + 1), true),
    updated_at = now()
  where progress.user_id = buyer
  returning progress.gold into current_gold;

  return query select current_gold, p_upgrade_id, current_level + 1;
end;
$$;

revoke all on function public.purchase_upgrade(text) from public, anon;
grant execute on function public.purchase_upgrade(text) to authenticated;

commit;
