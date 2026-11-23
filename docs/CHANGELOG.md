# v17 — Feedback box, directions from recommendations, advanced search, bug fixes

## Feedback (admin-only)
- Floating "Feedback" button (bottom-right, all pages) + sidebar link + footer link + "No matching places" box.
- Form: type, optional stars, message (required), optional photo (auto-shrunk), optional reply email.
- Stored in table `site_feedback` (migrations/0011_site_feedback.sql, applied automatically).
- API: POST /api/feedback (anyone, rate-limited 5 / 10 min). GET/PATCH/DELETE /api/admin/feedback* are ADMIN ONLY (401 guest, 403 student).
- Admin Dashboard > "💬 Feedback" tab: unread badge, filters (New/Reviewed/Done), photo viewer, mark reviewed/done, delete.

## Directions
- Clicking a recommendation (Instant Picks, Weekly Picks, a place in search suggestions) opens the place popup scrolled to the route map.
- Map embed falls back to the place name when a place has no coordinates.

## Search
- 🎤 voice search (browsers that support it), "/" focuses search, suggestions show rating + distance + "Directions" hint.
- "No results" box has a "Tell us what you were looking for" button (opens feedback as "missing place").

## Bug fixes
- Sign-up and location banners floated over popups and blocked their buttons: hidden while a popup is open.
- Active admin tab was unreadable (dark text on dark); toast moved above the feedback button; hero search placeholder no longer cut off.
- Removed `.npmrc` (it pointed to a sandbox-only folder and broke `npm install`).

## Phone / tablet / PC pass (v17b)
- Popups on phones were clipped on the right edge with double scrollbars (every popup): fixed.
- Close button no longer covers the address/title in popups; Add Place form no longer squeezes a column at 320px.
- Phone menu: added a visible ✕ close button (the open menu covered its own hamburger).
- Banners and the Feedback button step aside while the menu or a popup is open, or while typing in a search box.
- Compact location banner on phones; Feedback button rides above it.
- Place cards: "No photo yet" text no longer hidden under badges; distance box wraps cleanly.
- Header no longer overflows at ~1024px; bigger tap targets on touch screens; single focus ring on the hero search.
- Tested at 320, 375, 414, 768, 1024, 1366, 1920 px: no sideways scrolling, no console errors.

## Search history
- Recent searches are now kept per browser tab (cleared when the tab closes, survive a refresh). The old shared list is removed.

## Dark mode
- Category filter bar, place cards (Famous for, fares, nearest stop), popups, calculators and forms had light panels or light text that were unreadable in dark mode: fixed.
- "No photo yet" panel now fills the whole image area.

## Final pass (v17c)
- Fares: Namma Metro slabs now Rs 10-90 by distance; auto = official meter (Rs 36 first 2 km, Rs 18/km after, +50% 10pm-5am); bike taxi ~Rs 7-8/km; bus and metro no longer "surge" at peak. BMTC AC Vajra shown. Client (app.js) and server (fares.ts) match.
- Calculator: pick a place and it fills real fares and food cost, compares metro/bus/auto/bike (cheapest highlighted), round-trip switch, per-person budget check, "Send split to friends" (native share sheet on phones / WhatsApp) and Copy.
- Invite friends: phones use the native share sheet; desktop opens WhatsApp and also copies the text.
- Weekend card (existing, Sat/Sun India time, once a day) now lists the 3 best picks under Rs 300 near you; tap one for directions. Add ?weekend=1 to the address to preview on any day.
- Search suggestion prices no longer show "Rs 95-Rs 95".
- Data check: 48 places, all with coordinates inside Bengaluru (Nandi Hills is correctly outside); no duplicate pins; budgets consistent.

## Promotions (admin-controlled; prices are never shown on the website)
- Admin Dashboard > "📣 Promotions": pick a place, a plan preset (Featured 7d / Monthly 30d / Premium 30d / Custom), strength 0-100, where to show it (homepage spotlight, top of list, picks & weekend card), offer text, start/end dates, amount paid and notes (PRIVATE).
- Visitors only see: a "Sponsored" label (always on), the offer text, a highlighted card, and better placement. Money and notes are admin-only (public API returns neither).
- Promotions switch off by themselves after the end date. "End now", edit and delete are on each promotion.
- Visibility counters per place (shown on cards / opened / directions taps), last 30 days in the admin list, plus "Copy report" to send a shop a WhatsApp performance report.
- New tables: place_promotions, place_stats (migrations/0012_promotions.sql).
- Also: metro station-access cost uses the new bike-taxi rate; admin tabs wrap on desktop; weekend/instant picks ranking bug fixed.

## Promotions v2, location fix, compact phone cards
- Plans now look and rank clearly different: Premium = big HERO card (first thing visitors see) + homepage spotlight with photo + Instant Picks/weekend card + top of list, ranked above Monthly and Featured. Monthly = pinned card + offer + Picks/weekend card. Featured = pinned card with a slim Sponsored strip. Admin > Promotions has a "Plan comparison" table and a WhatsApp pitch to copy.
- Equal-strength shops take turns (random per visit). Caps: max 3 pinned cards in the list, max 2 sponsored in Instant Picks and the weekend card.
- Promotions end automatically after their end date, counted in India time. A tab left open drops them too (checked every 10 min). Admin "Feature" (recommendation) now asks "show until" and expires automatically.
- Hero featured card is bigger, labelled Sponsored, and tapping it opens that place's details (directions, photos, reviews). Spotlight cards do the same.
- Location bug: a device location far from Bengaluru (e.g. a laptop/tablet reporting Delhi from its Wi-Fi/network) is no longer used. The app explains why and asks the visitor to pick their Bengaluru area. GPS fixes in Bengaluru work as before and show accuracy.
- Phones: compact 2-column place cards (photo, name, price). Tap a card for details and directions. Far less scrolling.

