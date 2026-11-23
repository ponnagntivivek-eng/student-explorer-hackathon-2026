# Location accuracy: tester report (v8)

## Bugs found and fixed
| # | Bug | Effect | Fix |
|---|-----|--------|-----|
| 1 | Local area index matched generic words ("road", "street", "college", "church"…) and substrings | An address with "Road" could pin MG Road; "College" pinned a random campus | Generic-word list, whole-word matching, phrase-only keys for ambiguous names |
| 2 | Area-centre hits (score up to 95) outranked real street/venue results | Typed full address pinned the neighbourhood centre | Area hits capped for long addresses; venue/name match boosts map results; `precision` returned |
| 3 | GPS used low accuracy + 60 s cached fix | Pins/distances off by hundreds of metres to km | High-accuracy sampling keeps best fix (≤40 m or best in 10 s); accuracy shown (±m) |
| 4 | IP (city-level) location treated as exact; could be another city | Distances of hundreds of km; add-place marked "exact" | Flagged approximate; ignored when outside Bengaluru; add-place not exact |
| 5 | Missing lat/lng became 0,0 (Number(null)) | Reverse-geocode / place save with bad coordinates | `optNum` + range validation on all coordinate inputs |
| 6 | Duplicate identical network-location request | Wasted call | Single request |
| 7 | Admin "use current location" overwrote visitor origin | Distances changed for that browser | Removed side effect |
| 8 | Geocode cache unbounded; reverse-geocode fallback looked like a real address | Memory growth; misleading label | Capped cache; "Near …" + `approximate` flag |
| 10 | **`inBlrMetro()` was used but never defined** in place discovery (`discovery.server.ts`) | Every lookup of a place by name threw and was silently swallowed, so auto-find returned nothing; 3 existing tests were failing | Defined it; all 24 location tests now pass |
| 9 | Area-only pins were presented like exact pins | Wrong directions | UI warns "Area centre only", server returns `needsVerification` |

## Tests
`npm test` now includes `src/lib/explorer/geocode.test.ts` (7 tests, all passing): typo matching, generic-word safety, college-name priority, venue-over-area ranking, out-of-Bengaluru rejection, long-address shortening.

## Suggestions (not yet done)
- Add a draggable pin on the admin map to fine-tune coordinates.
- Add a Google Maps API key (optional) for the best venue accuracy; OpenStreetMap is the free default.
- Rate-limit ip-location and add server-side caching per IP.
- Store `locationPrecision` for user-added places and show "verify pin" in admin lists.

## Test status
Location suites (`places.test.ts` + `geocode.test.ts`): 24/24 pass (was 21/24 before). Unrelated platform/template tests in `scripts/` (17) and `app-data` (1) fail identically on your original v6 and were left alone.
Not run here: full `tsc` type-check and a live browser run (dependencies and outbound map APIs weren't available).

## V10 upgrade addendum

See `V10_IMPLEMENTATION_NOTES.md` for the V10 scope and explicit limitations. JavaScript and TypeScript syntax checks passed. Bengaluru location/discovery tests passed 24/24. Full build/typecheck could not be completed in the editing environment because the dependency installation timed out and left Vite and type packages missing. Do not treat this ZIP as a verified production release until `npm ci`, `npm run typecheck`, `npm test` and `npm run build` pass on the deployment machine.

---
## V11 test run (this build)
* `npx tsc --noEmit`: **0 errors**.
* `node --experimental-strip-types --test src/lib/places/places.test.ts src/lib/explorer/geocode.test.ts`: **27/27 pass**.
* `node scripts/api-smoke.mjs` against a running server: **52/52 pass** (accounts, per-user saved trips, admin-only leaderboard, publish → student place, live mode, moderation, email privacy, featured scheduling, coordinate validation).
* `npm run build`: succeeds.
* Browser checks (Playwright, Chromium): sidebar Profile opens the profile; Rank tab shows "11th place of 21"; Saved trips list shows the student's plans; admin Rankings tab loads and Publish works; no horizontal overflow on a 390 px phone in light or dark mode.
* Data persists across a server restart (account created before restart signed in afterwards).
* Not verified: real GPS, live OpenStreetMap/Photon/Wikimedia calls (outbound map APIs are blocked in the test sandbox), a Neon/Postgres deployment, Safari/iOS.
