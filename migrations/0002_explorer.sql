create table if not exists explorer_profiles (
  user_id text primary key references "user" ("id") on delete cascade,
  college text not null default '',
  is_admin boolean not null default false,
  last_active_at timestamptz
);

create table if not exists explorer_places (
  id text primary key,
  payload jsonb not null,
  added_by text,
  created_at timestamptz not null default now()
);

create table if not exists explorer_trips (
  id text primary key,
  user_id text not null references "user" ("id") on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists explorer_trips_user_idx on explorer_trips (user_id);

create table if not exists explorer_reviews (
  id text primary key,
  place_id text not null,
  user_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists explorer_reviews_place_idx on explorer_reviews (place_id);
