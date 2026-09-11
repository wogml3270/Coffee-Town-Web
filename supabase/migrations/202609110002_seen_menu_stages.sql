begin;

alter table public.user_progress
  add column if not exists seen_menu_stages jsonb not null default '[]'::jsonb;

commit;
