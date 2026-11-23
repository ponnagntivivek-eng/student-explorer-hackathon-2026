# v14 — UI makeover (visual only; no feature code changed)
- New `public/explorer/ui-v14.css`, loaded after `style.css` in `src/routes/__root.tsx`. Delete that one link to undo everything.
- One consistent indigo→blue palette (matches your dashboard mockup) with an amber action colour; logo colours untouched.
- Calmer light hero, no empty white box for Featured picks, friendlier cards, 5 category cards in one row, gradient budget band,
  light sign-up / location prompts, better dark mode and mobile layout.
- New "How it works" 3-step strip in `src/explorer/body.html` (Pick budget → Plan with squad → Go & share).

## Share fix
- "Share plan + invite friends" now sends ONE link: it invites friends to your squad (when you are logged in) and opens the same stops, people count and budget cap in their planner. After they join, the page scrolls to the planner.
- "Invite squad + XP" uses the same link. If you are not logged in, sharing still works with a plan-only link and a tip to log in.

## 42 new places with full street addresses (from "Student Guide - Best Places Near MSRIT")
- New `src/lib/explorer/msrit-places.ts` (the data) + `ensureCuratedPlaces()` in `api.server.ts`. On the first load of `/api/places` they are added as PUBLISHED places for everyone.
- Runs only once (flag row `msrit_student_guide_v1` in `explorer_seed_flags`), so places an admin deletes or edits never come back.
- Skipped 4 the site already has: Cubbon Park, Lalbagh, Bangalore Palace, Church Street.
- Pins are neighbourhood-level; Directions search by shop name + exact address. Ratings start at 4.5 (app default) and photos are empty until added/auto-filled. Admin can fix both.
