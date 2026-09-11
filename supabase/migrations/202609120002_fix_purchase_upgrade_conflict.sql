begin;

-- The output column `upgrade_id` shadows the player_upgrades column inside
-- PL/pgSQL. Naming the primary-key constraint avoids an ambiguous ON CONFLICT
-- target when the RPC inserts the next owned level.
create or replace function public.purchase_upgrade(p_upgrade_id text)
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
  on conflict on constraint player_upgrades_pkey do update set
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

commit;
