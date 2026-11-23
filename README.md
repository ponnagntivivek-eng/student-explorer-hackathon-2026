# Student Explorer

A website for Bengaluru college students: find cheap places near you, see real transport costs, get directions,
plan outings with friends, and (for shop owners) get promoted. Works on phones, tablets and computers, in light and dark mode.

## Run it on your computer (Windows PowerShell)

```powershell
npm.cmd install
npm.cmd run dev -- --host 0.0.0.0 --port 8080
```

Open http://localhost:8080. Your admin login comes from the private `.env` file in this folder
(`ADMIN_EMAIL` and `ADMIN_PASSWORD`). If login says "No account matched", check that `.env` sits next to `package.json`
and restart the site.

## Launch it for everyone

Read **`LAUNCH_CHECKLIST.md`**. You need five settings on your host: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` (see `.env.example`). Never upload `.env`.

## What the admin can do (Admin Dashboard)

| Tab | Use it to |
|---|---|
| Users, Analytics, Rankings | see students, activity and the XP leaderboard |
| Places, Recommend | edit places and photos, feature a place (with an end date) |
| Comments | publish or remove comments |
| 📣 Promotions | promote a shop (Featured / Monthly / Premium), offer text, dates, private payment notes, view and click counts, copy a report for the shop |
| 🎬 Opening cards | choose the places that pop up when visitors open the site (Sponsored or Highlight); none = no popup |
| 💬 Feedback | read feedback and photos students send (admin only) |

## How it is built

- **Front end:** hand-written HTML, CSS and JavaScript in `public/explorer/` and `src/explorer/body.html`, served by React and TanStack Start.
- **Server:** TypeScript API in `src/lib/explorer/`, run by Nitro (builds for Vercel-style hosting).
- **Database:** PostgreSQL (`migrations/`, applied automatically on build). Local development uses an embedded copy.
- **Login:** Better Auth (email and password).
- **Maps and data:** Google Maps links for directions; free OpenStreetMap routing and search; Wikimedia photos.

## Checks

```powershell
npm.cmd test            # app tests plus platform template tests (the template ones may fail; they do not test the app)
npx tsc --noEmit        # type check
npm.cmd run build       # production build
```

More: `docs/CHANGELOG.md` (everything added in v17) and `docs/history/` (notes from earlier versions).
