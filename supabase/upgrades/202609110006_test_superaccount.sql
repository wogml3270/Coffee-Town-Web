-- Test-only full-access progress for the designated QA account.
-- Run manually in Supabase SQL Editor; this does not alter RLS or other users.
begin;

insert into public.user_progress (user_id)
values ('25d83c94-ad5c-42e4-85d8-e789962181ea')
on conflict (user_id) do nothing;

update public.user_progress
set gold = 999999999,
    unlocked_stage = 15,
    upgrades = coalesce((
      select jsonb_object_agg(effect_key, max_level)
      from public.upgrade_nodes
      where enabled
    ), '{}'::jsonb),
    discovered_recipes = coalesce((
      select jsonb_agg(to_jsonb(item_id) order by item_id)
      from (
        select output_item as item_id from public.recipe_combinations where enabled
        union
        select unnest(array[
          'ground_coffee','espresso','cup','hot_water','cold_water','milk','oat_milk',
          'steamed_milk','ice','sparkling_water','lemon_syrup','grapefruit_syrup',
          'yuzu_syrup','vanilla_syrup','vanilla_bean','chocolate_sauce','caramel_sauce',
          'matcha_powder','cold_brew_concentrate','americano','iced_americano','latte',
          'iced_latte','vanilla_latte','mocha','caramel_macchiato','lemonade',
          'grapefruitade','yuzu_tea','matcha_latte','chocolate_latte','cold_brew',
          'vanilla_oat_cold_brew','mocha_blended','vanilla_blended','matcha_blended',
          'chocolate_blended'
        ]::text[]) as item_id
      ) all_items
    ), '[]'::jsonb),
    seen_menu_stages = '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]'::jsonb,
    updated_at = now()
where user_id = '25d83c94-ad5c-42e4-85d8-e789962181ea';

insert into public.player_upgrades (user_id, upgrade_id, level, purchased_at, updated_at)
select '25d83c94-ad5c-42e4-85d8-e789962181ea', id, max_level, now(), now()
from public.upgrade_nodes
where enabled
on conflict (user_id, upgrade_id) do update
set level = excluded.level, updated_at = now();

commit;
