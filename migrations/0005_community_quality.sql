-- Community accuracy reports and safe admin merge support.
create table if not exists explorer_place_reports (
  id text primary key,
  place_id text not null,
  reporter_user_id text references "user"("id") on delete set null,
  reporter_email text,
  kind text not null check (kind in ('wrong_pin', 'wrong_photo', 'other')),
  message text not null default '',
  suggested_lat double precision,
  suggested_lng double precision,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists explorer_place_reports_status_idx
  on explorer_place_reports(status, created_at desc);
create index if not exists explorer_place_reports_place_idx
  on explorer_place_reports(place_id);
