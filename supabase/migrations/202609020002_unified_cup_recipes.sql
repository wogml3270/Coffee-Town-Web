-- Existing installations: replace hot/cold base cups with one reusable cup item.
update public.recipe_combinations
set input_a = 'cup', updated_at = now()
where input_a in ('hot_cup', 'cold_cup');

update public.recipe_combinations
set input_b = 'cup', updated_at = now()
where input_b in ('hot_cup', 'cold_cup');
