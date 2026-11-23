# v16 — shaking cards / dead buttons, and per-account search history

## 1. Cards shook and Verify visit / Directions did nothing
Cards lifted 7px on hover. With the pointer near the bottom (where the buttons are) the card moved away from the pointer,
hover flipped on/off endlessly (shaking) and clicks were lost. Fix: cards no longer move on hover (shadow/border only) —
bottom of `public/explorer/ui-v14.css`. Verified in a browser: card position unchanged on hover, button click registers.

## 2. Search history leaked between accounts
Recent searches were saved in ONE browser key shared by every account. Now stored per account
(`se_recent_searches_v2::<account>`); the old shared key is deleted. Same for favourites, saved-plan drafts and local plans.
Logging out or switching account also clears the search box, results, suggestions and cached outings.
Plans made while logged out are moved into the next account that logs in (then removed from the guest slot).
Changes: `public/explorer/app.js` (accountScope/scopedKey, setSession, resetViewForNewAccount).

## v16b — results stuck after clearing the TOP search bar
The top-bar search box did not react to being emptied (only to Enter), so the 2 filtered places stayed. Emptying either
search box now restores all places immediately and clears the other box too (`attachSuggest` in app.js).
CSS/JS links now carry `?v=16` so browsers load the new files instead of a cached old copy (src/routes/__root.tsx, index.tsx).

## v16c — phone + tablet + PC
Layout already adapted; added: no sideways scroll down to 320px wide (cards used a 300px minimum), 44px tap targets on
touch/small screens, 16px inputs (stops iPhone zoom on tap), notch-safe edges, two-column card buttons on phones,
popups that scroll inside small screens, wider max width on very large monitors. All in bottom of ui-v14.css.
Checked at 320 / 375 / 768 / 1366px wide: no horizontal overflow.

## v16d — ROOT CAUSE of "buttons dead + shaking after a search"
1. While a search was active, the code re-ordered cards by re-appending them, and a second watcher saw those moved cards
   as "new places" and re-ran the search 150ms later -> endless loop (~6 DOM rewrites/second). Cards were removed and
   re-added under the pointer: hover flickered (shaking) and clicks were cancelled (random buttons did nothing).
   Fix (app.js): watcher only reacts to cards it has never seen; `orderCards()` moves cards only if the order truly changes.
   Measured: 242 DOM changes in 4s idle -> 0.
2. Buttons/tiles lifted on :hover (translateY) -> they could slip out from under the pointer. Hover lift removed (ui-v14.css).
3. My v16c phone CSS accidentally removed the desktop sidebar spacing (`body{padding-left}`), sliding the page under the
   sidebar. Restored; phone notch padding now applies only below 1024px.
Tested with real mouse presses on the lowest pixel row of each button (PC 1280, laptop 1024) and touch taps (768, 375):
Directions, Reviews & Info, Verify visit, Log Expenses, Heart, Share all respond. CSS/JS URLs now `?v=19` to bypass caches.
