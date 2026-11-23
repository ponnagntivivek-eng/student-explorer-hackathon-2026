# Student Explorer V10 — Bengaluru-first upgrade

## What changed in this build

### Premium experience
- Updated the visual system to midnight navy, explorer teal and soft neutral surfaces.
- Reworked the hero headline to **Discover More. Spend Less. Explore Together.**
- Added a photographic fallback to the featured hero panel so it is not an empty placeholder before admin picks exist.
- Refined navigation, buttons, destination cards, hover states, modal surfaces and dark-mode overrides.
- Added responsive achievement cards and mobile-friendly spacing.
- Added Bengaluru quick-search chips for Indiranagar, Koramangala, Jayanagar, Whitefield and Hebbal.

### Existing platform functionality preserved
- Kept the existing React/TanStack shell and the legacy Student Explorer app mounted in the home route.
- Kept the current authentication, profile menu/logout, destination CRUD, admin tools, weekly picks, place discovery, photos, reviews, routes, budgets, saved plans and expense diary integrations.
- Kept the existing OpenStreetMap / Nominatim / Photon / Overpass / OSRM / Valhalla discovery and route stack. No paid API key is required for the current free-provider path.
- Preserved Bengaluru geocoding precision safeguards from V8.

### V10 achievements and XP foundation
- Added migration `0006_gamification.sql` for verified visits, XP transactions, unlocked achievements, featured badges and monthly challenge progress.
- Added server-authoritative XP transactions with idempotent source keys and a daily 150 XP cap.
- Added 12 achievement definitions: First Explorer, Adventure Seeker, Budget Master, Hidden Gem Hunter, Photo Master, Community Hero, Squad Leader, Explorer Legend, City Explorer, Multi-City Explorer, Early Bird and Weekend Warrior.
- Added a dedicated achievement collection with rarity, progress, lock/unlock state, XP rewards and unlock dates.
- Added profile badge showcase selection (up to three unlocked badges).
- Added explicit one-time visit verification: user action, fresh GPS fix with reported accuracy <=80 m, destination proximity <=250 m, duplicate prevention and a five-visit daily limit. No background location tracking is used.
- Added XP for verified visits, published student reviews, approved photos, saved trip plans, admin-verified location corrections and verified completed group trips.
- Added a monthly Bengaluru Starter challenge: verify three different destinations in the current month for a 75 XP reward.
- Group-trip completion requires a verified visit at every saved stop. A budget achievement requires an entered budget cap and actual spend at completion; the spend is self-reported.

## Important limitations / not yet complete

This is a V10 upgrade build, not a claim that every item in the original master prompt is production-complete.

- Visit checks rely on device GPS and distance checks. They discourage accidental/low-effort claims but cannot cryptographically prevent a user from spoofing device location.
- Budget Master relies on a self-reported actual per-person spend compared with the saved cap; it is not receipt-verified.
- Hidden Gem Hunter progresses for places marked as hidden gems. The admin place editor now includes a **Hidden Gem** toggle.
- The monthly challenge is currently a fixed Bengaluru visit challenge. A full admin challenge builder, challenge archive and exclusive monthly badge editor are not included yet.
- Weekly/monthly/all-time/city leaderboard pages and XP moderation controls are not included in this patch.
- The existing admin interface remains the original functional admin modal with tabs; it has not been fully rebuilt into a separate desktop sidebar application.
- The original project still contains sample destination/review data. Review the seed content and ratings before a public launch; do not present sample ratings as independently verified community ratings.
- A real production database, production domain, backups, email delivery and uptime monitoring still need to be configured by the project owner.

## Database and admin security

- New V10 tables are created by `migrations/0006_gamification.sql`.
- Local development can use the existing embedded PGlite fallback; it is not durable across server restarts.
- Production should set `DATABASE_URL` to PostgreSQL/Neon.
- Local development retains the documented `admin@studentexplorer.local` / `admin123` seed account. Production no longer seeds the known default password; set a strong `ADMIN_EMAIL` and `ADMIN_PASSWORD` before deployment.
- Never commit `.env` or expose `GOOGLE_MAPS_API_KEY` in browser code.

## Bengaluru smoke-test checklist

1. Register and log in; open the Profile menu and verify Log Out remains available.
2. Search Indiranagar, Koramangala, Jayanagar, Whitefield and Hebbal.
3. Open a destination and check that its pin is not an area-centre fallback presented as an exact venue pin.
4. Use Directions and compare the destination name/address in Google Maps.
5. At a supported destination, tap **Verify visit** and grant location permission for that one-time check. Try again outside the 250 m radius and confirm the server rejects it.
6. Verify a second time at the same place and confirm no duplicate XP is awarded.
7. Open Achievements and check XP, progress, recent XP activity and the monthly challenge.
8. Unlock a badge in a test account and feature it on the profile; confirm locked badges cannot be featured.
9. Save a 2–3 stop group plan, verify each stop in person, then complete it from the Profile saved-plan list.
10. As an admin, add a destination manually, correct its address/coordinates and verify publishing and Weekly Student Picks.

## Build and test status in this editing environment

- `node --check public/explorer/app.js`: passed.
- `node --experimental-strip-types --check src/lib/explorer/api.server.ts`: passed.
- Bengaluru location/discovery tests: **24/24 passed** (`src/lib/places/places.test.ts` and `src/lib/explorer/geocode.test.ts`).
- Broader source tests were attempted; 34/36 passed in the selected set. Two tests could not load because `npm ci` did not finish installing dependencies (`@tanstack/react-start/server` and `jose`).
- Full `npm test`: 180 passed / 17 failed. Failures are in pre-existing workspace/template checks that reference omitted `.grok/skills/og` files and app-env template expectations; see the original V8 testing report for its pre-existing test caveats.
- `npm run typecheck`: blocked because the incomplete dependency install is missing `@types/node` and `vite/client`.
- `npm run build`: blocked because Vite is absent (`spawn vite ENOENT`). Re-run after a successful `npm ci` on your laptop.
- No live browser/device GPS test or live public map-service test was possible in this environment.

## Run locally in VS Code

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Open `http://localhost:8080`. For a durable deployment, set `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the hosting provider's environment settings, then deploy and verify that migration `0006_gamification.sql` applies successfully.
