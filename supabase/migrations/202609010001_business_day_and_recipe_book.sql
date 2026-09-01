begin;

alter table public.user_progress drop constraint if exists user_progress_unlocked_stage_check;
alter table public.user_progress add constraint user_progress_unlocked_stage_check check (unlocked_stage between 1 and 15);
alter table public.user_progress add column if not exists discovered_recipes jsonb not null default '[]'::jsonb;

commit;
