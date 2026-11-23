# Student Explorer: run in VS Code

1. Open this folder in VS Code (File > Open Folder).
2. Open a terminal (Ctrl + `) and run:

```
npm.cmd install
npm.cmd run dev
```

(On Mac/Linux use `npm` instead of `npm.cmd`.)

3. Open http://localhost:8080

No database setup is needed for local experimentation. The embedded PGLite database creates all tables automatically on first start, including the V10 achievement and XP tables in `migrations/0006_gamification.sql`. PGLite is an in-memory development fallback; configure `DATABASE_URL` with PostgreSQL/Neon for persistent production data.

## Pages
| URL | What it is |
|---|---|
| `/` | Original Student Explorer app (fares, trips, reviews, admin tools) |
| `/places` | Places list (approved places) |
| `/places/new` | Add a place (photo optional, GPS or typed address) |
| `/places/<id>` | Place detail, photos and comments |
| `/budget` | Squad budget calculator |
| `/outings/new` | Log an outing |
| `/admin` | Approve/reject/feature/edit/delete places; edit/delete comments |
| `/login` | Sign up / sign in |

## Admin
For local development only, sign in with `admin@studentexplorer.local` / `admin123` (created automatically). Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in your `.env` before deployment. Production intentionally does not seed the default admin password; configure the variables and create/sign in with the matching admin email. Never deploy the local default credentials.
New places from normal users are "pending" until an admin approves them.

## Free automatic place detection (no API key)

Student Explorer finds place information, the category and a photo using only free services:

| Service | Used for |
|---|---|
| Photon + OpenStreetMap Nominatim | parallel place-name/address search, coordinates and autocomplete/geocoding fallback |
| Overpass API | reading OpenStreetMap tags and nearby destinations |
| Wikidata | conservative landmark/entity matching, descriptions, coordinates and Wikipedia links |
| Wikipedia API | verified article descriptions and lead images |
| Wikimedia Commons API | place-checked free-licence photos, author, licence and upload metadata |
| OSRM (router.project-osrm.org) | existing driving-distance estimates |
| Valhalla (valhalla1.openstreetmap.de) | driving, walking and cycling route distance, duration and turn instructions |

**How to try it (as an admin):**
1. Run `npm run dev` and open http://localhost:8080/login, sign in as `admin@studentexplorer.local` / `admin123`.
2. Open `/places/new` (or the **Admin** page → "+ Add a place") and type `Cubbon Park`.
3. Click **✨ Auto-fill**. The category, address, description and photo choices appear. Check them, change anything you like, then **Save place**.
4. Try a place with no photo (e.g. type a made-up name): the app shows a coloured category picture instead of a wrong photo.
5. In **Admin → Places** use **Find photo**, **Choose photo** or **Upload photo** to replace a photo. A photo you uploaded is never overwritten automatically.

The same **✨ Auto-fill** button is in the "Add a place" window on the home page (`/`).

Photos from Wikimedia are linked, not copied, and always show the author and licence.
Category suggestions include a heuristic confidence score (not a guaranteed probability); low-confidence matches should be reviewed and can be manually changed. Photo lookups use a 7-day in-memory cache; place discovery and geocoding use shorter caches. **Refresh photos** on the Add Place form bypasses the cached photo search so you can request new candidates. Wikimedia upload dates are shown as upload dates (they are not claimed to be the date a photograph was taken). Requests to public services are rate limited and have timeouts; free public endpoints can occasionally be busy.

The place form keeps manual admin choices and uploaded photos; automatic lookup does not overwrite an image already selected. Only Commons photos with a supported free licence and a place-relevance check are suggested. If no verified photo is found, the app keeps its category illustration instead of claiming an unrelated stock image is the destination.

On a place detail page, enter a starting address (or use your location), choose Driving / Walking / Cycling, then select **Calculate route**. Valhalla returns the route distance, estimated duration and turn instructions. Route geometry is returned by the service; the page currently presents the route summary and instructions rather than drawing a custom MapLibre route overlay. Public demo services have usage limits and are not guaranteed uptime.

No Google Maps API key, Pixabay key or Pexels key is required for these implemented features. Pixabay/Pexels optional-provider integration and a dedicated MapLibre route overlay are not included in this delivery. The current app continues to use its existing OpenStreetMap map embed.

Optionally set `CONTACT_EMAIL` in `.env` (see `.env.example`) so public geocoding requests carry a contact detail. Restart `npm run dev` after saving `.env`.
