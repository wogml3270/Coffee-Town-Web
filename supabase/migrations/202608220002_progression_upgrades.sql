begin;

insert into public.upgrades
  (id, station_id, name, description, effect_type, effect_value, max_level, base_cost, cost_multiplier, unlock_level)
values
  ('inventory_storage', null, '인벤토리 선반', '재료 보관 슬롯을 한 칸 늘립니다.', 'STORAGE', 1, 2, 450, 1.9, 2),
  ('grinder_automation', 'grinder', '반자동 그라인더', '영업 중 원두를 자동으로 보충합니다.', 'STARTING_STOCK', 1, 3, 1400, 1.8, 5)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  effect_type = excluded.effect_type,
  effect_value = excluded.effect_value,
  max_level = excluded.max_level,
  base_cost = excluded.base_cost,
  cost_multiplier = excluded.cost_multiplier,
  unlock_level = excluded.unlock_level;

commit;
