# Student Explorer V11 — what changed

## New: rank system (automatic and live)
* Rankings publish **automatically**: no publish button or confirmation is needed. Students always see the current top 10 and their own place, and it changes as soon as XP or badges change (the Rank tab refreshes every 15 s).
* Order: most XP, then most badges, then whoever reached that XP first. Admins are not ranked.
* **Admin Panel → 🏆 Rankings**: the same live list for you (Top 10/25/50/100, refreshes every 15 s). Optional controls: *Update now*, *Hide from students* and the Live-mode switch (on by default).
* **Students → Profile (sidebar or profile menu) → 🏆 Rank**: podium, top 10, own place highlighted ("11th place of 150 students"), XP needed to overtake the next place.
* Public data contains name, college, level, XP and badge count only; never emails or ids.
* `scripts/dev-seed-ranking.mjs` (DEV ONLY) creates demo students for previews.

## Fixed
* **Saved trips / accounts disappearing**: local development used an in-memory database that was wiped on every restart. It now saves to `./.data/pglite` (set `PGLITE_DATA_DIR=memory` to opt out). Production should use `DATABASE_URL` (Neon/Postgres).
* **Sidebar "Profile" did nothing** (it scrolled to Achievements, or the menu closed instantly). It now opens a real Profile screen: Overview, Rank, Badges, Saved trips, Log out.
* Mobile: page was wider than the screen (cut-off hero text, selects, ledger, tabs). Fixed; admin tabs and wide tables scroll.
* Dark mode: unreadable hamburger icon, light "Add Place" button, light cards in several panels, new screens fully themed.
* Featured picks are larger: bigger hero card and photo cards in Weekly Student Picks (shows top-rated places when nothing has been reviewed yet).
* `discovery.server.ts` called `googleGeocode`/`inBlrMetro` without defining them: name lookups failed silently. Fixed.
* TypeScript: 0 errors (was 22).

## Location finding
* Works anywhere in India (configurable `GEO_COUNTRY_CODES`, `GEO_BOUNDS`, `GEO_BIAS_CENTER`); no more Bengaluru-only restriction.
* Multiple matches are returned (Nominatim + Photon + local index) and flagged `ambiguous`; the admin recommend flow never silently picks the first of several different places.
* Generic words ("road", "college") no longer match random landmarks; area-centre pins are marked "verify".
* New `/api/maps/suggest` autocomplete endpoint; coordinates are validated (no more silent 0,0).

## Security / privacy
* No default admin password: set `ADMIN_PASSWORD` (a random one-time password is printed to the server log if you forget).
* Public place data no longer includes the email of the student who added it.
* Student-submitted places are **pending** until an admin publishes them (Admin → Places → ✓ Publish / Reject / Unpublish). Admin API for scheduling Weekly Picks with start/end dates exists (`/api/admin/featured`); there is no admin screen for it yet.

## Run / verify
```
npm install
npm run dev            # http://localhost:8080
ADMIN_PASSWORD=... ADMIN_EMAIL=... node scripts/api-smoke.mjs   # 52 API checks against a running server
npm test               # unit tests
npm run build
```
