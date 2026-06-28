-- Polaris — Supabase schema
-- Memory + structure + accountability + progress for the AI mentor.
-- Run this in the Supabase SQL editor. Every table is owned by auth.uid()
-- and protected by row-level security.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type goal_category as enum
    ('trading','art','fitness','coding','exams','startup','music','language','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_status as enum ('active','paused','completed','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_status as enum ('locked','active','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('pending','done','skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user','assistant','system');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  age           int,
  timezone      text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  summary     text,
  category    goal_category not null default 'other',
  context     jsonb,
  status      goal_status not null default 'active',
  momentum    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals(user_id);

-- ---------------------------------------------------------------------------
-- roadmaps -> phases -> milestones
-- ---------------------------------------------------------------------------
create table if not exists public.roadmaps (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references public.goals(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  overview    text not null,
  created_at  timestamptz not null default now()
);
create index if not exists roadmaps_goal_idx on public.roadmaps(goal_id);

create table if not exists public.phases (
  id           uuid primary key default gen_random_uuid(),
  roadmap_id   uuid not null references public.roadmaps(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  "order"      int not null default 0,
  status       item_status not null default 'locked'
);
create index if not exists phases_roadmap_idx on public.phases(roadmap_id);

create table if not exists public.milestones (
  id            uuid primary key default gen_random_uuid(),
  phase_id      uuid not null references public.phases(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  "order"       int not null default 0,
  status        item_status not null default 'locked',
  completed_at  timestamptz
);
create index if not exists milestones_phase_idx on public.milestones(phase_id);

-- ---------------------------------------------------------------------------
-- daily_tasks
-- ---------------------------------------------------------------------------
create table if not exists public.daily_tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  goal_id       uuid not null references public.goals(id) on delete cascade,
  milestone_id  uuid references public.milestones(id) on delete set null,
  date          date not null default current_date,
  title         text not null,
  detail        text,
  status        task_status not null default 'pending',
  "order"       int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists daily_tasks_user_date_idx on public.daily_tasks(user_id, date);

-- ---------------------------------------------------------------------------
-- checkins
-- ---------------------------------------------------------------------------
create table if not exists public.checkins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  goal_id      uuid not null references public.goals(id) on delete cascade,
  date         date not null default current_date,
  mood         int,
  note         text,
  mentor_reply text,
  created_at   timestamptz not null default now()
);
create index if not exists checkins_user_date_idx on public.checkins(user_id, date);

-- ---------------------------------------------------------------------------
-- messages  (the mentor chat — long-term memory)
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  goal_id     uuid not null references public.goals(id) on delete cascade,
  role        chat_role not null,
  content     text not null default '',
  artifact    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists messages_goal_idx on public.messages(goal_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security: every row belongs to its owner.
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.goals       enable row level security;
alter table public.roadmaps    enable row level security;
alter table public.phases      enable row level security;
alter table public.milestones  enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.checkins    enable row level security;
alter table public.messages    enable row level security;

-- profiles: id IS the user id
do $$ begin
  create policy "profiles_owner" on public.profiles
    for all using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- generic owner policy for the rest (all have user_id)
do $$
declare t text;
begin
  foreach t in array array['goals','roadmaps','phases','milestones','daily_tasks','checkins','messages']
  loop
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_owner', t
    );
  end loop;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
