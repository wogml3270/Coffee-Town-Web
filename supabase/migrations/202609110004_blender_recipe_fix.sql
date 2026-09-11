-- Remove obsolete binary blender-base recipes even when the preceding
-- recipe-tier migration was already applied on a remote project.
delete from public.recipe_combinations
where output_item in (
  'blended_base_3',
  'vanilla_blended_base',
  'matcha_blended_base',
  'chocolate_blended_base'
);

-- The blender now consumes three physical inventory items locally:
-- flavor base + milk + ice. No binary recipe row is required.
