-- V17: paid promotions (admin-controlled) + simple per-place visibility counters.
-- amount_paid and notes are PRIVATE: they are only returned to admins, never to the public API.
create table if not exists place_promotions (
  id text primary key,
  place_id text not null,
  tier text not null default 'featured' check (tier in ('featured', 'monthly', 'premium', 'custom')),
  priority integer not null default 50 check (priority between 0 and 100),
  placements text not null default 'category_top',
  offer_text text not null default '',
  starts_at date,
  ends_at date,
  amount_paid integer not null default 0,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists place_promotions_place_idx on place_promotions(place_id);

create table if not exists place_stats (
  place_id text not null,
  day date not null default current_date,
  views integer not null default 0,
  opens integer not null default 0,
  directions integer not null default 0,
  primary key (place_id, day)
);
