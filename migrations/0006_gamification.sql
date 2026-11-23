-- Student Explorer V10: persistent, server-authoritative achievements and XP.
create table if not exists student_verified_visits (
  id text primary key,
  user_id text not null references "user"("id") on delete cascade,
  place_id text not null,
  visited_at timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  accuracy_m double precision not null,
  unique (user_id, place_id)
);
create index if not exists student_verified_visits_user_time_idx on student_verified_visits(user_id, visited_at desc);
create table if not exists student_xp_transactions (
  id text primary key,
  user_id text not null references "user"("id") on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null,
  source_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_key)
);
create index if not exists student_xp_user_time_idx on student_xp_transactions(user_id, created_at desc);
create table if not exists student_achievements (
  user_id text not null references "user"("id") on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
create table if not exists student_featured_badges (
  user_id text not null references "user"("id") on delete cascade,
  achievement_id text not null,
  sort_order integer not null default 0,
  primary key (user_id, achievement_id)
);
create table if not exists monthly_explorer_challenges (
  id text primary key,
  title text not null,
  description text not null,
  target integer not null check (target > 0),
  reward_xp integer not null check (reward_xp >= 0),
  starts_at date not null,
  ends_at date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists student_challenge_progress (
  user_id text not null references "user"("id") on delete cascade,
  challenge_id text not null references monthly_explorer_challenges(id) on delete cascade,
  progress integer not null default 0,
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);
