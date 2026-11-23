# Student Explorer: launch checklist

## 1. Settings (all five must be set on your host)
| Name | What to put |
|---|---|
| `DATABASE_URL` | Connection string of a permanent Postgres (Neon or Supabase free plan works). |
| `ADMIN_EMAIL` | Your admin email. |
| `ADMIN_PASSWORD` | A long, unique password (change the one used while testing). |
| `BETTER_AUTH_URL` | The exact site address, e.g. `https://studentexplorer.in` (https, no trailing slash). |
| `BETTER_AUTH_SECRET` | Random text, 32+ characters. |

The `.env` file in this folder holds your admin login for running the site **on your own computer** (it makes your email the admin). Do **not** upload `.env` anywhere or send the folder to others. On a host, set these names in the host's dashboard instead. If you ever need to share the project, delete `.env` first.

## 2. Deploy
1. `npm install`
2. `npm run build` (it also applies the database tables when `DATABASE_URL` is set)
3. Publish the build with your host (Vercel: import the project, add the settings, deploy).

## 3. Right after launch (5 minutes)
- Open `https://YOUR-SITE/api/health`. It must say `"database":"postgres"` and `"adminConfigured":true`.
- Log in with your admin email. Open Admin Dashboard and check each tab loads.
- Sign up as a normal student with another email and add a test place; confirm it appears when you are logged out.
- Send test feedback; confirm it shows in Admin > Feedback and nowhere else.
- Create a test promotion; confirm a "Sponsored" label shows, then delete it.
- Open the site on a real phone: allow location, scroll, tap a card, tap Directions.
- Share the link on WhatsApp and check the preview card.

## 4. Things to know
- Prices, fares and budgets are estimates (the site says so). Re-check the Metro and auto fare rules every few months.
- Photos people upload are stored in the database. If you get many, move them to file storage later.
- Back up the database regularly (Neon and Supabase have backups).
- Privacy Policy and Terms pages are at `/privacy.html` and `/terms.html`. They are plain-language templates, not legal advice. Consider having a lawyer or CA read them, especially before taking money from shops (GST may apply).