## Admin account
- Admin email and password are set in the private .env file (ADMIN_EMAIL / ADMIN_PASSWORD). .env is git-ignored. When you host the site, set the same two values as environment variables on the host.

## Fixes: add place, featured, verify visit, offers, badge
- Places added by students inside Bengaluru now go live for everyone immediately (duplicates are still refused). A place located outside Bengaluru waits for admin approval. Admins can unpublish or reject any place.
- Featured recommendations no longer disappear when the place has no photo: the hero shows a clean name card instead.
- Verify Visit accepts visitors anywhere in the place's area, not only at the exact map point: small venues 250 m, large places (parks, malls, streets, campuses) 800 m, area-only pins 2.5 km, plus the phone's GPS error; poor-GPS limit raised to 250 m. Pins that look off are still flagged for the admin.
- Special offers are now bold: red/orange "Special offer" banner under the card photo, big offer box at the top of the place details, offer pill on the hero card, bold offer on spotlight and picks.
- "NEAR YOU" badge moved inside the photo (bottom-left) so it never overlaps the Sponsored strip. Equal min/max budgets show as one price.

## Scroll jerk after GPS (fixed)
- Cause: every small GPS update (including normal drift indoors) pulled the page back up to the places list (smooth-scrolled twice), re-sorted and redrew every card. Promotion decoration also rebuilt its elements on every redraw.
- Now: background GPS updates are silent (ignore drift under ~60-150 m, redraw at most every 15 s after a real 150 m move, never scroll). The first GPS lock only guides you to the list if you are still near the top; if you are reading the list, distances update in place and the list re-sorts only when it is out of view. Promotion labels/spotlight/hero redraw only when something actually changed.
- Measured: while scrolled down with GPS drifting every 2 s, scroll position stayed fixed and layout shift was 0 on phone and desktop.

## Launch readiness pass
- Production build tested against REAL Postgres: all 12 migrations apply; admin login, promotions, feedback, tracking, add place and visitor view all pass; no page errors.
- Security: script-injection and SQL-injection test payloads are stored harmlessly and shown as plain text (public page and admin panels). Login cookies are HttpOnly + Secure + SameSite. Added security headers (nosniff, frame, referrer, permissions, HSTS) and login/sign-up throttling (generous, because a college can share one Wi-Fi address).
- Added Privacy Policy (/privacy.html) and Terms (/terms.html) with footer links and a consent line at sign-up; robots.txt; /api/health.
- Photos compressed (5.6 MB -> 1.3 MB); first phone load about 2.4 MB before gzip.
- Added LAUNCH_CHECKLIST.md and a clean .env.example. Five settings are REQUIRED on the host: DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, BETTER_AUTH_URL, BETTER_AUTH_SECRET.
- The private .env file is no longer included in the zip.

## Admin login on your own computer
- The zip includes a private `.env` with the admin email and password (needed locally so your email becomes the admin). Do not upload it. If login says "No account matched", make sure `.env` is in the same folder as `package.json`, then stop and restart `npm run dev`.

## Exact live location for distances (range only for Verify Visit)
- Distances, fares and nearest-first now use your EXACT GPS point: the site waits for a precise fix (about 25 m), follows movements of 10 m or more, and re-measures as GPS sharpens. A city-level network guess is never used (if GPS is blocked it asks you to allow location or pick your area).
- Cards show exact distance: metres under 1 km (for example "350 m"), then km. The old 0.4 km minimum is gone from the display (fares still have their own minimum prices).
- Fixed a bug where a slow server answer calculated from your OLD position could overwrite the new, correct distance (numbers jumped 2.8 -> 5.7 -> 3.6 -> 2.8 km). Only the newest answer is used now.
- Distances refresh in place without re-sorting or moving the page; the list re-sorts only when out of view.
- Verify Visit still uses the allowed range (250 m / 800 m / 2.5 km + GPS error), as requested.

## Opening cards (admin-controlled popup)
- Admin Dashboard > "🎬 Opening cards": add any place, label it Sponsored (paid) or Highlight (your pick), add an optional short line (e.g. "Free chai with any snack"), optional start/auto-remove dates, reorder with arrows, pause/resume, remove, and "Preview the popup".
- Visitors see these places in a popup when they open the site (once per visit, up to 6, sideways swipe on phones). Tapping a card opens that place's details and directions. "Skip" closes it.
- No cards added = no popup at all; the site loads normally. Expired cards disappear automatically (India date).
- Views are counted for each card (same counters used in promotion reports).
- If the opening cards show, the Saturday/Sunday card steps aside for that visit so two popups never stack.
- New table: welcome_cards (migrations/0013_welcome_cards.sql). All admin endpoints are admin-only.

## v18: final quality pass
- Bug fixed: copying links/invites/reports crashed when a browser denied clipboard permission (in-app browsers, some Safari cases). One safe copy helper now falls back to old-style copy and never throws.
- Verify Visit now reuses the fresh live GPS reading the app already has (instant, and no second GPS request).
- New: "🎲 Surprise me" button picks a random cheap, rated spot near you. Confetti on a verified visit. Cards fade up as you scroll (opacity/transform only, no layout shift). Native share sheet for "Share / Copy Link" on phones. Press feedback on buttons.
- Accessibility: skip-to-content link, visible keyboard focus ring, all motion switched off for visitors who ask their device for reduced motion.
- Tested: click-everything test as visitor (desktop + phone) and student (desktop) with zero crashes; all 9 admin tabs load; production build on real Postgres (13 migrations) passes admin login, promotions, feedback, tracking, add place and the visitor view with zero page errors.
- Project tidy-up: old notes moved to docs/history, new README.md, this file is docs/CHANGELOG.md.
