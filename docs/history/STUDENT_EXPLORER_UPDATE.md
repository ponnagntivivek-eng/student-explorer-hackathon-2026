# Student Explorer — reliability and feature update

## Critical fixes (v3 — publish + trip profile)
- **Admin recommendation publish bug fixed:** typing a full address → Find on map → Publish now works even when the separate “Area” field was left blank. Area is auto-derived from the geocode / address. Publish button shows a clear “Publishing…” state and surfaces server errors.
- Geocode query length increased; Bengaluru metro bounds slightly widened so edge neighbourhoods still pin and publish.
- **Trip plans save to profile:** “Save this plan” writes to the signed-in user’s profile (via `/api/trips` as `squad_plan`) as well as localStorage. Saved plans appear in the Profile menu and can be one-click loaded back into the planner.
- UI polish on the admin hotel/recommendation form (map preview, candidates, GPS button, submit CTA) and profile saved-plans list.

## Critical fixes
- Place pinning now searches using **place name + entered address/area**, not just the neighbourhood.
- Editing the place name or address invalidates the previous coordinates and auto-fill match. This prevents stale pins from being published for a different place.
- A pin is marked exact only after a named-venue match or a fresh GPS fix. Area-centre pins remain area-level so Google Maps can resolve the venue by name instead of routing to a neighbourhood centroid.
- Server-side publishing now tries to resolve the named place before falling back to the area centre.
- `/admin` and `/places/new` now route into the canonical Student Explorer app instead of the legacy React screens that read/write a separate `places` table.
- Opening the admin dashboard loads the places and report queues immediately. Multiple `ADMIN_EMAIL` values are now supported, and `ADMIN_PASSWORD` can be configured via the environment.

## Requested features
- **Trip plans:** added a 2–3 stop squad planner with per-person and group budget totals, local save, profile save, and WhatsApp sharing.
- **Open now:** added a filter that only includes places with simple, explicit OpenStreetMap opening-hour rules. Complex or missing hours are treated as unknown, not as open.
- **Best tonight:** surfaced the existing night-friendly collection as “Best tonight”.
- **Saved lists and WhatsApp:** the place detail “Save to My Squad List” button now actually toggles the saved favourites list; added direct WhatsApp sharing and a place-specific copied share text.
- **Weekly student picks:** added a last-7-days ranking from student reviews and outing logs, with an area filter. If there is no recent activity, featured/recently-added places are used as a fallback.
- **Duplicate/merge:** added an admin merge action. It moves photos, reviews, and report references to the selected target place before removing the source.
- **Wrong pin/photo reports:** students can submit reports from a place detail page; admins can review, resolve, or dismiss them.

## Deferred as requested
- Events / college fests.
- Other cities until Bengaluru coverage and accuracy are strong.

## Database
A new migration, `migrations/0005_community_quality.sql`, creates the place-report queue. The app's existing migration runner applies it on startup/build. Squad trip plans reuse the existing `explorer_trips` table with `type: "squad_plan"` in the JSON payload.

## Run
```bash
npm install
npm run dev
```
Open `http://localhost:8080`.

For production, set `ADMIN_EMAIL` to one or more comma-separated admin emails and set a strong `ADMIN_PASSWORD` in the hosting provider's environment variables. Do not use the local default password in production.
