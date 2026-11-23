-- Weekly Student Picks scheduled by admins, plus indexes for moderation/public queries.
create table if not exists explorer_featured_picks (
  id text primary key,
  place_id text not null,
  starts_on date not null,
  ends_on date not null,
  position integer not null default 0,
  note text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  constraint explorer_featured_dates_ok check (ends_on >= starts_on)
);
create unique index if not exists explorer_featured_picks_unique
  on explorer_featured_picks (place_id, starts_on);
create index if not exists explorer_featured_picks_window_idx
  on explorer_featured_picks (starts_on, ends_on, position);

create index if not exists explorer_places_created_idx on explorer_places (created_at desc);
create index if not exists explorer_places_status_idx on explorer_places ((coalesce(payload->>'status', 'published')));
