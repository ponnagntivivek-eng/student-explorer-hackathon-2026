alter table "user" add column if not exists role text not null default 'student';

create table if not exists places (
  id serial primary key,
  name text not null,
  description text,
  category text not null default 'other',
  address text not null,
  latitude double precision,
  longitude double precision,
  photo_data text,
  status text not null default 'pending',
  featured boolean not null default false,
  created_by text references "user"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_places_status on places(status);

create table if not exists comments (
  id serial primary key,
  place_id integer not null references places(id) on delete cascade,
  user_id text references "user"(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists place_photos (
  id serial primary key,
  place_id integer not null references places(id) on delete cascade,
  data text not null,
  mime_type text not null default 'image/jpeg',
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id serial primary key,
  user_id text references "user"(id) on delete set null,
  name text not null,
  total numeric(10,2) not null default 0,
  expenses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists outings (
  id serial primary key,
  user_id text references "user"(id) on delete set null,
  title text not null,
  place_id integer references places(id) on delete set null,
  budget_id integer references budgets(id) on delete set null,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);
