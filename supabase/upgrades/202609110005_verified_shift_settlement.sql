-- Apply ONCE to the existing 0.6.0 schema. No player data is deleted.
begin;

create table if not exists public.shift_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_id integer not null check (stage_id between 1 and 15),
  seed integer not null,
  upgrades jsonb not null,
  protocol_version integer not null check (protocol_version = 1),
  started_at timestamptz not null default now(),
  settled_at timestamptz,
  result_id bigint references public.shift_results(id)
);
create index if not exists shift_sessions_user_started on public.shift_sessions (user_id, started_at desc);
alter table public.shift_sessions enable row level security;
revoke all on public.shift_sessions from anon, authenticated;
grant select on public.shift_sessions to authenticated;
drop policy if exists shift_sessions_read_own on public.shift_sessions;
create policy shift_sessions_read_own on public.shift_sessions for select to authenticated using ((select auth.uid()) = user_id);

alter table public.shift_results add column if not exists verified boolean not null default false;
-- Keep legacy records intact; a previously unverified best must not block a verified best.
create table if not exists public.verified_stage_best_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_id integer not null check (stage_id between 1 and 15),
  best_score integer not null check (best_score between 0 and 10000000),
  shift_result_id bigint not null references public.shift_results(id),
  updated_at timestamptz not null default now(),
  primary key (user_id, stage_id)
);
alter table public.verified_stage_best_scores enable row level security;
revoke all on public.verified_stage_best_scores from anon, authenticated;
grant select on public.verified_stage_best_scores to authenticated;
drop policy if exists verified_scores_read_own on public.verified_stage_best_scores;
create policy verified_scores_read_own on public.verified_stage_best_scores for select to authenticated using ((select auth.uid()) = user_id);

insert into public.user_progress(user_id) select id from auth.users on conflict do nothing;
revoke insert, update, delete on public.user_progress from anon, authenticated;
-- The old RPC accepts arbitrary client scores and must no longer be callable.
revoke all on function public.record_shift_result(integer, integer, bigint, integer, integer, integer, integer, integer) from public, anon, authenticated;

create or replace function public.begin_shift_session(p_stage_id integer, p_version integer)
returns setof public.shift_sessions language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_unlocked integer;
  v_upgrades jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_version is distinct from 1 or p_stage_id is null or p_stage_id not between 1 and 15 then raise exception 'INVALID_SESSION'; end if;
  select unlocked_stage into v_unlocked from public.user_progress where user_id = v_user for update;
  if v_unlocked is null or p_stage_id > v_unlocked then raise exception 'STAGE_LOCKED'; end if;
  if (select count(*) from public.shift_sessions where user_id = v_user and started_at > now() - interval '1 minute') >= 10 then raise exception 'TOO_MANY_STARTS'; end if;
  select coalesce(jsonb_object_agg(upgrade_id, level), '{}'::jsonb) into v_upgrades from public.player_upgrades where user_id = v_user;
  return query insert into public.shift_sessions(user_id, stage_id, seed, upgrades, protocol_version)
    values(v_user, p_stage_id, floor(random() * 2147483647)::integer, v_upgrades, p_version) returning *;
end;
$$;
revoke all on function public.begin_shift_session(integer, integer) from public, anon;
grant execute on function public.begin_shift_session(integer, integer) to authenticated;

-- Only the Edge Function's service role may pass server-replayed result values here.
create or replace function public.commit_verified_shift(p_user_id uuid, p_session_id uuid, p_result jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_session public.shift_sessions;
  v_result_id bigint;
  v_elapsed integer := (p_result->>'elapsed')::integer;
  v_score integer := (p_result->>'score')::integer;
  v_gold bigint := (p_result->>'gold')::bigint;
begin
  select * into v_session from public.shift_sessions where id = p_session_id and user_id = p_user_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if v_session.settled_at is not null then return; end if;
  if v_elapsed is null or v_elapsed not between 0 and 360 or v_elapsed > extract(epoch from (clock_timestamp() - v_session.started_at)) + 2
    or v_gold is null or v_gold < 0 or v_score is null or v_score not between 0 and 10000000 then raise exception 'INVALID_RESULT'; end if;
  perform 1 from public.user_progress where user_id = p_user_id for update;
  if not found then raise exception 'PROGRESS_NOT_FOUND'; end if;
  insert into public.shift_results(user_id, stage_id, score, earned_gold, completed_orders, mistakes, discarded_items, max_combo, average_satisfaction, verified)
    values(p_user_id, v_session.stage_id, v_score, v_gold, (p_result->>'completedOrders')::integer,
      (p_result->>'mistakes')::integer, (p_result->>'discardedItems')::integer,
      (p_result->>'maxCombo')::integer, (p_result->>'averageSatisfaction')::integer, true)
    returning id into v_result_id;
  update public.user_progress as progress set
    gold = progress.gold + v_gold,
    unlocked_stage = greatest(progress.unlocked_stage, case when v_elapsed = 360 then least(15, v_session.stage_id + 1) else v_session.stage_id end),
    discovered_recipes = (select coalesce(jsonb_agg(distinct value), '[]'::jsonb) from jsonb_array_elements(progress.discovered_recipes || (p_result->'discoveries'))),
    seen_menu_stages = (select coalesce(jsonb_agg(distinct value), '[]'::jsonb) from jsonb_array_elements(progress.seen_menu_stages || (p_result->'seenMenuStages'))),
    updated_at = now()
    where user_id = p_user_id;
  if v_elapsed = 360 then
    insert into public.verified_stage_best_scores(user_id, stage_id, best_score, shift_result_id)
      values(p_user_id, v_session.stage_id, v_score, v_result_id)
      on conflict (user_id, stage_id) do update set best_score = excluded.best_score, shift_result_id = excluded.shift_result_id, updated_at = now()
      where excluded.best_score > public.verified_stage_best_scores.best_score;
  end if;
  update public.shift_sessions set settled_at = now(), result_id = v_result_id where id = p_session_id;
end;
$$;
revoke all on function public.commit_verified_shift(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.commit_verified_shift(uuid, uuid, jsonb) to service_role;
grant all on public.shift_sessions, public.verified_stage_best_scores to service_role;

create or replace function public.get_leaderboard(p_limit integer default 50)
returns table (rank_position bigint, nickname text, score bigint, stages_ranked bigint, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with totals as (
    select best.user_id, sum(best.best_score)::bigint as total_score, count(*)::bigint as stage_count
    from public.verified_stage_best_scores best group by best.user_id
  ), ranked as (
    select totals.*, row_number() over(order by total_score desc, stage_count desc, totals.user_id) as position,
      coalesce(nullif(trim(profile.nickname), ''), '바리스타 ' || upper(substr(md5(totals.user_id::text), 1, 4))) as display_name
    from totals left join public.profiles profile on profile.user_id = totals.user_id
  )
  select position, display_name, total_score, stage_count, user_id = auth.uid() from ranked
    where position <= least(greatest(coalesce(p_limit, 50), 1), 100) or user_id = auth.uid() order by position;
$$;
revoke all on function public.get_leaderboard(integer) from public;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;
commit;
