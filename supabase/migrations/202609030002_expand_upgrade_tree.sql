begin;

insert into public.upgrade_nodes
  (id, category_id, name, description, effect_key, max_level, position_x, position_y, is_premium)
values
  ('espressoSpeed', 'equipment', '에스프레소 튜닝', '그라인더·에스프레소 머신·스팀·콜드브루 제조 시간을 추가 단축합니다.', 'espressoSpeed', 5, 1, 0, false),
  ('coldDrinkSpeed', 'equipment', '콜드 바 튜닝', '제빙기·탄산수 머신·블렌더 제조 시간을 추가 단축합니다.', 'coldDrinkSpeed', 5, 2, 0, false),
  ('multitask', 'barista', '멀티태스킹', '설비 작동 중에도 이동하여 다음 작업을 준비합니다.', 'multitask', 1, 1, 1, false),
  ('feverProfit', 'fever', '피버 매출 증폭', '피버 중 주문 골드 배율을 높입니다.', 'feverProfit', 5, 2, 2, false),
  ('comboGuard', 'service', '서비스 회복', '잘못된 서빙으로 잃는 콤보를 줄이거나 완전히 보호합니다.', 'comboGuard', 2, 1, 3, false),
  ('autoServe', 'automation', '스마트 픽업 시스템', '현재 주문의 완성 음료를 즉시 자동 서빙합니다.', 'autoServe', 1, 4, 1, true)
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

update public.upgrade_nodes set position_x = 3, position_y = 1 where id = 'automation';

insert into public.upgrade_levels (upgrade_id, level, cost, effect_value, effect_unit)
select id, level, base_cost * level, effect_per_level * level, unit
from (values
  ('espressoSpeed', 18000::bigint, 5::numeric, 'percent'),
  ('coldDrinkSpeed', 22000::bigint, 5::numeric, 'percent'),
  ('feverProfit', 45000::bigint, 0.35::numeric, 'multiplier')
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
on conflict (upgrade_id, level) do update set
  cost = excluded.cost,
  effect_value = excluded.effect_value,
  effect_unit = excluded.effect_unit;

delete from public.upgrade_prerequisites
where upgrade_id in ('espressoSpeed', 'coldDrinkSpeed', 'multitask', 'feverProfit', 'comboGuard', 'automation', 'autoServe');

insert into public.upgrade_prerequisites (upgrade_id, required_upgrade_id, required_level) values
  ('espressoSpeed', 'speed', 2),
  ('coldDrinkSpeed', 'espressoSpeed', 3),
  ('multitask', 'movement', 3),
  ('feverProfit', 'feverDuration', 3),
  ('comboGuard', 'tips', 3),
  ('automation', 'speed', 5),
  ('automation', 'multitask', 1),
  ('automation', 'feverDuration', 3),
  ('automation', 'tips', 3),
  ('autoServe', 'automation', 1),
  ('autoServe', 'tips', 5),
  ('autoServe', 'feverProfit', 3);

commit;
