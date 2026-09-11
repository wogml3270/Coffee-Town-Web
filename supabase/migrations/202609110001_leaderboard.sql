begin;

create table if not exists public.shift_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_id integer not null check (stage_id between 1 and 15),
  score integer not null check (score between 0 and 10000000),
  earned_gold bigint not null check (earned_gold >= 0),
  completed_orders integer not null check (completed_orders >= 0),
  mistakes integer not null check (mistakes >= 0),
  discarded_items integer not null check (discarded_items >= 0),
  max_combo integer not null check (max_combo >= 0),
  average_satisfaction integer not null check (average_satisfaction between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists shift_results_user_created_idx
  on public.shift_results (user_id, created_at desc);

create table if not exists public.stage_best_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_id integer not null check (stage_id between 1 and 15),
  best_score integer not null check (best_score between 0 and 10000000),
  shift_result_id bigint not null references public.shift_results(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (user_id, stage_id)
);

alter table public.shift_results enable row level security;
alter table public.stage_best_scores enable row level security;
revoke all on table public.shift_results, public.stage_best_scores from anon, authenticated;
grant select on table public.shift_results, public.stage_best_scores to authenticated;

drop policy if exists "shift_results_select_own" on public.shift_results;
create policy "shift_results_select_own" on public.shift_results
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "stage_best_scores_select_own" on public.stage_best_scores;
create policy "stage_best_scores_select_own" on public.stage_best_scores
  for select to authenticated using ((select auth.uid()) = user_id);

drop function if exists public.record_shift_result(integer, integer, bigint, integer, integer, integer, integer, integer);
create function public.record_shift_result(
  p_stage_id integer,
  p_score integer,
  p_earned_gold bigint,
  p_completed_orders integer,
  p_mistakes integer,
  p_discarded_items integer,
  p_max_combo integer,
  p_average_satisfaction integer
)
returns table (recorded_score integer, is_personal_best boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result_id bigint;
  v_previous_best integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_stage_id not between 1 and 15 or p_score not between 0 and 10000000 then
    raise exception 'INVALID_SHIFT_RESULT';
  end if;

  select best_score into v_previous_best
  from public.stage_best_scores
  where user_id = v_user_id and stage_id = p_stage_id;

  insert into public.shift_results (
    user_id, stage_id, score, earned_gold, completed_orders, mistakes,
    discarded_items, max_combo, average_satisfaction
  ) values (
    v_user_id, p_stage_id, p_score, greatest(p_earned_gold, 0), greatest(p_completed_orders, 0),
    greatest(p_mistakes, 0), greatest(p_discarded_items, 0), greatest(p_max_combo, 0),
    least(greatest(p_average_satisfaction, 0), 100)
  ) returning id into v_result_id;

  insert into public.stage_best_scores (user_id, stage_id, best_score, shift_result_id)
  values (v_user_id, p_stage_id, p_score, v_result_id)
  on conflict (user_id, stage_id) do update
    set best_score = excluded.best_score,
        shift_result_id = excluded.shift_result_id,
        updated_at = now()
    where excluded.best_score > public.stage_best_scores.best_score;

  return query select p_score, v_previous_best is null or p_score > v_previous_best;
end;
$$;

drop function if exists public.get_leaderboard(integer);
create function public.get_leaderboard(p_limit integer default 50)
returns table (
  rank_position bigint,
  nickname text,
  score bigint,
  stages_ranked bigint,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select
      best.user_id,
      sum(best.best_score)::bigint as total_score,
      count(*)::bigint as stage_count
    from public.stage_best_scores best
    group by best.user_id
  ), ranked as (
    select
      totals.user_id,
      row_number() over (order by totals.total_score desc, totals.stage_count desc, totals.user_id) as rank_position,
      coalesce(
        nullif(trim(profile.nickname), ''),
        '바리스타 ' || upper(substr(md5(totals.user_id::text), 1, 4))
      ) as nickname,
      totals.total_score,
      totals.stage_count
    from totals
    left join public.profiles profile on profile.user_id = totals.user_id
  )
  select
    ranked.rank_position,
    ranked.nickname,
    ranked.total_score,
    ranked.stage_count,
    ranked.user_id = auth.uid() as is_me
  from ranked
  where ranked.rank_position <= least(greatest(coalesce(p_limit, 50), 1), 100)
     or ranked.user_id = auth.uid()
  order by ranked.rank_position;
$$;

revoke all on function public.record_shift_result(integer, integer, bigint, integer, integer, integer, integer, integer) from public;
grant execute on function public.record_shift_result(integer, integer, bigint, integer, integer, integer, integer, integer) to authenticated;
revoke all on function public.get_leaderboard(integer) from public;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;

commit;
