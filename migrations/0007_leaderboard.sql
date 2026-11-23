-- Student Explorer: admin-published leaderboard (rank by XP, then badges).
create table if not exists leaderboard_snapshots (
  id text primary key,
  published_at timestamptz not null default now(),
  published_by text,
  total integer not null default 0,
  top jsonb not null default '[]'::jsonb
);
create table if not exists leaderboard_snapshot_ranks (
  snapshot_id text not null references leaderboard_snapshots(id) on delete cascade,
  user_id text not null,
  rank integer not null,
  xp integer not null,
  badges integer not null,
  primary key (snapshot_id, user_id)
);
create index if not exists leaderboard_snapshot_ranks_user_idx on leaderboard_snapshot_ranks(user_id);
create table if not exists leaderboard_settings (
  id integer primary key check (id = 1),
  live boolean not null default false,
  current_snapshot text,
  visible boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into leaderboard_settings (id) values (1) on conflict (id) do nothing;
