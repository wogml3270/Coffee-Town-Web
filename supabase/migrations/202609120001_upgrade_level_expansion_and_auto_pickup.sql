begin;

-- 일반 성장형 업그레이드는 10레벨까지 확장합니다.
update public.upgrade_nodes
set max_level = 10,
    balance_version = balance_version + 1
where id in (
  'speed', 'espressoSpeed', 'coldDrinkSpeed', 'movement',
  'feverCharge', 'feverDuration', 'feverProfit', 'tips'
);

update public.upgrade_nodes
set max_level = 5,
    balance_version = balance_version + 1
where id = 'comboGuard';

-- 레벨 1~10 비용과 효과를 모두 구성합니다. 기존 구매 레벨은 유지됩니다.
insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit)
select definition.id,
       generated_level,
       definition.base_cost * generated_level,
       definition.effect_per_level * generated_level,
       definition.unit
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
cross join generate_series(1, 10) as generated_level
on conflict (upgrade_id, level) do update set
  cost = excluded.cost,
  effect_value = excluded.effect_value,
  effect_unit = excluded.effect_unit;

insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit)
values
  ('comboGuard', 1, 120000, 1, 'combo'),
  ('comboGuard', 2, 650000, 2, 'combo'),
  ('comboGuard', 3, 1400000, 3, 'combo'),
  ('comboGuard', 4, 2600000, 4, 'combo'),
  ('comboGuard', 5, 4500000, 5, 'combo')
on conflict (upgrade_id, level) do update set
  cost = excluded.cost,
  effect_value = excluded.effect_value,
  effect_unit = excluded.effect_unit;

-- 설비 결과물을 한 번 더 상호작용하지 않고 인벤토리에 넣는 업그레이드입니다.
insert into public.upgrade_nodes
  (id, category_id, name, description, effect_key, max_level, position_x, position_y, is_premium, enabled)
values
  ('autoPickup', 'automation', '설비 자동 회수',
   '에스프레소 머신·탄산수 머신·제빙기·콜드브루 타워·그라인더 등의 완료 결과를 자동으로 인벤토리에 넣습니다.',
   'autoPickup', 1, 5, 1, true, true)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  effect_key = excluded.effect_key,
  max_level = excluded.max_level,
  position_x = excluded.position_x,
  position_y = excluded.position_y,
  is_premium = excluded.is_premium,
  enabled = true;

insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit)
values ('autoPickup', 1, 24000000, 1, 'unlock')
on conflict (upgrade_id, level) do update set
  cost = excluded.cost,
  effect_value = excluded.effect_value,
  effect_unit = excluded.effect_unit;

insert into public.upgrade_prerequisites (upgrade_id, required_upgrade_id, required_level)
values ('autoPickup', 'automation', 1)
on conflict (upgrade_id, required_upgrade_id) do update set
  required_level = excluded.required_level;

commit;
