# Student Explorer v12 — what changed

## 1. Admin login (admin@studentexplorer.local / admin123)
Cause: v11 removed the default password, so the server made a random one (printed once in the log).
Fix: on your own machine (no `DATABASE_URL`, `NODE_ENV` not `production`) the admin password is `admin123`, or your
`ADMIN_PASSWORD` from `.env` (placeholder values copied from `.env.example` are ignored). An existing database is
re-synced on start, so old databases no longer lock you out. The admin is also created before the first sign-in.
**Production still never ships a default**: set `ADMIN_PASSWORD` there.

## 2. Search bar (`public/explorer/search-engine.js`)
- Root cause of "Koramangal shows everything": the old search matched the whole card text, and every card says
  "X km from Koramangala". Search now reads only each place's own data (name, area, category, description, tips, reviews).
- Typos work: `koramangal`, `kormangala`, `cubon park`, `indra nagar`, `ramu tifin`.
- Not 100% match: `quiet place to study wifi`, `cheap dosa` find places by similar meaning/description.
- Areas: `koramangala`, `cafes in hsr`: places inside/near the area, nearest first, with "0.8 km from Koramangala".
  Empty area -> nearest places + "add one" prompt instead of a blank screen.
- Autocomplete dropdown (places, areas, topics, recent searches), keyboard (up/down/enter/esc), screen-reader roles, "Did you mean".
- Best match stays first (the old code re-sorted by distance and destroyed relevance).
- New places added by students/admin are indexed automatically (even with an empty description: name, area and category are used).
- Budget parsing fixed: `5th block`, `100 ft road` are no longer read as prices.

## 3. Report wrong pin / address / photo
New form: choose problem type, correct address (geocoded to a suggested pin), "use my location", note and a photo
(auto-shrunk). Works for the built-in places too (they used to answer "Place not found"). Admin panel shows address,
photo, GPS and an **Apply suggested pin** button; the reporter earns 20 XP when a pin fix is applied.

## 4. Budget cap per person (Squad trip planner)
Live status (within / tight / over), progress bar, group cap, spend guide per stop and one-click **cheaper swaps**
that bring the plan under the cap. The cap is saved with the plan and shown in the WhatsApp share text.

## 5. Saved trips reliability
- People signed in on `/login` (cookie only) were treated as logged out: fixed (`isLoggedIn()`).
- A slow network at page load used to log you out: now only a real 401 does.
- Plans are always saved on the device first (a list, not one slot) and **auto-upload after login**; the list shows
  "This device only" vs saved, with a Sync button and clear messages.

## 6. Verified visits (`src/lib/explorer/visit-rules.ts`)
Allowed distance = pin tolerance + the GPS error your phone reports (max 100 m):
exact pin small venue 120 m, big site (park/campus/fort/lake/mall/street) 450 m, area-only pin 2 km.
10 m from the pin always works; 2 km away is accepted only for area-level pins and flags the pin for the admin.
Several honest visitors standing in the same spot far from the pin produce an automatic "suggested pin" report.
GPS now samples for a few seconds and keeps the best fix. Anti-spoof: impossible travel between visits is rejected;
8 verified visits per day. Too-far message tells the user the distance and offers "Report wrong pin".

## 7. Squads and XP (`xp-rules.ts`)
- "Invite squad" -> WhatsApp link `?squad=CODE`; friends join (login first if needed).
- Every member who verifies all stops earns 40 XP; the leader earns 10 XP per finishing friend (max 5) and +50 on Complete.
- Shared challenge "3 friends, 3 places, one day": +60 XP each. Squad Leader progress meter (x/5 trips) in Profile > Saved trips.
- XP weighting: review+photo > review > rating only; first useful review on a quiet place (+20) beats the 10th on a busy one
  (halved); quiet-place visit bonus, busy places 20 instead of 30; approved photo 20 (+10 quiet, +5 if reviewed).
- "Why you got XP": every row in Recent XP activity (and Profile overview) explains itself.

## 8. Weekend motivation
Saturday/Sunday (IST) only, once per day, rotating "Go explore Bengaluru" dialog with squad-planner and nearby buttons.
Never interrupts login or other dialogs.

## Database
New migration `migrations/0010_accuracy_squads_xp.sql` (applies automatically on start).

## Tests
`npm test` now also runs search (14 tests) and visit/XP/squad rules (10 tests). I also ran the page in Chromium with a
stubbed API for search, report form, budget cap, local save, weekend and squad-join dialogs.
Not run here: the full server against a real database (no `node_modules`/network in my sandbox) — please run
`npm install && npm run dev` once and try: admin login, a verified visit, a report with photo, and a squad invite.
