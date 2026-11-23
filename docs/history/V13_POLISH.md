# v13 polish pass — bugs found and fixed

Checked the v13 you sent (first-20-seconds work) in a real browser (desktop + phone size) and re-ran all unit tests
(search 14, rules 10, places/geocode 37).

## Regressions fixed (v13 had been built from a copy made before my last two hotfixes)
1. **App started twice -> Profile menu would not open, Log out did nothing.** `src/routes/index.tsx` now marks the engine
   loader at once, and `app.js` refuses to boot twice.
2. **A normal user could see the admin's profile.** Login tokens are kept only per tab (`sessionStorage`); the old shared
   `localStorage` token is deleted; every login wipes old tokens first and checks the returned email matches; logout always
   clears the device.

## New polish
3. **Two bottom banners overlapped** ("Find places near you" over the sign-up nudge). Only one shows at a time, and the
   location prompt now appears after about 6 seconds (not 0.9) and never on top of a dialog, so a new visitor sees the
   search box and Instant Picks first.
4. **Shared plan links now really carry the plan.** The WhatsApp message link is `/?plan=id1,id2&people=4&cap=300`;
   opening it pre-selects the same stops, friends count and budget cap, scrolls to the planner and cleans the URL.
5. Hero search placeholder shortened so it is not cut off on phones.

## Checked and fine
Instant Picks (4 cards, budget chips, "Plan a 2-3 stop outing"), search (typo, area, similar description, new places),
report-a-problem form, budget cap card, local trip saving, weekend dialog (Sat/Sun only), squad join link, login/logout.

## Not tested here
The real server with a database (my sandbox has no `node_modules`/network). Please run `npm install && npm run dev`
and try: admin login (admin@studentexplorer.local / admin123 locally), a user login, a verified visit, a report with a
photo, a squad invite and a shared plan link.
