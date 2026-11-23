# v15 — Save / Invite fixes, admin check, visibility (contrast) pass

## Why "Save this plan" and "Invite squad + XP" looked dead
1. The toast message that confirms every action had NO visible style (`.toast-notification.show` was missing in style.css), so the
   buttons worked but nothing appeared. Fixed in `public/explorer/style.css`.
2. Added an inline status line under the planner buttons (`#tripPlanStatus`) so feedback is shown right where you click.
3. WhatsApp share/invite opened its tab only after a network wait, which browsers block as a pop-up. The tab is now opened
   instantly on click and filled in once the squad code is ready (falls back to the same tab if pop-ups are blocked).
4. Logged-out Invite now says "Log in to create a squad…" (toast + login window) instead of only opening the login window.

## Admin panel (checked in a real browser with a mock API)
Opens from the Admin button and from /admin → /?openAdmin=1; all 6 tabs (Users, Analytics, Places, Comments, Recommend, Rankings)
load with no JS errors; every /api/admin/* route the UI calls exists on the server. No code change needed.

## Visibility / colours
Measured WCAG contrast of every visible text in light and dark mode and fixed the failures (`ui-v14.css` bottom, `style.css`):
- muted grey text darkened (#64748B → #566175), brand gradient end darkened so white button text passes 4.5:1
- "How it works" numbers were grey on indigo; budget band text, footer, XP panel, stars, icon buttons, "Not now" etc. fixed
- Dark mode: white "outline" buttons with white text, side promo card, expense history tiles and many muted labels repaired
To undo: remove the "v15" blocks at the bottom of `ui-v14.css`.

## v15b — overlapping badges
The orange/teal search-match note (e.g. Similar match · to “laptop”) was absolutely positioned on top of the Student Shared badge and the distance tag. It now sits in the same top-left tag stack, so badge, distance and match note never overlap (app.js annotateMatch + ui-v14.css).
