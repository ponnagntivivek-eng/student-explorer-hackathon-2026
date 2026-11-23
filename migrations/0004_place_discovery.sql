-- Free place discovery (OpenStreetMap / Wikipedia / Wikimedia Commons).
-- Only ADDS optional columns to the existing "places" table; nothing is removed or changed.
alter table places add column if not exists osm_type text;
alter table places add column if not exists osm_id bigint;
alter table places add column if not exists osm_tags jsonb;
alter table places add column if not exists description_source_url text;
-- 'upload' = a person uploaded it (never overwritten automatically); 'wikipedia' / 'commons' = found automatically
alter table places add column if not exists photo_origin text;
alter table places add column if not exists photo_source_url text;
alter table places add column if not exists photo_author text;
alter table places add column if not exists photo_license text;
alter table places add column if not exists photo_license_url text;

-- The same OpenStreetMap feature can only be listed once.
create unique index if not exists idx_places_osm_unique on places(osm_type, osm_id) where osm_id is not null;
