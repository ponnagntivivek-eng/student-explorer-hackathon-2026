-- V17: site feedback box. Anyone can send feedback (text + optional photo); only admins can read it.
create table if not exists site_feedback (
  id text primary key,
  user_id text references "user"("id") on delete set null,
  user_email text not null default '',
  user_name text not null default '',
  contact_email text not null default '',
  kind text not null default 'idea' check (kind in ('bug', 'idea', 'place', 'praise', 'other')),
  rating integer check (rating between 1 and 5),
  message text not null,
  photo text,
  page_url text not null default '',
  user_agent text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewed', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_feedback_status_idx on site_feedback(status, created_at desc);
