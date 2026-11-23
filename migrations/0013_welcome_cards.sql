-- V17: opening cards. The admin chooses which places visitors see in a popup when they open the site.
-- No rows = no popup (the site just loads normally).
create table if not exists welcome_cards (
  id text primary key,
  place_id text not null,
  kind text not null default 'highlight' check (kind in ('sponsored', 'highlight')),
  headline text not null default '',
  sort_order integer not null default 0,
  starts_at date,
  ends_at date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists welcome_cards_order_idx on welcome_cards(sort_order, created_at);
