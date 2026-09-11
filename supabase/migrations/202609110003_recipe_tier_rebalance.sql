-- Align persisted recipe routes with the code-owned production tree.
-- Existing installs can run this migration safely more than once.
delete from public.recipe_combinations
where output_item in (
  'blended_base_3',
  'vanilla_blended_base',
  'matcha_blended_base',
  'chocolate_blended_base'
);

-- Blender recipes consume a selected flavor base plus milk and ice in the
-- gameplay station process. They are intentionally not binary DB combinations.
