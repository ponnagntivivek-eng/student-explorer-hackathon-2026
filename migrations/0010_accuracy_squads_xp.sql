-- V12: richer wrong-pin reports (address + photo), self-healing visit verification, squads, XP explanations.
alter table explorer_place_reports add column if not exists suggested_address text not null default '';
alter table explorer_place_reports add column if not exists photo text;
alter table explorer_place_reports add column if not exists reporter_lat double precision;
alter table explorer_place_reports add column if not exists reporter_lng double precision;
alter table explorer_place_reports add column if not exists reporter_accuracy_m double precision;
alter table explorer_place_reports add column if not exists source text not null default 'user';
alter table explorer_place_reports drop constraint if exists explorer_place_reports_kind_check;
alter table explorer_place_reports add constraint explorer_place_reports_kind_check
  check (kind in ('wrong_pin', 'wrong_photo', 'wrong_address', 'other'));

alter table student_verified_visits add column if not exists distance_m double precision;
alter table student_verified_visits add column if not exists strength text not null default 'precise';
create index if not exists student_verified_visits_place_idx on student_verified_visits(place_id);

alter table student_xp_transactions add column if not exists detail text not null default '';

create table if not exists squad_members (
  trip_id text not null,
  user_id text not null references "user"("id") on delete cascade,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (trip_id, user_id)
);
create index if not exists squad_members_user_idx on squad_members(user_id);
