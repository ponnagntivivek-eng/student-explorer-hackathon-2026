import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { computeFares, haversineKm, metroLeg, roadKmFromStraight } from "./fares";
import { BENGALURU_GEO_INDEX, geocodeAddress, geocodeCandidates, suggestPlaces, type GeocodeCandidate, reverseGeocode, findPlacePhoto, roadRoute, routeDirections, ipLocate, classifyPlace } from "./geo.server";
import { discoverPlace, nearbyOsmPlaces, locatePlace, lookupPhotoByUrl, haversineKm as haversineM, trimTags, type PhotoCandidate } from "../places/discovery.server";
import { allowRequest, UpstreamError } from "../places/http.server";
import { googleEnabled, googleFindPlace, googlePhotoUrl, googlePhotoResponse, type GooglePlace } from "./google.server";
import { categoryLabel, isCategoryId, toExplorerBucket } from "../places/categories";
import { fuzzyScore, textScore } from "./fuzzy";
import { MSRIT_PLACES, curatedPayload } from "./msrit-places";
import { inCoverage, validNear } from "../places/region";
import { decideVisit, impossibleTravel, suggestPinFromVisits, pinQuality } from "./visit-rules";
import { visitAward, reviewAward, photoAward, popularityOf, sharedChallengeMet, SQUAD_COMPLETION_XP, SQUAD_DAY_CHALLENGE_XP, SQUAD_DAY_MIN_FRIENDS, SQUAD_DAY_MIN_PLACES, type Award } from "./xp-rules";

const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "admin@studentexplorer.local").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = ADMIN_EMAILS[0] || "admin@studentexplorer.local";
// Production never ships a default password: set ADMIN_PASSWORD, otherwise a random one-time password is printed ONCE to the
// server log. LOCAL DEVELOPMENT (no DATABASE_URL and NODE_ENV !== "production") uses the documented admin123 login so you
// can always get into /admin on your own machine. Placeholder values copied from .env.example are ignored.
const IS_PRODUCTION = process.env.NODE_ENV === "production" || Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
const ENV_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
const ADMIN_PASSWORD_IS_PLACEHOLDER = /^change-this|^your-|^password$/i.test(ENV_ADMIN_PASSWORD);
const ADMIN_PASSWORD_FROM_ENV = ENV_ADMIN_PASSWORD.length >= 8 && !ADMIN_PASSWORD_IS_PLACEHOLDER;
const DEV_ADMIN_PASSWORD = "admin123";
const ADMIN_PASSWORD = ADMIN_PASSWORD_FROM_ENV
  ? ENV_ADMIN_PASSWORD
  : IS_PRODUCTION
    ? randomBytes(12).toString("base64url")
    : DEV_ADMIN_PASSWORD;

type Row = Record<string, unknown>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const clean = (v: unknown, max = 300) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);
const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function asObj(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

async function sqlQuery<T = Row>(text: string, params: unknown[] = []) {
  const sql = await getSql();
  return sql.query<T>(text, params);
}


let curatedPromise: Promise<void> | null = null;

/**
 * Adds the curated MSRIT student-guide places ONCE (a flag row remembers it), so an admin who later deletes or edits
 * one of them never sees it come back on the next server start.
 */
async function ensureCuratedPlaces() {
  curatedPromise ??= (async () => {
    await sqlQuery(`create table if not exists explorer_seed_flags (key text primary key, done_at timestamptz not null default now())`);
    const flag = await sqlQuery(`select key from explorer_seed_flags where key = 'msrit_student_guide_v1'`);
    if (flag.length) return;
    for (const p of MSRIT_PLACES) {
      await sqlQuery(
        `insert into explorer_places (id, payload, added_by) values ($1, $2::jsonb, null) on conflict (id) do nothing`,
        [p.id, JSON.stringify(curatedPayload(p))],
      );
    }
    await sqlQuery(`insert into explorer_seed_flags (key) values ('msrit_student_guide_v1') on conflict (key) do nothing`);
  })().catch((err) => {
    curatedPromise = null;
    console.warn("[explorer] curated places seed failed", err);
  });
  await curatedPromise;
}

let seedPromise: Promise<void> | null = null;

/** Creates (or, in local dev, re-syncs) the admin account. Also called before every sign-in so the admin can log in on a fresh database. */
export async function ensureSeed() {
  seedPromise ??= (async () => {
    const existing = await sqlQuery<{ id: string }>(`select id from "user" where lower(email) = $1 limit 1`, [ADMIN_EMAIL]);
    let adminId: string | undefined = existing[0]?.id;
    if (!adminId && ADMIN_PASSWORD) {
      try {
        const created = await (auth.api.signUpEmail as unknown as (a: unknown) => Promise<{ user?: { id?: string } }>)({
          body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: "Site Admin" },
        });
        adminId = created?.user?.id ?? undefined;
        if (!ADMIN_PASSWORD_FROM_ENV && IS_PRODUCTION) console.warn(`[explorer] ADMIN_PASSWORD is not set. Created admin "${ADMIN_EMAIL}" with this one-time password (shown once, change it after login): ${ADMIN_PASSWORD}`);
      } catch (err) {
        console.warn("[explorer] admin seed skipped:", err);
        const again = await sqlQuery<{ id: string }>(`select id from "user" where lower(email) = $1 limit 1`, [ADMIN_EMAIL]);
        adminId = again[0]?.id;
      }
    }
    if (!adminId) return;
    if (!IS_PRODUCTION && existing[0]?.id) {
      // Local development: keep the admin password in sync with ADMIN_PASSWORD (or the documented admin123) so a
      // database created by an older build, where the password was random, never locks you out of /admin.
      try {
        const ctx = (await (auth as unknown as { $context: Promise<{ password: { hash: (p: string) => Promise<string> } }> }).$context);
        const hashed = await ctx.password.hash(ADMIN_PASSWORD);
        const upd = await sqlQuery<{ id: string }>(
          `update "account" set "password" = $2, "updatedAt" = now() where "userId" = $1 and "providerId" = 'credential' returning "id"`,
          [adminId, hashed],
        );
        if (!upd.length) {
          await sqlQuery(
            `insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
             values ($1, $2, 'credential', $2, $3, now(), now())`,
            ["acc_" + randomBytes(8).toString("hex"), adminId, hashed],
          );
        }
      } catch (err) {
        console.warn("[explorer] could not sync the local admin password:", err);
      }
    }
    await sqlQuery(
      `insert into explorer_profiles (user_id, college, is_admin, last_active_at)
       values ($1, $2, true, now())
       on conflict (user_id) do update set is_admin = true`,
      [adminId, "Student Explorer"],
    );
  })().catch((err) => {
    seedPromise = null;
    console.warn("[explorer] seed failed", err);
  });
  await seedPromise;
}

type SessionUser = { id: string; email: string; name: string; college: string; isAdmin: boolean };

async function readSession(request: Request): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;
  if (!user?.id) return null;
  await ensureSeed();
  const email = String(user.email || "").toLowerCase();
  const rows = await sqlQuery<{ college: string; is_admin: boolean }>(
    `select college, is_admin from explorer_profiles where user_id = $1`,
    [user.id],
  );
  const college = rows[0]?.college || "";
  const isAdmin = Boolean(rows[0]?.is_admin) || ADMIN_EMAILS.includes(email);
  await sqlQuery(
    `insert into explorer_profiles (user_id, college, is_admin, last_active_at)
     values ($1, $2, $3, now())
     on conflict (user_id) do update set last_active_at = now()`,
    [user.id, college, isAdmin],
  );
  return { id: user.id, email, name: user.name || email.split("@")[0] || "Member", college, isAdmin };
}

function publicUser(u: SessionUser) {
  return { email: u.email, name: u.name, college: u.college, isAdmin: u.isAdmin, id: u.id };
}

function estimatePlace(
  place: { lat: number; lng: number; minBudget?: number; maxBudget?: number; entryFee?: number },
  origin: { lat: number; lng: number; name?: string } | null,
  squad = 4,
  route: { km: number; mins: number } | null = null,
) {
  const o = origin && Number.isFinite(origin.lat) ? origin : { lat: 12.9716, lng: 77.5946, name: "Central Bengaluru (MG Road)" };
  const straight = haversineKm(o.lat, o.lng, place.lat, place.lng);
  const km = route?.km ?? roadKmFromStraight(straight);
  const quote = computeFares(km);
  const metroInfo = quote.outstation ? null : metroLeg(o, place);
  if (metroInfo) {
    quote.metro = metroInfo.fare;
    quote.metroNote = metroInfo.note;
  } else if (!quote.outstation) {
    quote.metro = null;
    quote.metroNote = "No metro link between these two points";
  }
  const mins = (kmh: number, extra = 0) => {
    const m = Math.round(route ? route.mins * (22 / kmh) + extra : (km / kmh) * 60 + extra);
    return m >= 60 ? `~${Math.floor(m / 60)}h ${m % 60}m` : `~${m} mins`;
  };
  const ways = quote.outstation
    ? [
        { mode: "KSRTC bus", icon: "🚌", fare: quote.bus || 0, time: mins(35, 20), note: "From your start, one way" },
        { mode: "Bike fuel (Rapido-style)", icon: "🏍️", fare: quote.rapido || 0, time: mins(45), note: quote.rapidoNote },
        { mode: "Shared cab", icon: "🚗", fare: Math.round((quote.auto || 0) / Math.max(1, squad)), time: mins(50), note: `Per person, ${squad} sharing` },
      ]
    : [
        { mode: "Rapido bike taxi", icon: "🏍️", fare: quote.rapido || 0, time: mins(24, 4), note: "Solo, one way from your location" },
        ...(quote.metro != null ? [{ mode: "Namma Metro", icon: "🚇", fare: quote.metro, time: mins(28, 8), note: quote.metroNote }] : []),
        { mode: "BMTC bus", icon: "🚌", fare: quote.bus || 0, time: mins(18, 10), note: "Ordinary bus, one way from your start" },
        { mode: "Auto", icon: "🛺", fare: quote.autoShare, time: mins(20, 4), note: "Per person if 3 share" },
      ];
  ways.sort((a, b) => a.fare - b.fare);
  const cheapest = ways[0]?.fare || 0;
  const dearest = ways[ways.length - 1]?.fare || cheapest;
  const spendLow = Math.max(0, num(place.minBudget));
  const spendHigh = Math.max(spendLow, num(place.maxBudget, spendLow));
  const entry = Math.max(0, num(place.entryFee));
  const round5 = (n: number) => Math.round(n / 5) * 5;
  return {
    origin: o.name || "Your location",
    distanceKm: km,
    ways,
    charges: { entry, onSiteLow: spendLow, onSiteHigh: spendHigh, travelLow: cheapest * 2, travelHigh: dearest * 2 },
    prediction: {
      lean: round5(cheapest * 2 + spendLow + entry),
      typical: round5(((cheapest + dearest) / 2) * 2 + (spendLow + spendHigh) / 2 + entry),
      comfy: round5(dearest * 2 + spendHigh + entry),
      squadSize: squad,
      note: `Per person from ${o.name || "your location"}. Round trip + entry + on-site spend. Rapido, metro and bus change if you start somewhere else.`,
    },
  };
}

type Place = { id: string; [key: string]: any };

/** Today's date in India (YYYY-MM-DD). Promotions and "featured until" dates are compared in IST so they end at India midnight. */
const istToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const cleanDateStr = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
/** A place featured "until" a date stops being featured automatically after that date (visitors only; admins still see the raw flag). */
const expireFeatured = <T extends Record<string, unknown>>(p: T): T => {
  const until = typeof p.featuredUntil === "string" ? p.featuredUntil : "";
  if (until && until < istToday()) return { ...p, recommendedByAdmin: false, showInHero: false };
  return p;
};

async function loadPlaces(): Promise<Place[]> {
  const rows = await sqlQuery<{ id: string; payload: unknown }>(
    `select id, payload from explorer_places order by created_at desc`,
  );
  return rows.map((r) => ({ id: r.id, ...asObj(r.payload) }));
}

/** Moderation state lives in the place payload. Places saved before moderation existed count as published. */
const placeStatus = (p: Place): string => String(p.status || "published");

/** Who may see a place: everyone for published ones; pending/draft/rejected only for admins and the person who added it. */
function canSee(p: Place, viewer: { email: string; isAdmin: boolean } | null): boolean {
  if (placeStatus(p) === "published") return true;
  return Boolean(viewer && (viewer.isAdmin || (p.addedByEmail && p.addedByEmail === viewer.email)));
}

/** What everyone may see: no photo submissions, no contact details of the person who added it. */
function publicPlace(p: Place, viewer: { email: string; isAdmin: boolean } | null = null): Place {
  const { photoSubmissions: _hidden, addedByEmail, ...rest } = p as Place & { photoSubmissions?: unknown; addedByEmail?: string };
  return { ...rest, addedByMe: Boolean(viewer && addedByEmail && addedByEmail === viewer.email) } as Place;
}

function validImage(value: unknown) {
  return typeof value === "string" && (value.startsWith("data:image/") || value.startsWith("https://") || value.startsWith("/src/assets/") || value.startsWith("/")) && value.length < 3_500_000
    ? value
    : "";
}

type PhotoCredit = { origin: "upload" | "preset" | "wikipedia" | "commons" | "google"; sourceUrl?: string; author?: string; license?: string; licenseUrl?: string };

const creditFrom = (c: PhotoCandidate): PhotoCredit => ({
  origin: c.source,
  sourceUrl: c.sourcePageUrl,
  author: c.author,
  license: c.license,
  licenseUrl: c.licenseUrl,
});

/**
 * Picks the image for a new place.
 *  1. a photo the person uploaded / chose is ALWAYS kept as-is (never replaced automatically)
 *  2. an automatically found photo is only accepted if THIS SERVER found it (so its licence info is real)
 *  3. otherwise we search for a verified photo; if none, no image (the page shows a category fallback)
 */
const sleepNull = <T,>(ms: number) => new Promise<T | null>((r) => setTimeout(() => r(null), ms));

/** Exact spot for "name, area": Google Maps when a key is configured, otherwise the free OSM search. */
async function locateBest(name: string, area: string) {
  const g = await googleFindPlace(name, area);
  if (g) return { lat: g.lat, lng: g.lng, formattedAddress: g.address, name: g.name, provider: "google_maps", precision: "exact" as const, google: g as GooglePlace | null };
  const l = await locatePlace(name, area).catch(() => null);
  return l ? { ...l, google: null as GooglePlace | null } : null;
}

const googleCandidate = (g: GooglePlace, index: number): PhotoCandidate => ({
  url: googlePhotoUrl(g.placeId, index),
  source: "google",
  sourcePageUrl: `https://www.google.com/maps/place/?q=place_id:${g.placeId}`,
  title: g.name,
  author: g.attribution || "Google Maps",
  license: "Google Maps",
  licenseUrl: "https://www.google.com/help/terms_maps/",
  relevance: 0.95,
  reason: "Photo from Google Maps",
});

async function resolveImage(name: string, area: string, lat: number, lng: number, uploaded: unknown, search = true): Promise<{ image: string; credit: PhotoCredit | null }> {
  const own = validImage(uploaded);
  if (own && own.startsWith("/api/maps/gphoto")) return { image: own, credit: { origin: "google", author: "Google Maps", license: "Google Maps", licenseUrl: "https://www.google.com/help/terms_maps/" } };
  if (own && !own.startsWith("https://")) return { image: own, credit: { origin: own.startsWith("data:") ? "upload" : "preset" } };
  if (own) {
    const known = lookupPhotoByUrl(own);
    if (known) return { image: known.url, credit: creditFrom(known) };
    // An https link we did not find ourselves: ignore it and search properly.
  }
  if (!search) return { image: "", credit: null };
  const found = await findPlacePhoto(name, area, lat, lng).catch(() => null);
  return found ? { image: found.image, credit: creditFrom(found.credit) } : { image: "", credit: null };
}


type EnrichInput = { name: string; area: string; lat: number; lng: number; precision: "exact" | "area"; hadImage: boolean; userPickedCategory: boolean };

/** Fills in the slow details of a freshly published place without making the person wait. Never overwrites an admin's edits. */
async function enrichPlaceInBackground(id: string, input: EnrichInput) {
  try {
    const found: Record<string, unknown> = {};
    if (input.precision === "area") {
      const hit = await locatePlace(input.name, input.area).catch(() => null);
      if (hit && hit.precision === "exact") Object.assign(found, { lat: Math.round(hit.lat * 1e5) / 1e5, lng: Math.round(hit.lng * 1e5) / 1e5, locationPrecision: "exact" });
    }
    const lat = typeof found.lat === "number" ? found.lat : input.lat;
    const lng = typeof found.lng === "number" ? found.lng : input.lng;
    let photo: { image: string; credit: PhotoCredit } | null = null;
    if (!input.hadImage) {
      const f = await findPlacePhoto(input.name, input.area, lat, lng).catch(() => null);
      if (f) photo = { image: f.image, credit: creditFrom(f.credit) };
    }
    const cls = await classifyPlace({ name: input.name, area: input.area, lat, lng }).catch(() => null);
    const rows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_places where id = $1`, [id]);
    if (!rows[0]) return;
    const p = asObj(rows[0].payload);
    if (found.lat != null && p.locationPrecision === "area") Object.assign(p, found);
    if (photo && !p.image) {
      p.image = photo.image;
      p.photos = [photo.image];
      p.photoCredit = photo.credit;
    }
    if (cls) {
      p.vibes = cls.vibes;
      p.timeOfDay = cls.timeOfDay;
      p.placeTypes = cls.types;
      p.classifySource = cls.source;
      p.classifyConfidence = cls.confidence;
    }
    await sqlQuery(`update explorer_places set payload = $2::jsonb where id = $1`, [id, JSON.stringify({ ...p, id })]);
  } catch (e) {
    console.warn("[explorer] background enrichment skipped:", e instanceof Error ? e.message : e);
  }
}

/** Same person can't add the same place twice (same name within ~200 m). */
async function findDuplicate(name: string, lat: number, lng: number, osmKey?: string): Promise<{ name: string } | null> {
  // Reads only the few fields needed (not the photos), so this stays fast however many places exist.
  const rows = await sqlQuery<{ name: string | null; lat: string | null; lng: string | null; osm: string | null }>(
    `select payload->>'name' as name, payload->>'lat' as lat, payload->>'lng' as lng, payload->>'osmKey' as osm
       from explorer_places where lower(payload->>'name') = $1 ${osmKey ? "or payload->>'osmKey' = $2" : ""}`,
    osmKey ? [name.trim().toLowerCase(), osmKey] : [name.trim().toLowerCase()],
  );
  for (const r of rows) {
    if (osmKey && r.osm === osmKey) return { name: r.name || name };
    const plat = Number(r.lat);
    const plng = Number(r.lng);
    if (!Number.isFinite(plat) || !Number.isFinite(plng) || haversineM(lat, lng, plat, plng) < 0.2) return { name: r.name || name };
  }
  return null;
}

function osmKeyOf(b: Record<string, unknown>) {
  const t = clean(b.osmType, 10);
  const id = Math.round(num(b.osmId, 0));
  return ["node", "way", "relation"].includes(t) && id > 0 ? `${t}/${id}` : undefined;
}

/** OpenStreetMap link + tags saved with the place (sanitised). */
function osmFromBody(b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const key = osmKeyOf(b);
  if (key) {
    out.osmKey = key;
    out.osmUrl = `https://www.openstreetmap.org/${key}`;
  }
  const tags = asObj(b.osmTags);
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(tags)) if (typeof v === "string") flat[clean(k, 60)] = clean(v, 200);
  if (Object.keys(flat).length) out.osmTags = trimTags(flat);
  const detailed = clean(b.detailedCategory, 40);
  if (isCategoryId(detailed)) {
    out.detailedCategory = detailed;
    out.detailedCategoryLabel = categoryLabel(detailed);
  }
  const src = asObj(b.descriptionSource);
  if (typeof src.url === "string" && src.url.startsWith("https://")) out.descriptionSource = { label: clean(src.label, 80), url: clean(src.url, 300) };
  return out;
}

function clientKey(request: Request) {
  return (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim() || "local";
}

const optNum = (v: unknown) => (v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const candidateOut = (c: GeocodeCandidate) => ({ lat: c.lat, lng: c.lng, formattedAddress: c.formattedAddress, name: c.name, provider: c.provider, score: c.score, precision: c.precision || "area" });
/** True when the top two matches are different places (>300 m apart) with similar confidence. */
const isAmbiguous = (c: GeocodeCandidate[]) => c.length >= 2 && c[0].score - c[1].score <= 12 && haversineKm(c[0].lat, c[0].lng, c[1].lat, c[1].lng) > 0.3;
const validCoords = (lat?: number, lng?: number) => lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const SAMPLE_COMMENTS: { placeId: string; placeName: string; rating: number; costSpent: number; highlight: string; comment: string }[] = [
  { placeId: "lalbagh", placeName: "Lalbagh Botanical Garden", rating: 4.8, costSpent: 30, highlight: "Free walk before 9 AM", comment: "Sample note: go before 9 for the free morning walk. West Gate is a short walk from Lalbagh metro. Carry a college ID only if you want the paid ticket discount later." },
  { placeId: "cubbon", placeName: "Cubbon Park", rating: 4.9, costSpent: 0, highlight: "Zero entry", comment: "Sample note: entry is free. Cubbon Park metro drops you at the edge. Budget only for chai, not a ticket." },
  { placeId: "vvpuram", placeName: "VV Puram Food Street", rating: 4.7, costSpent: 180, highlight: "Share plates", comment: "Sample note: a squad of four can taste dosa, bun and chaat and stay near ₹180 each if you share. National College metro is the easy stop." },
  { placeId: "palace", placeName: "Bengaluru Palace", rating: 4.4, costSpent: 250, highlight: "Ask for student ticket", comment: "Sample note: ticket is the main cost. Ask at the counter about a student concession and skip the paid camera fee by using a phone." },
  { placeId: "churchstreet", placeName: "Church Street Book & Cafe Lane", rating: 4.8, costSpent: 150, highlight: "Metro to MG Road", comment: "Sample note: Purple Line to MG Road, then a two-minute walk. Book browsing can be almost free; coffee is the real spend." },
  { placeId: "nandihills", placeName: "Nandi Hills Sunrise Viewpoint", rating: 4.5, costSpent: 400, highlight: "Not a metro ride", comment: "Sample note: this is an outstation morning. Metro will not get you there. Budget for KSRTC or a shared cab, and start before dawn on weekends." },
];


const BUILTIN_DESTINATIONS: Record<string, { id: string; name: string; lat: number; lng: number; city: string }> = {
  lalbagh: { id: "lalbagh", name: "Lalbagh Botanical Garden", lat: 12.9507, lng: 77.5848, city: "Bengaluru" },
  cubbon: { id: "cubbon", name: "Cubbon Park", lat: 12.9763, lng: 77.5929, city: "Bengaluru" },
  vvpuram: { id: "vvpuram", name: "VV Puram Food Street", lat: 12.9515, lng: 77.5768, city: "Bengaluru" },
  palace: { id: "palace", name: "Bengaluru Palace", lat: 12.9988, lng: 77.5921, city: "Bengaluru" },
  churchstreet: { id: "churchstreet", name: "Church Street Book & Cafe Lane", lat: 12.9750, lng: 77.6066, city: "Bengaluru" },
  nandihills: { id: "nandihills", name: "Nandi Hills Sunrise Viewpoint", lat: 13.3702, lng: 77.6835, city: "Chikkaballapur" },
};

const ACHIEVEMENTS = [
  { id: "first-explorer", name: "First Explorer", description: "Complete your first verified destination visit.", rarity: "Bronze", target: 1, metric: "visits", xp: 50, icon: "🧭" },
  { id: "adventure-seeker", name: "Adventure Seeker", description: "Visit 10 verified destinations.", rarity: "Silver", target: 10, metric: "visits", xp: 100, icon: "🥾" },
  { id: "budget-master", name: "Budget Master", description: "Complete 5 trips within your saved budget.", rarity: "Gold", target: 5, metric: "budgetTrips", xp: 150, icon: "💰" },
  { id: "hidden-gem-hunter", name: "Hidden Gem Hunter", description: "Visit 5 destinations marked as hidden gems.", rarity: "Diamond", target: 5, metric: "hiddenVisits", xp: 200, icon: "💎" },
  { id: "photo-master", name: "Photo Master", description: "Submit 10 approved destination photographs.", rarity: "Gold", target: 10, metric: "photos", xp: 150, icon: "📸" },
  { id: "community-hero", name: "Community Hero", description: "Publish 10 useful student reviews.", rarity: "Gold", target: 10, metric: "reviews", xp: 150, icon: "🤝" },
  { id: "squad-leader", name: "Squad Leader", description: "Complete 5 group trips with verified visits.", rarity: "Gold", target: 5, metric: "groupTrips", xp: 150, icon: "👥" },
  { id: "explorer-legend", name: "Explorer Legend", description: "Visit 50 verified destinations.", rarity: "Diamond", target: 50, metric: "visits", xp: 300, icon: "🏆" },
  { id: "city-explorer", name: "City Explorer", description: "Visit 10 destinations in the same city.", rarity: "Silver", target: 10, metric: "cityVisits", xp: 100, icon: "🏙️" },
  { id: "multi-city-explorer", name: "Multi-City Explorer", description: "Visit destinations in 3 different cities.", rarity: "Diamond", target: 3, metric: "cities", xp: 200, icon: "🌏" },
  { id: "early-bird", name: "Early Bird", description: "Complete 5 verified morning visits.", rarity: "Silver", target: 5, metric: "morningVisits", xp: 100, icon: "🌅" },
  { id: "weekend-warrior", name: "Weekend Warrior", description: "Complete 5 verified weekend outings.", rarity: "Silver", target: 5, metric: "weekendVisits", xp: 100, icon: "🎒" },
];

const DAILY_XP_CAP = 200;
/** Awards XP once per (user, sourceKey). `detail` is the plain-language "why you got this" shown in Recent activity. */
async function awardXp(userId: string, amount: number, reason: string, sourceKey: string, detail = "") {
  if (amount <= 0) return 0;
  // A conservative daily cap discourages XP farming while keeping ordinary use rewarding.
  const daily = await sqlQuery<{ total: number }>(
    `select coalesce(sum(amount), 0)::int as total from student_xp_transactions where user_id = $1 and created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'`, [userId]);
  const granted = Math.min(Math.floor(amount), Math.max(0, DAILY_XP_CAP - Number(daily[0]?.total || 0)));
  if (granted <= 0) return 0;
  const note = granted < Math.floor(amount) ? `${detail} (Trimmed from ${Math.floor(amount)} XP by the ${DAILY_XP_CAP} XP daily limit.)`.trim() : detail;
  const rows = await sqlQuery<{ id: string }>(
    `insert into student_xp_transactions (id, user_id, amount, reason, source_key, detail) values ($1, $2, $3, $4, $5, $6) on conflict (user_id, source_key) do nothing returning id`,
    ["xp_" + randomBytes(10).toString("hex"), userId, granted, reason, sourceKey, note.slice(0, 400)],
  );
  return rows.length ? granted : 0;
}
async function awardList(userId: string, awards: Award[], keyBase: string) {
  let total = 0;
  for (const [i, a] of awards.entries()) total += await awardXp(userId, a.amount, a.reason, `${keyBase}:${i}`, a.why);
  return total;
}
/** Verified visits + reviews already on a place: decides quiet / normal / busy for the XP weighting. */
async function awardPhotoXp(userId: string, placeId: string, placeName: string, key: string) {
  const pop = popularityOf(await placeActivity(placeId));
  const rv = await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_reviews where place_id = $1 and user_id = $2`, [placeId, userId]);
  const a = photoAward({ placeName: placeName || "a place", popularity: pop, hasReview: Number(rv[0]?.n || 0) > 0 });
  await awardXp(userId, a.amount, a.reason, key, a.why);
}
async function placeActivity(placeId: string): Promise<number> {
  const v = await sqlQuery<{ n: number }>(`select count(*)::int as n from student_verified_visits where place_id = $1`, [placeId]);
  const r = await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_reviews where place_id = $1`, [placeId]);
  return Number(v[0]?.n || 0) + Number(r[0]?.n || 0);
}


// ---------------------------------------------------------------- squads
const JOIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newJoinCode = () => Array.from(randomBytes(6)).map((b: number) => JOIN_ALPHABET[b % JOIN_ALPHABET.length]).join("");
const istDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d); // YYYY-MM-DD

type SquadTrip = { id: string; ownerId: string; payload: Record<string, unknown> };

async function squadByCode(code: string): Promise<SquadTrip | null> {
  const rows = await sqlQuery<{ id: string; user_id: string; payload: unknown }>(`select id, user_id, payload from explorer_trips where payload->>'joinCode' = $1 limit 1`, [code.toUpperCase()]);
  return rows[0] ? { id: rows[0].id, ownerId: rows[0].user_id, payload: asObj(rows[0].payload) } : null;
}

async function placeNames(ids: string[]): Promise<Record<string, string>> {
  const names: Record<string, string> = {};
  const rows = await sqlQuery<{ id: string; name: string }>(`select id, payload->>'name' as name from explorer_places where id = any($1::text[])`, [ids]);
  rows.forEach((r) => { names[r.id] = r.name; });
  ids.forEach((id) => { if (!names[id] && BUILTIN_DESTINATIONS[id]) names[id] = BUILTIN_DESTINATIONS[id].name; });
  return names;
}

/** Members of a squad with how many of its stops each has verified (and how many today, IST). */
async function squadProgress(trip: SquadTrip) {
  const stops = (Array.isArray(trip.payload.stopIds) ? trip.payload.stopIds : []).map((x) => String(x));
  const members = await sqlQuery<{ user_id: string; role: string; completed_at: string | null; name: string }>(
    `select m.user_id, m.role, m.completed_at, coalesce(nullif(u.name, ''), split_part(u.email, '@', 1)) as name
       from squad_members m join "user" u on u.id = m.user_id where m.trip_id = $1 order by m.joined_at`, [trip.id]);
  const visits = stops.length ? await sqlQuery<{ user_id: string; place_id: string; visited_at: string }>(
    `select user_id, place_id, visited_at from student_verified_visits where place_id = any($2::text[]) and user_id = any($1::text[])`,
    [members.map((m) => m.user_id), stops]) : [];
  const today = istDay();
  const rows = members.map((m) => {
    const mine = visits.filter((v) => v.user_id === m.user_id);
    return {
      userId: m.user_id, name: m.name, role: m.role, completed: Boolean(m.completed_at),
      verifiedStops: new Set(mine.map((v) => v.place_id)).size,
      placesToday: new Set(mine.filter((v) => istDay(new Date(v.visited_at)) === today).map((v) => v.place_id)).size,
    };
  });
  return { stops, rows };
}

/** Called after a verified visit: completes squads for this member, pays the leader, and checks the shared challenge. */
async function processSquadsAfterVisit(user: SessionUser): Promise<string[]> {
  const notes: string[] = [];
  const mine = await sqlQuery<{ trip_id: string }>(`select trip_id from squad_members where user_id = $1 and completed_at is null`, [user.id]);
  const allMine = await sqlQuery<{ trip_id: string }>(`select trip_id from squad_members where user_id = $1`, [user.id]);
  const ids = new Set([...mine, ...allMine].map((r) => r.trip_id));
  for (const tripId of ids) {
    const trows = await sqlQuery<{ id: string; user_id: string; payload: unknown }>(`select id, user_id, payload from explorer_trips where id = $1`, [tripId]);
    if (!trows[0]) continue;
    const trip: SquadTrip = { id: trows[0].id, ownerId: trows[0].user_id, payload: asObj(trows[0].payload) };
    const { stops, rows } = await squadProgress(trip);
    if (stops.length < 2) continue;
    const me = rows.find((r) => r.userId === user.id);
    const title = clean(trip.payload.place, 120) || "your squad trip";
    if (me && !me.completed && me.verifiedStops >= stops.length) {
      await sqlQuery(`update squad_members set completed_at = now() where trip_id = $1 and user_id = $2 and completed_at is null`, [trip.id, user.id]);
      if (me.role !== "leader") {
        const got = await awardXp(user.id, SQUAD_COMPLETION_XP, `Squad trip completed: ${title}`, `squad-complete:${trip.id}`, `You verified all ${stops.length} stops of this squad trip. Every member who verifies earns this.`);
        const completedOthers = rows.filter((r) => r.role !== "leader" && (r.completed || r.userId === user.id)).length;
        if (completedOthers <= 5) await awardXp(trip.ownerId, 10, `Squad Leader bonus: ${me.name} finished ${title}`, `squad-leader:${trip.id}:${user.id}`, "A friend you invited verified every stop. Leaders earn 10 XP per member (up to 5).");
        notes.push(got ? `🎉 Squad trip complete! +${got} XP for finishing all ${stops.length} stops.` : `Squad trip complete!`);
      } else notes.push(`Every stop verified. Tap “Complete” on the plan to log your spend and claim the leader reward.`);
    }
    // Shared challenge: 3 friends, 3 places, one day
    if (stops.length >= SQUAD_DAY_MIN_PLACES) {
      const qualifies = sharedChallengeMet(rows.map((r) => ({ userId: r.userId, placesToday: r.placesToday })));
      if (qualifies) {
        const day = istDay();
        for (const r of rows.filter((x) => x.placesToday >= SQUAD_DAY_MIN_PLACES)) {
          const got = await awardXp(r.userId, SQUAD_DAY_CHALLENGE_XP, "Shared challenge: 3 friends, 3 places, one day", `squad-day:${trip.id}:${day}`, `At least ${SQUAD_DAY_MIN_FRIENDS} friends in “${title}” each verified ${SQUAD_DAY_MIN_PLACES} places today.`);
          if (got && r.userId === user.id) notes.push(`🏅 Shared challenge done: 3 friends, 3 places, one day! +${got} XP`);
        }
      }
    }
  }
  return notes;
}

/** Keeps ONE open auto-report per place: "real visitors stand somewhere else than the pin". */
async function flagPinFromVisit(place: Place, placeId: string, lat: number, lng: number, accuracy: number, distanceM: number) {
  const visits = await sqlQuery<{ latitude: number; longitude: number; accuracy_m: number }>(`select latitude, longitude, accuracy_m from student_verified_visits where place_id = $1 and distance_m > 80 order by visited_at desc limit 12`, [placeId]);
  const pts = visits.map((v) => ({ lat: Number(v.latitude), lng: Number(v.longitude), accuracy: Number(v.accuracy_m) }));
  const suggestion = suggestPinFromVisits({ lat: Number(place.lat), lng: Number(place.lng) }, pts);
  const msg = suggestion
    ? `Automatic: ${suggestion.n} verified visitors stood about ${Math.round(suggestion.offsetM)} m from the stored pin. The median of their positions is suggested.`
    : `Automatic: a verified visitor was ${Math.round(distanceM)} m from the stored pin. Waiting for a second visitor before suggesting a new pin.`;
  const sLat = suggestion?.lat ?? lat, sLng = suggestion?.lng ?? lng;
  const open = await sqlQuery<{ id: string }>(`select id from explorer_place_reports where place_id = $1 and source = 'auto' and status = 'pending' limit 1`, [placeId]);
  if (open[0]) await sqlQuery(`update explorer_place_reports set message = $2, suggested_lat = $3, suggested_lng = $4, updated_at = now() where id = $1`, [open[0].id, msg, sLat, sLng]);
  else await sqlQuery(`insert into explorer_place_reports (id, place_id, reporter_user_id, reporter_email, kind, message, suggested_lat, suggested_lng, source, reporter_lat, reporter_lng, reporter_accuracy_m) values ($1, $2, null, 'auto@verified-visits', 'wrong_pin', $3, $4, $5, 'auto', $6, $7, $8)`,
    ["report_" + randomBytes(10).toString("hex"), placeId, msg, sLat, sLng, lat, lng, accuracy]);
}

const LEVELS = [{ level: 1, name: "Newbie", xp: 0 }, { level: 2, name: "Explorer", xp: 100 }, { level: 3, name: "Adventurer", xp: 300 }, { level: 4, name: "Pathfinder", xp: 700 }, { level: 5, name: "Trailblazer", xp: 1500 }, { level: 6, name: "Explorer Pro", xp: 3000 }, { level: 7, name: "Legend", xp: 5000 }];
const levelFor = (xp: number) => [...LEVELS].reverse().find((l) => xp >= l.xp) || LEVELS[0];
const ordinal = (n: number) => { const v = n % 100; return n + (["th", "st", "nd", "rd"][(v - 20) % 10] || ["th", "st", "nd", "rd"][v] || "th"); };

type RankRow = { user_id: string; name: string; college: string; xp: number; badges: number; rank: number; badge_ids: string[] | null };

/** Everyone's live standing: most XP first, then most badges, then whoever reached that XP earliest. Admins are not ranked. */
async function liveRanking(limit?: number): Promise<{ total: number; rows: RankRow[] }> {
  const rows = await sqlQuery<RankRow>(
    `with x as (select user_id, sum(amount)::int as xp, max(created_at) as last_xp from student_xp_transactions group by user_id),
          b as (select user_id, count(*)::int as badges, array_agg(achievement_id order by unlocked_at) as badge_ids from student_achievements group by user_id)
     select u.id as user_id, coalesce(nullif(u.name, ''), split_part(u.email, '@', 1)) as name, coalesce(p.college, '') as college,
            coalesce(x.xp, 0)::int as xp, coalesce(b.badges, 0)::int as badges, b.badge_ids,
            row_number() over (order by coalesce(x.xp, 0) desc, coalesce(b.badges, 0) desc, coalesce(x.last_xp, u."createdAt") asc, u.id asc)::int as rank
       from "user" u
       left join explorer_profiles p on p.user_id = u.id
       left join x on x.user_id = u.id
       left join b on b.user_id = u.id
      where coalesce(p.is_admin, false) = false`,
  );
  const total = rows.length;
  rows.sort((a, c) => a.rank - c.rank);
  return { total, rows: limit ? rows.slice(0, limit) : rows };
}

const rankEntry = (r: RankRow, meId?: string) => {
  const lv = levelFor(Number(r.xp));
  return {
    rank: Number(r.rank),
    userId: r.user_id,
    name: r.name,
    college: r.college,
    xp: Number(r.xp),
    badges: Number(r.badges),
    badgeIcons: (r.badge_ids || []).slice(-3).map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.icon).filter(Boolean),
    level: lv.level,
    levelName: lv.name,
    isMe: Boolean(meId && r.user_id === meId),
  };
};
// Public view: never reveals user ids or emails.
const publicRankEntry = (e: ReturnType<typeof rankEntry>) => ({ rank: e.rank, name: e.name, college: e.college, xp: e.xp, badges: e.badges, badgeIcons: e.badgeIcons, level: e.level, levelName: e.levelName, isMe: e.isMe });

async function leaderboardSettings() {
  const rows = await sqlQuery<{ live: boolean; visible: boolean; current_snapshot: string | null }>(`select live, visible, current_snapshot from leaderboard_settings where id = 1`);
  return rows[0] || { live: true, visible: true, current_snapshot: null };
}

async function publishLeaderboard(adminId: string) {
  const { total, rows } = await liveRanking();
  const id = "lb_" + Date.now() + "_" + randomBytes(3).toString("hex");
  const top = rows.slice(0, 10).map((r) => rankEntry(r));
  await sqlQuery(`insert into leaderboard_snapshots (id, published_by, total, top) values ($1, $2, $3, $4::jsonb)`, [id, adminId, total, JSON.stringify(top)]);
  // One multi-row insert keeps publishing fast even with thousands of students.
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const values: string[] = [];
    const params: unknown[] = [id];
    chunk.forEach((r, j) => { values.push(`($1, $${j * 4 + 2}, $${j * 4 + 3}, $${j * 4 + 4}, $${j * 4 + 5})`); params.push(r.user_id, r.rank, r.xp, r.badges); });
    await sqlQuery(`insert into leaderboard_snapshot_ranks (snapshot_id, user_id, rank, xp, badges) values ${values.join(",")}`, params);
  }
  await sqlQuery(`update leaderboard_settings set current_snapshot = $1, visible = true, updated_at = now() where id = 1`, [id]);
  // Keep only the last 10 snapshots.
  await sqlQuery(`delete from leaderboard_snapshots where id in (select id from leaderboard_snapshots order by published_at desc offset 10)`);
  return { id, total, top };
}

/** What a student sees: the published snapshot (or the live ranking when the admin switched on live mode). */
async function studentLeaderboard(user: SessionUser | null) {
  const st = await leaderboardSettings();
  if (!st.visible) return { published: false as const };
  if (st.live) {
    const { total, rows } = await liveRanking();
    const mine = user ? rows.find((r) => r.user_id === user.id) : undefined;
    const above = mine && mine.rank > 1 ? rows[mine.rank - 2] : undefined;
    return {
      published: true as const, live: true, publishedAt: new Date().toISOString(), total,
      top: rows.slice(0, 10).map((r) => publicRankEntry(rankEntry(r, user?.id))),
      me: mine ? { ...publicRankEntry(rankEntry(mine, user?.id)), placeLabel: `${ordinal(mine.rank)} place`, xpToNext: above ? Math.max(1, above.xp - mine.xp + 1) : 0, nextName: above?.name || null } : null,
    };
  }
  const snap = st.current_snapshot ? (await sqlQuery<{ id: string; published_at: string; total: number; top: unknown }>(`select id, published_at, total, top from leaderboard_snapshots where id = $1`, [st.current_snapshot]))[0] : undefined;
  if (!snap) return { published: false as const };
  const top = (Array.isArray(snap.top) ? snap.top : []) as ReturnType<typeof rankEntry>[];
  let me: Record<string, unknown> | null = null;
  if (user) {
    const r = (await sqlQuery<{ rank: number; xp: number; badges: number }>(`select rank, xp, badges from leaderboard_snapshot_ranks where snapshot_id = $1 and user_id = $2`, [snap.id, user.id]))[0];
    if (r) {
      const lv = levelFor(Number(r.xp));
      const above = Number(r.rank) > 1 ? (await sqlQuery<{ xp: number; user_id: string }>(`select xp, user_id from leaderboard_snapshot_ranks where snapshot_id = $1 and rank = $2`, [snap.id, Number(r.rank) - 1]))[0] : undefined;
      me = { rank: Number(r.rank), name: user.name, college: user.college, xp: Number(r.xp), badges: Number(r.badges), level: lv.level, levelName: lv.name, isMe: true, placeLabel: `${ordinal(Number(r.rank))} place`, xpToNext: above ? Math.max(1, Number(above.xp) - Number(r.xp) + 1) : 0 };
    } else me = { unranked: true, message: "You joined after the last ranking was published. You'll appear in the next update." };
  }
  return { published: true as const, live: false, publishedAt: snap.published_at, total: snap.total, top: top.map((e) => publicRankEntry({ ...e, isMe: Boolean(user && e.userId === user.id) })), me };
}

async function gamificationSnapshot(user: SessionUser) {
  const visits = await sqlQuery<{ place_id: string; visited_at: string; city: string; hidden: boolean }>(
    `select v.place_id, v.visited_at, coalesce(p.payload->>'city', p.payload->>'location', '') as city,
      (p.payload->>'hiddenGem' = 'true' or p.payload->>'isHiddenGem' = 'true') as hidden
     from student_verified_visits v left join explorer_places p on p.id = v.place_id where v.user_id = $1`, [user.id]);
  const reviewRows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_reviews where user_id = $1`, [user.id]);
  const tripRows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_trips where user_id = $1`, [user.id]);
  const placeRows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_places`);
  const approvedPhotos = placeRows.reduce((n, row) => {
    const payload = asObj(row.payload);
    const subs = Array.isArray(payload.photoSubmissions) ? payload.photoSubmissions as Record<string, unknown>[] : [];
    return n + subs.filter((x) => x.email === user.email && x.status === "approved").length;
  }, 0);
  const cityCounts = new Map<string, number>();
  for (const visit of visits) {
    const place = placeRows.map((r) => asObj(r.payload)).find((p) => String(p.id || "") === visit.place_id) || (BUILTIN_DESTINATIONS[visit.place_id] as Record<string, unknown> | undefined) || {};
    const rawCity = clean(place.city || place.location || place.address || "Bengaluru", 100);
    const lowerLocation = rawCity.toLowerCase();
    const cityHints = ["bengaluru", "bangalore", "hyderabad", "visakhapatnam", "vizag", "vijayawada", "chennai", "mumbai", "new delhi", "delhi", "pune", "mysuru", "mysore", "kochi", "coimbatore", "jaipur", "kolkata"];
    const city = (place.city ? rawCity : cityHints.find((name) => lowerLocation.includes(name)) || rawCity.split(",").at(-1)?.trim() || "Bengaluru").toLowerCase();
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
  }
  const metrics: Record<string, number> = {
    visits: visits.length,
    hiddenVisits: visits.filter((v) => v.hidden).length,
    photos: approvedPhotos,
    reviews: reviewRows.filter((r) => !asObj(r.payload).isSample).length,
    budgetTrips: tripRows.map((r) => asObj(r.payload)).filter((t) => t.completed === true && t.withinBudget === true).length,
    groupTrips: tripRows.map((r) => asObj(r.payload)).filter((t) => t.type === "squad_plan" && t.completed === true).length,
    cityVisits: Math.max(0, ...cityCounts.values()),
    cities: cityCounts.size,
    morningVisits: visits.filter((v) => {
      const hour = new Date(v.visited_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" });
      return Number(hour) < 9;
    }).length,
    weekendVisits: visits.filter((v) => ["Saturday", "Sunday"].includes(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" }).format(new Date(v.visited_at)))).length,
  };
  const unlockedRows = await sqlQuery<{ achievement_id: string; unlocked_at: string }>(`select achievement_id, unlocked_at from student_achievements where user_id = $1`, [user.id]);
  const unlocked = new Map(unlockedRows.map((r) => [r.achievement_id, r.unlocked_at]));
  for (const achievement of ACHIEVEMENTS) {
    if ((metrics[achievement.metric] || 0) >= achievement.target && !unlocked.has(achievement.id)) {
      await sqlQuery(`insert into student_achievements (user_id, achievement_id) values ($1, $2) on conflict do nothing`, [user.id, achievement.id]);
      await awardXp(user.id, achievement.xp, `Unlocked ${achievement.name}`, `badge:${achievement.id}`, `Badge reward: ${achievement.description}`);
      unlocked.set(achievement.id, new Date().toISOString());
    }
  }
  const xpRows = await sqlQuery<{ total: number }>(`select coalesce(sum(amount), 0)::int as total from student_xp_transactions where user_id = $1`, [user.id]);
  const xp = Number(xpRows[0]?.total || 0);
  const levels = LEVELS;
  const current = [...levels].reverse().find((l) => xp >= l.xp) || levels[0];
  const next = levels.find((l) => l.xp > xp) || null;
  const xpRowsHistory = await sqlQuery<{ amount: number; reason: string; detail: string; created_at: string }>(`select amount, reason, detail, created_at from student_xp_transactions where user_id = $1 order by created_at desc limit 30`, [user.id]);
  const featuredRows = await sqlQuery<{ achievement_id: string }>(`select achievement_id from student_featured_badges where user_id = $1 order by sort_order limit 3`, [user.id]);
  return {
    xp, level: current, nextLevel: next, progress: next ? Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100) : 100,
    metrics,
    achievements: ACHIEVEMENTS.map((a) => ({ ...a, progress: Math.min(100, Math.round(((metrics[a.metric] || 0) / a.target) * 100)), current: metrics[a.metric] || 0, unlockedAt: unlocked.get(a.id) || null })),
    featured: featuredRows.map((r) => r.achievement_id),
    history: xpRowsHistory,
  };
}

export async function handleExplorer(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();
  try {
    await ensureSeed();
    if (path === "/api/gamification/challenges" && method === "GET") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in to view monthly challenges." }, 401);
      const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const year = ist.getFullYear(), month = ist.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      const startDate = `${monthKey}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;
      const challengeId = `bengaluru-visits-${monthKey}`;
      await sqlQuery(`insert into monthly_explorer_challenges (id, title, description, target, reward_xp, starts_at, ends_at, active) values ($1, $2, $3, 3, 75, $4::date, $5::date, true) on conflict (id) do nothing`, [challengeId, "Bengaluru Starter", "Verify three different destinations this month. Explore a new corner of the city and earn a bonus.", startDate, endDate]);
      const progressRows = await sqlQuery<{ n: number }>(`select count(*)::int as n from student_verified_visits where user_id = $1 and visited_at >= date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'`, [user.id]);
      const progress = Math.min(3, Number(progressRows[0]?.n || 0));
      await sqlQuery(`insert into student_challenge_progress (user_id, challenge_id, progress) values ($1, $2, $3) on conflict (user_id, challenge_id) do update set progress = greatest(student_challenge_progress.progress, excluded.progress)`, [user.id, challengeId, progress]);
      if (progress >= 3) {
        await sqlQuery(`update student_challenge_progress set completed_at = coalesce(completed_at, now()) where user_id = $1 and challenge_id = $2`, [user.id, challengeId]);
        await awardXp(user.id, 75, "Completed monthly Bengaluru Starter challenge", `challenge:${challengeId}`, "You verified 3 different destinations this month.");
      }
      const completed = progress >= 3;
      return json({ success: true, challenges: [{ id: challengeId, title: "Bengaluru Starter", description: "Verify three different destinations this month.", target: 3, progress, rewardXp: 75, startsAt: startDate, endsAt: endDate, completed }] });
    }
    if (path === "/api/gamification" && method === "GET") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in to view achievements." }, 401);
      return json({ success: true, ...await gamificationSnapshot(user) });
    }
    if (path === "/api/gamification/visit" && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in to verify a visit." }, 401);
      if (!allowRequest("visit:" + user.id, 8, 60_000)) return json({ success: false, error: "Too many visit checks. Try again later." }, 429);
      const body = asObj(await request.json().catch(() => ({})));
      const placeId = clean(body.placeId, 120);
      const lat = optNum(body.lat), lng = optNum(body.lng), accuracy = optNum(body.accuracy);
      if (!placeId || !validCoords(lat, lng) || accuracy === undefined) return json({ success: false, error: "We need a fresh location fix from your phone to verify this visit." }, 400);
      const places = await loadPlaces();
      const place = (places.find((p) => String(p.id) === placeId) || BUILTIN_DESTINATIONS[placeId]) as Place | undefined;
      if (!place || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lng))) return json({ success: false, error: "This destination does not have a map pin yet. Report it so an admin can add one." }, 404);
      const distanceM = haversineKm(Number(place.lat), Number(place.lng), lat!, lng!) * 1000;
      // The allowed distance depends on how trustworthy the place's pin is and how big the place is (see visit-rules.ts).
      const decision = decideVisit({ distanceM, accuracyM: accuracy, place: { category: String(place.category || ""), name: String(place.name || ""), locationPrecision: String(place.locationPrecision || ""), verifiedPin: place.verifiedPin === true, radiusM: typeof place.visitRadiusM === "number" ? place.visitRadiusM : undefined } });
      if (!decision.ok) return json({ success: false, error: decision.message, reason: decision.reason, distanceM: Math.round(distanceM), allowedM: decision.allowedM ? Math.round(decision.allowedM) : undefined, canReportPin: decision.reason === "too_far" }, decision.reason === "poor_gps" ? 400 : 403);
      const last = await sqlQuery<{ latitude: number; longitude: number; visited_at: string }>(`select latitude, longitude, visited_at from student_verified_visits where user_id = $1 order by visited_at desc limit 1`, [user.id]);
      if (impossibleTravel(last[0] ? { lat: Number(last[0].latitude), lng: Number(last[0].longitude), atMs: new Date(last[0].visited_at).getTime() } : null, { lat: lat!, lng: lng!, atMs: Date.now() })) {
        return json({ success: false, error: "That is too far from your last verified visit for the time that has passed. Try again from where you really are." }, 403);
      }
      const daily = await sqlQuery<{ n: number }>(`select count(*)::int as n from student_verified_visits where user_id = $1 and visited_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'`, [user.id]);
      if (Number(daily[0]?.n || 0) >= 8) return json({ success: false, error: "Daily visit reward limit reached (8 verified destinations)." }, 429);
      const activityBefore = await placeActivity(placeId); // before inserting, so the first visitors of a quiet place get the bonus
      const inserted = await sqlQuery<{ id: string }>(`insert into student_verified_visits (id, user_id, place_id, latitude, longitude, accuracy_m, distance_m, strength) values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (user_id, place_id) do nothing returning id`, ["visit_" + randomBytes(10).toString("hex"), user.id, placeId, lat, lng, accuracy, Math.round(distanceM), decision.strength]);
      if (!inserted.length) return json({ success: false, error: "You have already earned a visit reward for this destination." }, 409);
      const squadRows = await sqlQuery<{ trip_id: string; payload: unknown }>(`select m.trip_id, t.payload from squad_members m join explorer_trips t on t.id = m.trip_id where m.user_id = $1`, [user.id]);
      const squadHere = squadRows.find((r) => (Array.isArray(asObj(r.payload).stopIds) ? (asObj(r.payload).stopIds as unknown[]).map(String) : []).includes(placeId));
      const squadSize = squadHere ? Number((await sqlQuery<{ n: number }>(`select count(*)::int as n from squad_members where trip_id = $1`, [squadHere.trip_id]))[0]?.n || 0) : 0;
      const awards = visitAward({ placeName: clean(place.name, 100), popularity: popularityOf(activityBefore), hiddenGem: place.hiddenGem === true || place.isHiddenGem === true, strength: decision.strength, squadMembers: squadSize });
      const gained = await awardList(user.id, awards, `visit:${placeId}`);
      if (decision.reportPin) void flagPinFromVisit(place, placeId, lat!, lng!, accuracy, distanceM).catch((e) => console.warn("[explorer] pin flag failed", e));
      const squadNotes = await processSquadsAfterVisit(user);
      const pinNote = decision.strength === "pin_uncertain" ? " The map pin for this place looks approximate, so we flagged it for the admin to fix." : decision.reportPin ? " You were a bit away from the pin, so we sent it for a quick check." : "";
      return json({ success: true, gained, distanceM: Math.round(distanceM), strength: decision.strength, squadNotes, message: `Visit verified${gained ? ` (+${gained} XP)` : ""}.${pinNote}`, ...await gamificationSnapshot(user) });
    }
    if (path === "/api/gamification/featured" && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const body = asObj(await request.json().catch(() => ({})));
      const ids = Array.isArray(body.ids) ? body.ids.map((x) => clean(x, 80)).slice(0, 3) : [];
      const unlocked = await sqlQuery<{ achievement_id: string }>(`select achievement_id from student_achievements where user_id = $1`, [user.id]);
      const allowed = new Set(unlocked.map((r) => r.achievement_id));
      if (ids.some((id) => !allowed.has(id))) return json({ success: false, error: "Only unlocked badges can be showcased." }, 400);
      await sqlQuery(`delete from student_featured_badges where user_id = $1`, [user.id]);
      for (const [i, id] of ids.entries()) await sqlQuery(`insert into student_featured_badges (user_id, achievement_id, sort_order) values ($1, $2, $3) on conflict do nothing`, [user.id, id, i]);
      return json({ success: true, featured: ids });
    }

    if (path === "/api/maps/route" && method === "POST") {
      const body = asObj(await request.json().catch(() => ({})));
      const from = asObj(body.from);
      const to = asObj(body.to);
      const fromLat = optNum(from.lat);
      const fromLng = optNum(from.lng);
      const toLat = optNum(to.lat);
      const toLng = optNum(to.lng);
      if (!validCoords(fromLat, fromLng) || !validCoords(toLat, toLng)) {
        return json({ success: false, error: "Choose valid starting and destination coordinates." }, 400);
      }
      const mode = clean(body.mode, 20);
      if (!["driving", "walking", "cycling"].includes(mode)) {
        return json({ success: false, error: "Choose driving, walking or cycling." }, 400);
      }
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
      if (!allowRequest("route:" + ip, 20, 60_000)) return json({ success: false, error: "Too many route requests. Please wait a minute." }, 429);
      try {
        const route = await routeDirections(
          { lat: fromLat!, lng: fromLng! },
          { lat: toLat!, lng: toLng! },
          mode as "driving" | "walking" | "cycling",
        );
        return json({ success: true, route });
      } catch (error) {
        return json({ success: false, error: error instanceof Error ? error.message : "Route service unavailable. Try again later." }, 502);
      }
    }
    if (path === "/api/maps/gphoto" && method === "GET") {
      if (!allowRequest("gphoto:" + clientKey(request), 120, 60_000)) return new Response("Too many requests", { status: 429 });
      return googlePhotoResponse(clean(url.searchParams.get("pid"), 200), Math.round(num(url.searchParams.get("i"), 0)));
    }
    if (path === "/api/maps/geocode" && method === "GET") {
      const query = clean(url.searchParams.get("query") || url.searchParams.get("q"), 320);
      if (!query) return json({ success: false, error: "query is required" }, 400);
      if (!allowRequest("geocode:" + clientKey(request), 30, 60_000)) return json({ success: false, error: "Too many lookups. Please wait a minute." }, 429);
      const near = validNear({ lat: optNum(url.searchParams.get("nlat")), lng: optNum(url.searchParams.get("nlng")) });
      const candidates = await geocodeCandidates(query, 6, { near });
      if (!candidates.length) return json({ success: false, error: "No location found for that text. Check the spelling or add a locality or city (e.g. “Beach Road, Visakhapatnam”). Your typed address was kept; you can retry or place the pin on the map." }, 404);
      const best = candidates[0];
      return json({
        success: true,
        lat: best.lat,
        lng: best.lng,
        formattedAddress: best.formattedAddress,
        name: best.name,
        provider: best.provider,
        candidates: candidates.map(candidateOut),
        precision: best.precision || "area",
        needsVerification: (best.precision || "area") === "area",
        ambiguous: isAmbiguous(candidates),
      });
    }
    if (path === "/api/maps/suggest" && method === "GET") {
      const q = clean(url.searchParams.get("q"), 200);
      if (q.length < 3) return json({ success: true, suggestions: [] });
      if (!allowRequest("suggest:" + clientKey(request), 60, 60_000)) return json({ success: false, error: "Too many suggestions requested. Please slow down." }, 429);
      const near = validNear({ lat: optNum(url.searchParams.get("nlat")), lng: optNum(url.searchParams.get("nlng")) });
      const list = await suggestPlaces(q, near, 6);
      return json({ success: true, suggestions: list.map(candidateOut) });
    }
    if (path === "/api/maps/reverse-geocode" && method === "GET") {
      // A missing parameter must NOT silently become 0,0 (Number(null) === 0).
      const lat = optNum(url.searchParams.get("lat"));
      const lng = optNum(url.searchParams.get("lng"));
      if (!validCoords(lat, lng)) return json({ success: false, error: "Valid lat and lng required" }, 400);
      if (!allowRequest("revgeo:" + clientKey(request), 40, 60_000)) return json({ success: false, error: "Too many lookups. Please wait a minute." }, 429);
      const hit = await reverseGeocode(lat!, lng!);
      return json({ success: true, ...hit, inCoverage: inCoverage(lat!, lng!) });
    }
    if (path === "/api/maps/ip-location" && method === "GET") {
      const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim();
      const hit = await ipLocate(ip);
      if (!hit) return json({ success: false, error: "Could not detect location." }, 404);
      // IP lookups are only city-level: tell the page, and whether it is even inside the Bengaluru area.
      return json({ success: true, ...hit, latitude: hit.lat, longitude: hit.lng, approximate: true, inCoverage: inCoverage(hit.lat, hit.lng) });
    }
    if (path === "/api/maps/place-photo" && method === "GET") {
      const name = clean(url.searchParams.get("name"), 120);
      const area = clean(url.searchParams.get("area"), 160);
      const lat = optNum(url.searchParams.get("lat")) ?? NaN;
      const lng = optNum(url.searchParams.get("lng")) ?? NaN;
      if (!name) return json({ success: false, error: "name is required" }, 400);
      if (!allowRequest("photo:" + clientKey(request), 20, 60_000)) return json({ success: false, error: "Too many photo lookups. Please wait a minute." }, 429);
      const gp = await googleFindPlace(name, area);
      if (gp && gp.photoCount > 0) {
        const cand = googleCandidate(gp, 0);
        return json({ success: true, image: cand.url, provider: "google", credit: creditFrom(cand) });
      }
      const found = await findPlacePhoto(name, area, Number.isFinite(lat) ? lat : undefined, Number.isFinite(lng) ? lng : undefined);
      return json({
        success: true,
        image: found?.image || "",
        provider: found?.provider || "none",
        credit: found ? creditFrom(found.credit) : null,
      });
    }
    if (path === "/api/places/discover" && method === "GET") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in to use auto-fill." }, 401);
      if (!allowRequest("discover:" + user.id, 15, 60_000)) return json({ success: false, error: "Too many lookups. Please wait a minute and try again." }, 429);
      const name = clean(url.searchParams.get("name"), 120);
      if (name.length < 2) return json({ success: false, error: "Type the place name first (at least 2 letters)." }, 400);
      const lat = optNum(url.searchParams.get("lat"));
      const lng = optNum(url.searchParams.get("lng"));
      if ((lat !== undefined || lng !== undefined) && !validCoords(lat, lng)) return json({ success: false, error: "Those coordinates are not valid." }, 400);
      try {
        const result = await discoverPlace({
          name,
          lat,
          lng,
          address: clean(url.searchParams.get("address"), 200) || undefined,
          refresh: url.searchParams.get("refresh") === "1",
        });
        const bucket = toExplorerBucket(result.category.category);
        if (googleEnabled()) {
          const g = await googleFindPlace(name, clean(url.searchParams.get("address"), 200) || "");
          if (g) {
            const gc = Array.from({ length: g.photoCount }, (_, i) => googleCandidate(g, i));
            result.lat = Math.round(g.lat * 1e5) / 1e5;
            result.lng = Math.round(g.lng * 1e5) / 1e5;
            result.address = g.address || result.address;
            result.found = true;
            if (gc.length) {
              result.photos = [...gc, ...result.photos].slice(0, 8);
              result.selectedPhotoUrl = gc[0].url;
            }
          }
        }
        return json({
          success: true,
          ...result,
          categoryLabel: categoryLabel(result.category.category),
          explorerBucket: bucket.bucket,
          explorerBucketLabel: bucket.label || "",
        });
      } catch (e) {
        const msg = e instanceof UpstreamError ? e.message : "Auto-fill failed";
        return json({ success: false, error: `${msg}. You can still fill the form by hand.` }, 502);
      }
    }
    if (path === "/api/places/nearby-osm" && method === "GET") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      if (!allowRequest("nearby:" + user.id, 15, 60_000)) return json({ success: false, error: "Too many lookups. Please wait a minute." }, 429);
      const lat = optNum(url.searchParams.get("lat"));
      const lng = optNum(url.searchParams.get("lng"));
      if (!validCoords(lat, lng)) return json({ success: false, error: "Valid lat and lng required" }, 400);
      try {
        const places = await nearbyOsmPlaces(lat as number, lng as number, optNum(url.searchParams.get("radius")) ?? 600);
        return json({ success: true, places });
      } catch (e) {
        return json({ success: false, error: `${e instanceof Error ? e.message : "Nearby lookup failed"}. Try again in a moment.` }, 502);
      }
    }
    if (path === "/api/maps/distance" && method === "POST") {
      const body = asObj(await request.json().catch(() => ({})));
      const origin = asObj(body.origin);
      const destinations = Array.isArray(body.destinations) ? body.destinations : [];
      if (!Number.isFinite(Number(origin.lat)) || !Number.isFinite(Number(origin.lng))) {
        return json({ success: false, error: "origin with lat and lng is required" }, 400);
      }
      const distances: Record<string, { distanceKm: number; distanceMeters: number; durationText: string; provider: string }> = {};
      const list = destinations.slice(0, 60).map((raw) => asObj(raw)).filter((d) => clean(d.id, 80) && Number.isFinite(Number(d.lat)));
      const from = { lat: Number(origin.lat), lng: Number(origin.lng) };
      const queue = [...list];
      const worker = async () => {
        for (let dest = queue.shift(); dest; dest = queue.shift()) {
          const to = { lat: Number(dest.lat), lng: Number(dest.lng) };
          const route = await roadRoute(from, to);
          const km = route?.km ?? roadKmFromStraight(haversineKm(from.lat, from.lng, to.lat, to.lng));
          const mins = route?.mins ?? Math.round(km * (km > 40 ? 1.5 : 2.6));
          const durationText = mins >= 60 ? `~${Math.floor(mins / 60)}h ${mins % 60}m` : `~${mins} mins`;
          const metro = metroLeg(from, to);
          distances[clean(dest.id, 80)] = { distanceKm: km, distanceMeters: Math.round(km * 1000), durationText, provider: route?.provider || "road_network_model", metro: metro ? { fare: metro.fare, note: metro.note } : null } as never;
        }
      };
      await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
      return json({ success: true, origin: { name: origin.name || "Your Location", lat: Number(origin.lat), lng: Number(origin.lng) }, distances });
    }
    if (path === "/api/places/classify" && method === "POST") {
      const b = asObj(await request.json().catch(() => ({})));
      const name = clean(b.name, 80);
      if (!name) return json({ success: false, error: "name is required" }, 400);
      const classification = await classifyPlace({
        name,
        area: clean(b.area, 160),
        category: clean(b.category, 40),
        description: clean(b.description, 600),
        bestTime: clean(b.bestTime, 100),
        tip: clean(b.tip, 250),
        famousFor: clean(b.famousFor, 200),
        lat: optNum(b.lat),
        lng: optNum(b.lng),
      });
      return json({ success: true, classification });
    }
    if (path === "/api/places/estimate" && method === "POST") {
      const body = asObj(await request.json().catch(() => ({})));
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ success: false, error: "lat and lng required" }, 400);
      const origin = asObj(body.origin);
      const o = Number.isFinite(Number(origin.lat)) && Number.isFinite(Number(origin.lng)) ? { lat: Number(origin.lat), lng: Number(origin.lng), name: clean(origin.name, 80) } : null;
      const route = o ? await roadRoute(o, { lat, lng }) : null;
      return json({
        success: true,
        estimate: estimatePlace(
          { lat, lng, minBudget: num(body.minBudget), maxBudget: num(body.maxBudget, num(body.minBudget)), entryFee: num(body.entryFee) },
          o,
          4,
          route,
        ),
      });
    }
    if (path === "/api/student-picks" && method === "GET") {
      const area = clean(url.searchParams.get("area"), 100);
      const everyPlace = (await loadPlaces()).filter((p) => placeStatus(p) === "published").map((p) => publicPlace(p));
      const [reviews, trips] = await Promise.all([
        sqlQuery<{ place_id: string }>(`select place_id from explorer_reviews where created_at >= now() - interval '7 days'`),
        sqlQuery<{ payload: unknown }>(`select payload from explorer_trips where created_at >= now() - interval '7 days'`),
      ]);
      const scores: Record<string, number> = {};
      for (const row of reviews) scores[String(row.place_id)] = (scores[String(row.place_id)] || 0) + 3;
      for (const row of trips) {
        const trip = asObj(row.payload);
        const name = String(trip.place || "").trim().toLowerCase();
        const hit = everyPlace.find((p) => String(p.name || "").trim().toLowerCase() === name);
        if (hit) scores[String(hit.id)] = (scores[String(hit.id)] || 0) + 2;
      }
      // Typo-tolerant search: spelling mistakes, missing/extra/swapped letters, sound-alikes, partial words,
      // and places NEAR a recognised Bengaluru area all count as matches.
      const match: Record<string, number> = {};
      let places = everyPlace;
      let matchNote = "";
      let didYouMean = "";
      if (area) {
        let anchor: { lat: number; lng: number; label: string } | null = null;
        let anchorScore = 0;
        for (const [key, g] of Object.entries(BENGALURU_GEO_INDEX)) {
          const sc = Math.max(textScore(area, key), textScore(area, g.name), textScore(area, g.area.split(",")[0]));
          if (sc > anchorScore) { anchorScore = sc; anchor = { lat: g.lat, lng: g.lng, label: g.area.split(",")[0] }; }
        }
        for (const p of everyPlace) {
          let sc = fuzzyScore(area, [
            { text: p.name, weight: 1 },
            { text: p.location, weight: 0.95 },
            { text: p.area, weight: 0.95 },
            { text: p.address, weight: 0.9 },
            { text: p.famousFor, weight: 0.8 },
            { text: p.categoryLabel, weight: 0.7 },
            { text: p.category, weight: 0.7 },
            { text: p.metro, weight: 0.55 },
            { text: p.description, weight: 0.5 },
          ]);
          if (anchor && anchorScore >= 0.7 && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))) {
            const km = haversineKm(anchor.lat, anchor.lng, Number(p.lat), Number(p.lng));
            if (km <= 4) sc = Math.max(sc, 0.62 - Math.min(0.1, km * 0.02));
          }
          if (sc > 0) match[String(p.id)] = sc;
        }
        const strong = everyPlace.filter((p) => (match[String(p.id)] || 0) >= 0.6);
        if (strong.length) {
          places = strong;
          if (anchor && anchorScore >= 0.7 && anchorScore < 0.99) didYouMean = anchor.label;
        } else {
          const close = everyPlace.filter((p) => (match[String(p.id)] || 0) >= 0.3);
          if (close.length) {
            places = close;
            matchNote = "closest";
          } else {
            places = everyPlace;
            matchNote = "none";
          }
          if (anchor && anchorScore >= 0.5) didYouMean = anchor.label;
        }
      }
      // Admin-scheduled picks whose dates include today come first, in the admin's order.
      const scheduled = await sqlQuery<{ place_id: string; position: number; note: string }>(
        `select place_id, position, note from explorer_featured_picks where current_date between starts_on and ends_on order by position asc, created_at asc`,
      ).catch(() => []);
      const sched: Record<string, { position: number; note: string }> = {};
      scheduled.forEach((r) => { if (!sched[String(r.place_id)]) sched[String(r.place_id)] = { position: Number(r.position) || 0, note: String(r.note || "") }; });
      const ranked = places
        .map((p): Place & { weeklyScore: number; matchScore: number; featured?: boolean; featuredNote?: string; featuredPosition?: number } => ({ ...p, weeklyScore: scores[String(p.id)] || 0, matchScore: match[String(p.id)] || 0, featured: sched[String(p.id)] ? true : undefined, featuredNote: sched[String(p.id)]?.note || undefined, featuredPosition: sched[String(p.id)]?.position }))
        .sort((a, b) =>
          (area ? b.matchScore - a.matchScore : 0) ||
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          ((a.featuredPosition ?? 0) - (b.featuredPosition ?? 0)) ||
          b.weeklyScore - a.weeklyScore ||
          Number(Boolean(b.recommendedByAdmin)) - Number(Boolean(a.recommendedByAdmin)) ||
          Number(b.addedAt || 0) - Number(a.addedAt || 0),
        )
        .slice(0, 6);
      // Every pick must carry a usable location for EVERY visitor: fill any missing pin from its saved address.
      await Promise.all(
        ranked.map(async (p) => {
          if (Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) && Number(p.lat) !== 0) return;
          const text = [p.name, p.address || p.location].filter(Boolean).join(", ");
          const geo = await geocodeAddress(text).catch(() => null);
          if (geo) { p.lat = geo.lat; p.lng = geo.lng; }
        }),
      );
      return json({ success: true, picks: ranked, period: "last_7_days", area: area || "everywhere", matchNote, didYouMean });
    }
    if (path === "/api/places" && method === "GET") {
      await ensureCuratedPlaces();
      const viewer = await readSession(request).catch(() => null);
      const places = (await loadPlaces()).filter((p) => canSee(p, viewer));
      return json({ success: true, places: viewer?.isAdmin ? places : places.map((p) => publicPlace(expireFeatured(p), viewer)) });
    }
    if (path === "/api/places" && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please sign up or log in first." }, 401);
      const b = asObj(await request.json().catch(() => ({})));
      const name = clean(b.name, 80);
      const area = clean(b.area, 160);
      if (!name || !area) return json({ success: false, error: "Just name and area are required. Other fields are optional." }, 400);
      let lat = optNum(b.lat) ?? NaN;
      let lng = optNum(b.lng) ?? NaN;
      let precision: "exact" | "area" = clean(b.locationPrecision, 10) === "exact" ? "exact" : "area";
      let google: GooglePlace | null = null;
      let locationText = area;
      // Google Maps (when a key is set) pins the exact spot and gives the real address, even if the browser only had the area.
      if (googleEnabled() && !(precision === "exact" && Number.isFinite(lat) && Number.isFinite(lng))) {
        google = await googleFindPlace(name, area);
        if (google) {
          lat = google.lat;
          lng = google.lng;
          precision = "exact";
          if (google.address) locationText = google.address;
        }
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        // Resolve the named venue first. The previous area-only fallback pinned the
        // neighbourhood centroid, which made directions lead to the wrong address.
        const named = await Promise.race([locateBest(name, area).catch(() => null), sleepNull<null>(6000)]);
        if (named) {
          lat = named.lat;
          lng = named.lng;
          locationText = named.formattedAddress || locationText;
          precision = named.precision;
          google = named.google;
        } else {
          const geo = await geocodeAddress(area).catch(() => null);
          if (!geo) return json({ success: false, error: "Could not locate this place. Add its full street address or pin its exact location on the map." }, 400);
          lat = geo.lat;
          lng = geo.lng;
          precision = "area";
        }
      }
      if (osmKeyOf(b)) precision = "exact";
      const dup = await findDuplicate(name, lat, lng, osmKeyOf(b));
      if (dup) return json({ success: false, error: `"${dup.name}" is already listed near here. Search for it instead of adding it again.` }, 409);
      const cat = clean(b.category, 40) || "food";
      const builtIn = ["food", "nature", "attractions", "entertainment", "getaways", "hotels"];
      const isCustom = !builtIn.includes(cat);
      const minBudget = Math.max(0, Math.round(num(b.minBudget, 100)));
      let maxBudget = num(b.maxBudget, NaN);
      if (!Number.isFinite(maxBudget) || maxBudget <= 0) maxBudget = Math.max(minBudget, Math.round(minBudget * 1.8));
      else maxBudget = Math.max(minBudget, Math.round(maxBudget));
      // Photos: an upload is used as-is; Google Maps photos are instant; anything else is searched in the background.
      let { image, credit } = await resolveImage(name, area, lat, lng, b.image, false);
      let galleryExtra: string[] = [];
      if (!image && google && google.photoCount > 0) {
        const cands = Array.from({ length: google.photoCount }, (_, i) => googleCandidate(google as GooglePlace, i));
        image = cands[0].url;
        credit = creditFrom(cands[0]);
        galleryExtra = cands.slice(1, 3).map((c) => c.url);
      }
      const origin = asObj(b.origin);
      const osm = osmFromBody(b);
      const place: Record<string, unknown> = {
        id: "community_" + Date.now() + "_" + randomBytes(3).toString("hex"),
        name,
        description: clean(b.description, 600) || `${name} in ${area}.`,
        location: google ? locationText : area,
        googlePlaceId: google?.placeId,
        category: isCustom ? "custom" : cat,
        categoryLabel: isCustom ? clean(b.customCategory, 40) || "Custom" : undefined,
        famousFor: clean(b.famousFor, 200),
        lat: Math.round(lat * 1e5) / 1e5,
        lng: Math.round(lng * 1e5) / 1e5,
        // "area" = only the locality was found, so Google Maps directions search by shop name + area instead of coordinates.
        locationPrecision: precision,
        mapQuery: `${name}, ${area}`,
        minBudget,
        maxBudget,
        budget: `₹${minBudget} – ₹${maxBudget} per person (est.)`,
        budgetIsEstimate: true,
        entryFee: Math.max(0, Math.round(num(b.entryFee))),
        rating: Math.min(5, Math.max(1, num(b.rating, 4.5))),
        image,
        photos: image ? [image, ...galleryExtra] : [],
        photoSubmissions: image && image.startsWith("data:") ? [{ id: "ph_" + randomBytes(4).toString("hex"), url: image, by: user.name, email: user.email, at: Date.now(), status: "approved" }] : [],
        photoCredit: credit || undefined,
        ...osm,
        // A place added inside Bengaluru goes live for everyone straight away (duplicates were already refused above).
        // Anything located outside the city waits for admin approval. Admins can still unpublish or reject at any time.
        status: user.isAdmin || haversineKm(12.9716, 77.5946, lat, lng) <= 60 ? "published" : "pending",
        metro: clean(b.metro, 160) || "Check the map for the nearest stop",
        bestTime: clean(b.bestTime, 100) || "Anytime",
        studentTip: clean(b.tip, 250),
        addedBy: user.name,
        addedByEmail: user.email,
        addedAt: Date.now(),
      };
      // Auto-detect morning vs late-night using Google/OSM types + text (even if no reviews yet)
      try {
        const classification = await classifyPlace({
          fast: true,
          name,
          area,
          category: String(place.category || cat),
          description: String(place.description || ""),
          bestTime: String(place.bestTime || ""),
          tip: String(place.studentTip || ""),
          famousFor: String(place.famousFor || ""),
          lat,
          lng,
        });
        place.vibes = classification.vibes;
        place.timeOfDay = classification.timeOfDay;
        place.placeTypes = classification.types;
        place.classifySource = classification.source;
        place.classifyConfidence = classification.confidence;
        if (classification.suggestedCategory && !clean(b.category, 40)) {
          place.category = classification.suggestedCategory;
        }
      } catch {
        place.vibes = [];
        place.timeOfDay = "any";
      }
      place.estimate = estimatePlace(place as { lat: number; lng: number; minBudget: number; maxBudget: number; entryFee: number }, Number.isFinite(Number(origin.lat)) ? { lat: Number(origin.lat), lng: Number(origin.lng), name: clean(origin.name, 80) } : null);
      if (!place.image) { place.image = ""; place.photos = []; }
      await sqlQuery(`insert into explorer_places (id, payload, added_by) values ($1, $2::jsonb, $3)`, [place.id, JSON.stringify(place), user.id]);
      const firstApprovedUpload = Array.isArray(place.photoSubmissions) ? (place.photoSubmissions as Record<string, unknown>[]).find((photo) => photo.status === "approved") : undefined;
      if (firstApprovedUpload) await awardPhotoXp(user.id, String(place.id), String(place.name || ""), `photo:${String(firstApprovedUpload.id)}`);
      // Slow lookups (exact shop spot, photo, OpenStreetMap category) run AFTER the reply, so publishing feels instant.
      void enrichPlaceInBackground(String(place.id), { name, area, lat, lng, precision, hadImage: Boolean(place.image), userPickedCategory: Boolean(clean(b.category, 40)) });
      return json({ success: true, place: publicPlace(place as Place, user), enriching: true, pending: place.status === "pending" });
    }
    const placeReportPost = path.match(/^\/api\/places\/([^/]+)\/report$/);
    if (placeReportPost && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in to report a place." }, 401);
      if (!allowRequest("report:" + user.id, 8, 3_600_000)) return json({ success: false, error: "You have sent many reports this hour. Please try again later." }, 429);
      const placeId = decodeURIComponent(placeReportPost[1]);
      // Built-in showcase places (Cubbon Park, Lalbagh, ...) are not database rows, so they used to answer "Place not found".
      const placeRows = await sqlQuery<{ id: string }>(`select id from explorer_places where id = $1`, [placeId]);
      if (!placeRows.length && !BUILTIN_DESTINATIONS[placeId]) return json({ success: false, error: "Place not found." }, 404);
      const b = asObj(await request.json().catch(() => ({})));
      const kind = clean(b.kind, 20);
      if (!["wrong_pin", "wrong_photo", "wrong_address", "other"].includes(kind)) {
        return json({ success: false, error: "Choose wrong pin, wrong address, wrong photo or other." }, 400);
      }
      const message = clean(b.message, 500);
      const suggestedAddress = clean(b.suggestedAddress, 240);
      let suggestedLat = optNum(b.suggestedLat);
      let suggestedLng = optNum(b.suggestedLng);
      if ((suggestedLat !== undefined || suggestedLng !== undefined) && !validCoords(suggestedLat, suggestedLng)) {
        return json({ success: false, error: "Suggested coordinates are invalid." }, 400);
      }
      const reporterLat = optNum(b.reporterLat), reporterLng = optNum(b.reporterLng), reporterAcc = optNum(b.reporterAccuracy);
      const hasReporterFix = validCoords(reporterLat, reporterLng) && reporterAcc !== undefined && reporterAcc >= 0 && reporterAcc <= 200;
      let photo: string | null = null;
      if (b.photo !== undefined && b.photo !== null && b.photo !== "") {
        const img = validImage(b.photo);
        if (!img || !img.startsWith("data:image/")) return json({ success: false, error: "Please attach a JPG or PNG photo (under about 2.5 MB)." }, 400);
        photo = img;
      }
      if (!message && !suggestedAddress && suggestedLat === undefined && !photo) {
        return json({ success: false, error: "Tell us what is wrong: add a note, the correct address, a pin or a photo." }, 400);
      }
      // A typed address becomes a suggested pin when we can find it (best effort, never blocks the report).
      if (suggestedAddress && suggestedLat === undefined && (kind === "wrong_pin" || kind === "wrong_address")) {
        try {
          const g = await Promise.race([geocodeAddress(suggestedAddress + ", Bengaluru"), new Promise<null>((r) => setTimeout(() => r(null), 5000))]);
          if (g && validCoords(g.lat, g.lng)) { suggestedLat = g.lat; suggestedLng = g.lng; }
        } catch { /* keep the report without coordinates */ }
      }
      // One open report per person, place and kind: sending again updates it instead of flooding the admin.
      const open = await sqlQuery<{ id: string }>(`select id from explorer_place_reports where place_id = $1 and reporter_user_id = $2 and kind = $3 and status = 'pending' limit 1`, [placeId, user.id, kind]);
      const id = open[0]?.id || "report_" + randomBytes(10).toString("hex");
      if (open[0]) {
        await sqlQuery(
          `update explorer_place_reports set message = $2, suggested_address = $3, suggested_lat = $4, suggested_lng = $5, photo = coalesce($6, photo),
             reporter_lat = $7, reporter_lng = $8, reporter_accuracy_m = $9, updated_at = now() where id = $1`,
          [id, message, suggestedAddress, suggestedLat ?? null, suggestedLng ?? null, photo, hasReporterFix ? reporterLat : null, hasReporterFix ? reporterLng : null, hasReporterFix ? reporterAcc : null],
        );
      } else {
        await sqlQuery(
          `insert into explorer_place_reports (id, place_id, reporter_user_id, reporter_email, kind, message, suggested_lat, suggested_lng, suggested_address, photo, reporter_lat, reporter_lng, reporter_accuracy_m)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [id, placeId, user.id, user.email, kind, message, suggestedLat ?? null, suggestedLng ?? null, suggestedAddress, photo, hasReporterFix ? reporterLat : null, hasReporterFix ? reporterLng : null, hasReporterFix ? reporterAcc : null],
        );
      }
      return json({ success: true, reportId: id, updated: Boolean(open[0]), geocoded: suggestedLat !== undefined && !validCoords(optNum(b.suggestedLat), optNum(b.suggestedLng)) });
    }

    const placePhotoPost = path.match(/^\/api\/places\/([^/]+)\/photos$/);
    if (placePhotoPost && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in to add a photo." }, 401);
      if (!allowRequest("addphoto:" + user.id, 10, 60_000)) return json({ success: false, error: "Too many uploads. Please wait a minute." }, 429);
      const id = decodeURIComponent(placePhotoPost[1]);
      const rows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_places where id = $1`, [id]);
      if (!rows[0]) return json({ success: false, error: "That place is not in the community list, so photos cannot be added to it." }, 404);
      const b = asObj(await request.json().catch(() => ({})));
      const img = validImage(b.image);
      if (!img || !img.startsWith("data:image/")) return json({ success: false, error: "Please choose a photo from your device (JPG or PNG)." }, 400);
      const p = asObj(rows[0].payload);
      const subs = (Array.isArray(p.photoSubmissions) ? p.photoSubmissions : []) as Record<string, unknown>[];
      if (subs.filter((x) => x.email === user.email && x.status === "pending").length >= 3) return json({ success: false, error: "You already have 3 photos waiting for review on this place." }, 429);
      const hasMain = typeof p.image === "string" && p.image !== "";
      const sub = { id: "ph_" + randomBytes(4).toString("hex"), url: img, by: user.name, email: user.email, at: Date.now(), status: hasMain ? "pending" : "approved" };
      subs.push(sub);
      p.photoSubmissions = subs.slice(-30);
      if (!hasMain) {
        // The place had no picture: the first photo is shown right away. Admin can still replace it.
        p.image = img;
        p.photos = [img];
        p.photoCredit = { origin: "upload" };
      }
      await sqlQuery(`update explorer_places set payload = $2::jsonb where id = $1`, [id, JSON.stringify({ ...p, id })]);
      if (!hasMain) await awardPhotoXp(user.id, id, String(p.name || ""), `photo:${sub.id}`);
      return json({ success: true, shownNow: !hasMain, message: hasMain ? "Thanks! Your photo was sent to the admin, who picks the best picture for this place." : "Photo added to this place." });
    }
    const placeDelete = path.match(/^\/api\/places\/([^/]+)$/);
    if (placeDelete && method === "DELETE") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const id = decodeURIComponent(placeDelete[1]);
      const rows = await sqlQuery<{ payload: unknown; added_by: string | null }>(`select payload, added_by from explorer_places where id = $1`, [id]);
      if (!rows[0]) return json({ success: false, error: "Not found" }, 404);
      const payload = asObj(rows[0].payload);
      if (payload.addedByEmail !== user.email && !user.isAdmin) return json({ success: false, error: "You can only delete places you added." }, 403);
      await sqlQuery(`delete from explorer_places where id = $1`, [id]);
      return json({ success: true });
    }
    if (path === "/api/profile" && method === "GET") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      return json({ success: true, user: publicUser(user) });
    }
    if (path === "/api/profile" && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const b = asObj(await request.json().catch(() => ({})));
      const college = clean(b.college, 80);
      await sqlQuery(
        `insert into explorer_profiles (user_id, college, is_admin, last_active_at)
         values ($1, $2, $3, now())
         on conflict (user_id) do update set college = excluded.college, last_active_at = now()`,
        [user.id, college, user.isAdmin],
      );
      return json({ success: true, user: { ...publicUser(user), college } });
    }
    if (path === "/api/recommendations" && method === "GET") {
      const places = await loadPlaces();
      const list = places
        .map((p) => expireFeatured(p))
        .filter((p) => p.recommendedByAdmin && p.showInHero !== false)
        .map((p) => {
          const photos = (Array.isArray(p.photos) ? p.photos : []).filter((x) => typeof x === "string" && String(x).length > 12);
          if (!photos.length && typeof p.image === "string" && p.image) photos.push(p.image);
          return { ...p, photos, image: photos[0] || "" };
        });
      // Featured places without a photo are still served (the hero shows a clean name card), so a feature never silently disappears.
      return json({ success: true, recommendations: list });
    }
    if (path === "/api/stats/public" && method === "GET") {
      const trips = await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_trips`);
      const places = await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_places`);
      const reviews = await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_reviews`);
      return json({ success: true, stats: { places: Number(places[0]?.n || 0) + 6, outingsLogged: Number(trips[0]?.n || 0), reviews: Number(reviews[0]?.n || 0) } });
    }
    if (path === "/api/trips" && method === "GET") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const rows = await sqlQuery<{ id: string; payload: unknown }>(`select id, payload from explorer_trips where user_id = $1 order by created_at desc`, [user.id]);
      const trips = [] as Record<string, unknown>[];
      for (const r of rows) {
        const t = asObj(r.payload);
        if (t.type === "squad_plan" && !t.joinCode) { // plans saved before squads existed
          t.joinCode = newJoinCode();
          await sqlQuery(`update explorer_trips set payload = $2::jsonb where id = $1`, [r.id, JSON.stringify(t)]);
          await sqlQuery(`insert into squad_members (trip_id, user_id, role) values ($1, $2, 'leader') on conflict do nothing`, [r.id, user.id]);
        }
        trips.push(t);
      }
      return json({ success: true, trips });
    }
    if (path === "/api/trips" && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const b = asObj(await request.json().catch(() => ({})));
      // Squad multi-stop plan (from the trip planner UI) — stored alongside expense diaries.
      if (b.type === "squad_plan" || Array.isArray(b.stopIds)) {
        const stopIds = (Array.isArray(b.stopIds) ? b.stopIds : [])
          .map((id) => clean(id, 120))
          .filter(Boolean)
          .slice(0, 5);
        if (stopIds.length < 2) return json({ success: false, error: "Choose at least two stops for a trip plan." }, 400);
        const people = Math.min(25, Math.max(1, Math.round(num(b.people ?? b.numPeople, 4))));
        const trip = {
          id: "plan_" + Date.now() + "_" + randomBytes(2).toString("hex"),
          type: "squad_plan",
          place: clean(b.place, 160) || stopIds.join(" → "),
          stopIds,
          people,
          budgetLimit: Math.max(0, Math.min(100000, Math.round(num(b.budgetLimit)))),
          note: clean(b.note, 200),
          date: clean(b.date, 10) || new Date().toISOString().slice(0, 10),
          savedAt: Date.now(),
          joinCode: newJoinCode(),
          numPeople: people,
          transitCost: 0,
          foodCost: 0,
          entryCost: 0,
          miscCost: 0,
          totalCost: 0,
          perPerson: 0,
        };
        await sqlQuery(`insert into explorer_trips (id, user_id, payload) values ($1, $2, $3::jsonb)`, [trip.id, user.id, JSON.stringify(trip)]);
        await sqlQuery(`insert into squad_members (trip_id, user_id, role) values ($1, $2, 'leader') on conflict do nothing`, [trip.id, user.id]);
        await awardXp(user.id, 15, "Created a student group trip plan", `trip-plan:${trip.id}`, "Planning a squad trip with 2+ stops and a budget.");
        return json({ success: true, trip });
      }
      const c = (v: unknown) => Math.max(0, Math.round(num(v)));
      const numPeople = Math.min(50, Math.max(1, Math.round(num(b.numPeople, 1))));
      const trip = {
        id: String(Date.now()),
        type: "expense",
        place: clean(b.place, 100) || "Outing",
        date: clean(b.date, 10) || new Date().toISOString().slice(0, 10),
        transitMode: clean(b.transitMode, 40),
        numPeople,
        transitCost: c(b.transitCost),
        foodCost: c(b.foodCost),
        entryCost: c(b.entryCost),
        miscCost: c(b.miscCost),
        note: clean(b.note, 200),
        totalCost: 0,
        perPerson: 0,
      };
      trip.totalCost = trip.transitCost + trip.foodCost + trip.entryCost + trip.miscCost;
      trip.perPerson = Math.ceil(trip.totalCost / numPeople);
      await sqlQuery(`insert into explorer_trips (id, user_id, payload) values ($1, $2, $3::jsonb)`, [trip.id, user.id, JSON.stringify(trip)]);
      return json({ success: true, trip });
    }
    if (path === "/api/trips" && method === "DELETE") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      await sqlQuery(`delete from explorer_trips where user_id = $1`, [user.id]);
      return json({ success: true });
    }
    // ---- Squads: share a plan on WhatsApp, friends join with the code, everyone who verifies earns XP ----
    if (path === "/api/squads/mine" && method === "GET") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const mem = await sqlQuery<{ trip_id: string; role: string }>(`select trip_id, role from squad_members where user_id = $1 order by joined_at desc`, [user.id]);
      const squads = [] as unknown[];
      for (const m of mem.slice(0, 12)) {
        const t = await sqlQuery<{ id: string; user_id: string; payload: unknown }>(`select id, user_id, payload from explorer_trips where id = $1`, [m.trip_id]);
        if (!t[0]) continue;
        const trip: SquadTrip = { id: t[0].id, ownerId: t[0].user_id, payload: asObj(t[0].payload) };
        const { stops, rows } = await squadProgress(trip);
        const names = await placeNames(stops);
        const challengeToday = stops.length >= SQUAD_DAY_MIN_PLACES && rows.filter((r) => r.placesToday >= SQUAD_DAY_MIN_PLACES).length >= SQUAD_DAY_MIN_FRIENDS;
        squads.push({ tripId: trip.id, title: clean(trip.payload.place, 160), joinCode: trip.payload.joinCode, role: m.role, completed: trip.payload.completed === true,
          stops: stops.map((id) => ({ id, name: names[id] || id })),
          members: rows.map((r) => ({ name: r.name, role: r.role, verifiedStops: r.verifiedStops, totalStops: stops.length, completed: r.completed, isMe: r.userId === user.id })),
          challenge: { title: "3 friends, 3 places, one day", needFriends: SQUAD_DAY_MIN_FRIENDS, needPlaces: SQUAD_DAY_MIN_PLACES, eligible: stops.length >= SQUAD_DAY_MIN_PLACES, friendsReady: rows.filter((r) => r.placesToday >= SQUAD_DAY_MIN_PLACES).length, done: challengeToday, rewardXp: SQUAD_DAY_CHALLENGE_XP } });
      }
      const led = await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_trips where user_id = $1 and payload->>'type' = 'squad_plan' and payload->>'completed' = 'true'`, [user.id]);
      return json({ success: true, squads, leader: { completedTrips: Number(led[0]?.n || 0), target: 5, badge: "Squad Leader" } });
    }
    const squadGet = path.match(/^\/api\/squads\/([A-Za-z0-9]{4,12})$/);
    if (squadGet && method === "GET") {
      const trip = await squadByCode(squadGet[1]);
      if (!trip) return json({ success: false, error: "This squad link is not valid any more." }, 404);
      const { stops, rows } = await squadProgress(trip);
      const names = await placeNames(stops);
      return json({ success: true, squad: { title: clean(trip.payload.place, 160), stops: stops.map((id) => ({ id, name: names[id] || id })), people: Number(trip.payload.people || rows.length), joined: rows.length, leader: rows.find((r) => r.role === "leader")?.name || "A friend", budgetLimit: Number(trip.payload.budgetLimit || 0) } });
    }
    const squadJoin = path.match(/^\/api\/squads\/([A-Za-z0-9]{4,12})\/join$/);
    if (squadJoin && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Log in to join this squad. Your friend's plan will be waiting." }, 401);
      const trip = await squadByCode(squadJoin[1]);
      if (!trip) return json({ success: false, error: "This squad link is not valid any more." }, 404);
      const count = Number((await sqlQuery<{ n: number }>(`select count(*)::int as n from squad_members where trip_id = $1`, [trip.id]))[0]?.n || 0);
      if (count >= 25) return json({ success: false, error: "This squad is full (25 members)." }, 409);
      const ins = await sqlQuery<{ trip_id: string }>(`insert into squad_members (trip_id, user_id, role) values ($1, $2, $3) on conflict do nothing returning trip_id`, [trip.id, user.id, trip.ownerId === user.id ? "leader" : "member"]);
      return json({ success: true, alreadyMember: !ins.length, title: clean(trip.payload.place, 160), message: ins.length ? "You joined the squad! Verify each stop on the day to earn XP." : "You are already in this squad." });
    }
    const tripComplete = path.match(/^\/api\/trips\/([^/]+)\/complete$/);
    if (tripComplete && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const tripId = decodeURIComponent(tripComplete[1]);
      const rows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_trips where user_id = $1 and id = $2`, [user.id, tripId]);
      if (!rows[0]) return json({ success: false, error: "Trip not found." }, 404);
      const trip = asObj(rows[0].payload);
      const stops = Array.isArray(trip.stopIds) ? trip.stopIds.map((x) => clean(x, 120)) : [];
      if (trip.type !== "squad_plan" || stops.length < 2) return json({ success: false, error: "Only saved group trip plans can be completed here." }, 400);
      const verified = await sqlQuery<{ n: number }>(`select count(*)::int as n from student_verified_visits where user_id = $1 and place_id = any($2::text[])`, [user.id, stops]);
      if (Number(verified[0]?.n || 0) < stops.length) return json({ success: false, error: "Verify your visit at every trip stop before completing this group trip." }, 400);
      if (trip.completed !== true) {
        const body = asObj(await request.json().catch(() => ({})));
        const actualPerPerson = optNum(body.actualPerPerson);
        trip.completed = true;
        trip.completedAt = new Date().toISOString();
        if (actualPerPerson !== undefined && Number(trip.budgetLimit || 0) > 0) {
          trip.actualPerPerson = Math.round(actualPerPerson);
          trip.withinBudget = actualPerPerson <= Number(trip.budgetLimit);
        }
        await sqlQuery(`update explorer_trips set payload = $3::jsonb where user_id = $1 and id = $2`, [user.id, tripId, JSON.stringify(trip)]);
        await awardXp(user.id, 50, "Completed verified group trip", `group-trip:${tripId}`, "You led a squad trip and verified every stop. Squad Leader badge progress +1.");
        await sqlQuery(`update squad_members set completed_at = coalesce(completed_at, now()) where trip_id = $1 and user_id = $2`, [tripId, user.id]);
      }
      return json({ success: true, message: "🎉 Group trip completed! Leader XP added.", trip, ...await gamificationSnapshot(user) });
    }
    const tripDelete = path.match(/^\/api\/trips\/([^/]+)$/);
    if (tripDelete && method === "DELETE") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      await sqlQuery(`delete from explorer_trips where user_id = $1 and id = $2`, [user.id, decodeURIComponent(tripDelete[1])]);
      return json({ success: true });
    }
    const reviewsGet = path.match(/^\/api\/reviews\/([^/]+)$/);
    if (reviewsGet && method === "GET") {
      const placeId = decodeURIComponent(reviewsGet[1]);
      const rows = await sqlQuery<{ payload: unknown }>(
        `select payload from explorer_reviews where place_id = $1 order by created_at desc`,
        [placeId],
      );
      return json({ success: true, reviews: rows.map((r) => asObj(r.payload)) });
    }
    if (path === "/api/reviews" && method === "POST") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please sign up or log in first." }, 401);
      const b = asObj(await request.json().catch(() => ({})));
      const placeId = clean(b.placeId, 80);
      const comment = clean(b.comment, 800);
      if (!placeId) return json({ success: false, error: "placeId is required." }, 400);
      if (!comment) return json({ success: false, error: "Write a short review comment." }, 400);
      const photo = typeof b.photo === "string" && b.photo.startsWith("data:image/") && b.photo.length < 1_200_000
        ? b.photo
        : "";
      const review = {
        id: "rev_" + Date.now() + "_" + randomBytes(3).toString("hex"),
        placeId,
        placeName: clean(b.placeName, 100),
        rating: Math.min(5, Math.max(1, num(b.rating, 5))),
        costSpent: Math.max(0, Math.round(num(b.costSpent))),
        highlight: clean(b.highlight, 160),
        comment,
        photo: photo || undefined,
        authorName: user.name,
        authorEmail: user.email,
        college: clean(b.college, 80) || user.college || "",
        isSample: false,
        createdAt: Date.now(),
      };
      await sqlQuery(`insert into explorer_reviews (id, place_id, user_id, payload) values ($1, $2, $3, $4::jsonb)`, [
        review.id,
        placeId,
        user.id,
        JSON.stringify(review),
      ]);
      const priorReviews = Number((await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_reviews where place_id = $1 and user_id <> $2`, [placeId, user.id]))[0]?.n || 0);
      const ra = reviewAward({ placeName: review.placeName || "this place", commentLength: comment.length, hasPhoto: Boolean(photo), priorReviews });
      if (ra) await awardXp(user.id, ra.amount, ra.reason, `review:${review.id}`, ra.why);
      return json({ success: true, review });
    }
    const reviewDelete = path.match(/^\/api\/reviews\/([^/]+)$/);
    if (reviewDelete && method === "DELETE") {
      const user = await readSession(request);
      if (!user) return json({ success: false, error: "Please log in first." }, 401);
      const id = decodeURIComponent(reviewDelete[1]);
      const rows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_reviews where id = $1`, [id]);
      if (!rows[0]) return json({ success: false, error: "Review not found." }, 404);
      const payload = asObj(rows[0].payload);
      if (payload.authorEmail !== user.email && !user.isAdmin) return json({ success: false, error: "You can only delete your own review." }, 403);
      await sqlQuery(`delete from explorer_reviews where id = $1`, [id]);
      return json({ success: true });
    }
    // ---- Leaderboard: students see what the admin published; admins see it live ----
    if (path === "/api/leaderboard" && method === "GET") {
      const viewer = await readSession(request).catch(() => null);
      return json({ success: true, ...(await studentLeaderboard(viewer)) });
    }
    if (path === "/api/admin/leaderboard" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const limit = Math.min(100, Math.max(1, Math.round(num(url.searchParams.get("limit"), 10))));
      const { total, rows } = await liveRanking(limit);
      const st = await leaderboardSettings();
      const snap = st.current_snapshot ? (await sqlQuery<{ published_at: string; total: number }>(`select published_at, total from leaderboard_snapshots where id = $1`, [st.current_snapshot]))[0] : undefined;
      return json({
        success: true, total, entries: rows.map((r) => rankEntry(r)),
        published: { visible: st.visible, live: st.live, publishedAt: snap?.published_at || null, snapshotTotal: snap?.total ?? null },
        generatedAt: new Date().toISOString(),
      });
    }
    if (path === "/api/admin/leaderboard/publish" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const out = await publishLeaderboard(user.id);
      return json({ success: true, snapshotId: out.id, total: out.total, top: out.top.map((e) => publicRankEntry(e)) });
    }
    if (path === "/api/admin/leaderboard/settings" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      if (typeof b.live === "boolean") {
        if (b.live && !(await leaderboardSettings()).visible) await publishLeaderboard(user.id); // live mode must start visible
        await sqlQuery(`update leaderboard_settings set live = $1, visible = case when $1 then true else visible end, updated_at = now() where id = 1`, [b.live]);
      }
      if (b.visible === false) await sqlQuery(`update leaderboard_settings set visible = false, live = false, updated_at = now() where id = 1`);
      return json({ success: true, ...(await leaderboardSettings()) });
    }

    if (path === "/api/admin/stats" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const users = await sqlQuery<{
        id: string;
        email: string;
        name: string;
        college: string | null;
        is_admin: boolean | null;
        created: string | Date;
        last_active: string | Date | null;
      }>(
        `select u.id, u.email, u.name, p.college, p.is_admin, u."createdAt" as created, p.last_active_at as last_active
         from "user" u
         left join explorer_profiles p on p.user_id = u.id
         order by u."createdAt" desc`,
      );
      const tripCounts = await sqlQuery<{ user_id: string; n: number }>(
        `select user_id, count(*)::int as n from explorer_trips group by user_id`,
      );
      const tripMap: Record<string, number> = {};
      for (const row of tripCounts) tripMap[String(row.user_id)] = Number(row.n || 0);
      const weekAgo = Date.now() - 7 * 864e5;
      const xpRows = await sqlQuery<{ user_id: string; total: number }>(
        `select user_id, coalesce(sum(amount), 0)::int as total from student_xp_transactions group by user_id`,
      );
      const xpMap: Record<string, number> = {};
      for (const row of xpRows) xpMap[String(row.user_id)] = Number(row.total || 0);
      const badgeRows = await sqlQuery<{ user_id: string; achievement_id: string }>(
        `select user_id, achievement_id from student_achievements`,
      );
      const badgeMap: Record<string, string[]> = {};
      for (const row of badgeRows) {
        const uid = String(row.user_id);
        if (!badgeMap[uid]) badgeMap[uid] = [];
        badgeMap[uid].push(String(row.achievement_id));
      }
      const badgeIconById: Record<string, string> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a.icon]));
      const mapped = users.map((u) => {
        const ids = badgeMap[String(u.id)] || [];
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          college: u.college || "",
          isAdmin: Boolean(u.is_admin) || ADMIN_EMAILS.includes(String(u.email).toLowerCase()),
          createdAt: new Date(u.created).getTime(),
          lastActiveAt: u.last_active ? new Date(u.last_active).getTime() : new Date(u.created).getTime(),
          tripsCount: tripMap[String(u.id)] || 0,
          xp: xpMap[String(u.id)] || 0,
          badgesCount: ids.length,
          badgeIds: ids,
          badgeIcons: ids.map((id) => badgeIconById[id] || "🏅").slice(0, 8),
        };
      });
      const places = await loadPlaces();
      const tripCount = Object.values(tripMap).reduce((s, n) => s + n, 0);
      const reviewRows = await sqlQuery<{ n: number }>(`select count(*)::int as n from explorer_reviews`);
      const allTrips = await sqlQuery<{ payload: unknown }>(`select payload from explorer_trips`);
      let totalSpent = 0;
      let totalHeads = 0;
      const placeSpend: Record<string, { count: number; spent: number }> = {};
      for (const row of allTrips) {
        const t = asObj(row.payload);
        const pp = num(t.perPerson);
        const heads = Math.max(1, Math.round(num(t.numPeople, 1)));
        totalSpent += pp * heads;
        totalHeads += heads;
        const place = String(t.place || "Unknown");
        if (!placeSpend[place]) placeSpend[place] = { count: 0, spent: 0 };
        placeSpend[place].count += 1;
        placeSpend[place].spent += pp * heads;
      }
      const topPlaces = Object.entries(placeSpend)
        .map(([name, v]) => ({ name, trips: v.count, totalSpent: v.spent, avgPerTrip: v.count ? Math.round(v.spent / v.count) : 0 }))
        .sort((a, b) => b.trips - a.trips)
        .slice(0, 10);
      return json({
        success: true,
        stats: {
          totalUsers: mapped.length,
          activeThisWeek: mapped.filter((u) => u.lastActiveAt > weekAgo).length,
          totalPlaces: places.length + 6,
          communityPlaces: places.length,
          totalTrips: tripCount || allTrips.length,
          totalReviews: Number(reviewRows[0]?.n || 0),
          recommendedHotels: places.filter((p) => p.isHotel || p.recommendedByAdmin).length,
          totalSpentAllUsers: Math.round(totalSpent),
          avgSpendPerHead: totalHeads ? Math.round(totalSpent / totalHeads) : 0,
          topPlaces,
        },
        users: mapped,
      });
    }
    if (path === "/api/admin/places" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const places = await loadPlaces();
      return json({ success: true, places });
    }
    if (path === "/api/admin/analytics" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const places = await loadPlaces();
      const reviews = await sqlQuery<{ payload: unknown }>(`select payload from explorer_reviews`);
      const trips = await sqlQuery<{ payload: unknown; user_id: string }>(`select payload, user_id from explorer_trips`);
      const usersN = await sqlQuery<{ n: number }>(`select count(*)::int as n from "user"`);
      let totalSpent = 0;
      const byPlace: Record<string, { trips: number; spent: number }> = {};
      const byMode: Record<string, number> = {};
      for (const row of trips) {
        const t = asObj(row.payload);
        const pp = num(t.perPerson);
        const heads = Math.max(1, Math.round(num(t.numPeople, 1)));
        const spent = pp * heads;
        totalSpent += spent;
        const place = String(t.place || "Unknown");
        if (!byPlace[place]) byPlace[place] = { trips: 0, spent: 0 };
        byPlace[place].trips += 1;
        byPlace[place].spent += spent;
        const mode = String(t.transitMode || "other");
        byMode[mode] = (byMode[mode] || 0) + 1;
      }
      const ratingByPlace: Record<string, number[]> = {};
      for (const row of reviews) {
        const r = asObj(row.payload);
        const pid = String(r.placeId || r.placeName || "");
        if (!pid) continue;
        if (!ratingByPlace[pid]) ratingByPlace[pid] = [];
        ratingByPlace[pid].push(num(r.rating, 0));
      }
      return json({
        success: true,
        analytics: {
          users: Number(usersN[0]?.n || 0),
          communityPlaces: places.length,
          recommended: places.filter((p) => p.recommendedByAdmin || p.isHotel).length,
          tripsLogged: trips.length,
          reviews: reviews.length,
          totalSpent: Math.round(totalSpent),
          avgTripSpend: trips.length ? Math.round(totalSpent / trips.length) : 0,
          topPlaces: Object.entries(byPlace)
            .map(([name, v]) => ({ name, trips: v.trips, totalSpent: Math.round(v.spent), avg: v.trips ? Math.round(v.spent / v.trips) : 0 }))
            .sort((a, b) => b.trips - a.trips)
            .slice(0, 15),
          transitModes: Object.entries(byMode).map(([mode, count]) => ({ mode, count })).sort((a, b) => b.count - a.count),
          placeRatings: Object.entries(ratingByPlace).map(([id, arr]) => ({
            id,
            reviews: arr.length,
            avgRating: arr.length ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10 : 0,
          })),
        },
      });
    }
    if (path === "/api/admin/hotels" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      const name = clean(b.name, 80);
      let area = clean(b.area, 160);
      const address = clean(b.address, 300);
      if (!name) return json({ success: false, error: "Hotel name is required." }, 400);
      // Full address is enough when area was left blank (common admin flow after "Find on map").
      if (!area && address) {
        const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
        area = (parts.length >= 2 ? parts.slice(0, 2).join(", ") : parts[0] || address).slice(0, 160);
      }
      if (!area && !address) return json({ success: false, error: "Area or a full address is required." }, 400);
      const addressText = address || area;
      let lat = optNum(b.lat) ?? NaN;
      let lng = optNum(b.lng) ?? NaN;
      // No pin chosen by the admin: find the exact spot from the typed name + address (Google when configured, else OSM/local index).
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        let found: { lat: number; lng: number } | null = null;
        const g = googleEnabled() ? await googleFindPlace(name, addressText).catch(() => null) : null;
        if (g) found = { lat: g.lat, lng: g.lng };
        if (!found) {
          const cands = await geocodeCandidates(`${name}, ${addressText}`, 5, { near: validNear({ lat: optNum(asObj(b.origin).lat), lng: optNum(asObj(b.origin).lng) }) }).catch(() => []);
          const alt = cands.length ? cands : await geocodeCandidates(addressText, 5).catch(() => []);
          // Never silently pick the first of several different matches: ask the admin to choose.
          if (isAmbiguous(alt) && b.acceptBestMatch !== true) {
            return json({ success: false, needsSelection: true, error: "Several different places match this address. Choose the correct one (or place the pin yourself) and publish again.", candidates: alt.map(candidateOut) }, 409);
          }
          if (alt[0]) found = { lat: alt[0].lat, lng: alt[0].lng };
        }
        if (!found) found = await geocodeAddress(addressText).catch(() => null);
        if (!found) return json({ success: false, error: "Could not find that address on the map. Check the spelling, add a landmark/area, or use 'Find on map' and pick the right result." }, 400);
        lat = found.lat;
        lng = found.lng;
      }
      // Admins may publish recommendations outside the Bengaluru metro box
      // (weekend getaways, other cities). Manual lat/lng and successful geocode both allowed.
      const rawPhotos = Array.isArray(b.photos) ? b.photos : b.image ? [b.image] : [];
      const photos = rawPhotos.map((p) => validImage(p)).filter(Boolean).slice(0, 6);
      let cover = photos[0] || "";
      let hotelCredit: PhotoCredit | null = cover ? { origin: cover.startsWith("data:") ? "upload" : "preset" } : null;
      if (!cover) {
        const found = await findPlacePhoto(name, area, lat, lng).catch(() => null);
        cover = found?.image || "";
        if (cover) {
          photos.unshift(cover);
          hotelCredit = creditFrom(found!.credit);
        }
      }
      const hotelDup = await findDuplicate(name, lat, lng);
      if (hotelDup) return json({ success: false, error: `"${hotelDup.name}" is already listed near here.` }, 409);
      const minBudget = Math.max(0, Math.round(num(b.minBudget, 500)));
      const maxBudget = Math.max(minBudget, Math.round(num(b.maxBudget, minBudget + 500)));
      const place: Record<string, unknown> = {
        id: "hotel_" + Date.now() + "_" + randomBytes(3).toString("hex"),
        name,
        description: clean(b.description, 600) || "Recommended stay.",
        location: addressText,
        area,
        address: address || undefined,
        locationPrecision: b.locationPrecision === "area" ? "area" : "exact",
        category: "hotels",
        categoryLabel: "Recommended Hotels",
        famousFor: clean(b.famousFor, 200) || "Recommended stay",
        lat: Math.round(lat * 1e5) / 1e5,
        lng: Math.round(lng * 1e5) / 1e5,
        minBudget,
        maxBudget,
        budget: `₹${minBudget} – ₹${maxBudget} per person`,
        entryFee: 0,
        rating: Math.min(5, Math.max(1, num(b.rating, 4.5))),
        image: cover,
        photos,
        photoCredit: hotelCredit || undefined,
        showInHero: b.showInHero !== false && Boolean(cover),
        metro: clean(b.metro, 160) || "Check the map for the nearest stop",
        bestTime: clean(b.bestTime, 100) || "Check-in after 12 PM",
        status: b.status === "draft" ? "draft" : "published",
        studentTip: clean(b.tip, 250) || "Ask about group rates.",
        isHotel: true,
        recommendedByAdmin: true,
        addedBy: user.name,
        addedByEmail: user.email,
        addedAt: Date.now(),
      };
      const origin = asObj(b.origin);
      place.estimate = estimatePlace(place as { lat: number; lng: number }, Number.isFinite(Number(origin.lat)) ? { lat: Number(origin.lat), lng: Number(origin.lng), name: clean(origin.name, 80) } : null);
      await sqlQuery(`insert into explorer_places (id, payload, added_by) values ($1, $2::jsonb, $3)`, [place.id, JSON.stringify(place), user.id]);
      return json({ success: true, place });
    }
    // ---- Promotions: admin sets who is promoted, how strongly and until when. The public only ever sees
    //      "Sponsored", the offer text and the placement. Money (amount_paid) and notes stay admin-only. ----
    const PROMO_PLACEMENTS = ["hero", "homepage", "category_top", "discovery"];
    const cleanDate = cleanDateStr;
    const IST_TODAY = "(now() at time zone 'Asia/Kolkata')::date";
    if (path === "/api/health" && method === "GET") {
      // Used to confirm a deployment is healthy and really connected to a permanent database.
      await sqlQuery("select 1");
      return json({ success: true, database: process.env.DATABASE_URL ? "postgres" : "embedded-temporary", adminConfigured: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) });
    }
    // ---- Opening cards: admin-curated popup shown when visitors open the site. Empty = nothing is shown. ----
    const WELCOME_IST = "(now() at time zone 'Asia/Kolkata')::date";
    if (path === "/api/welcome-cards" && method === "GET") {
      const rows = await sqlQuery<Record<string, unknown>>(
        `select id, place_id, kind, headline, ends_at::text as ends_at from welcome_cards
         where active and (starts_at is null or starts_at <= ${WELCOME_IST}) and (ends_at is null or ends_at >= ${WELCOME_IST})
         order by sort_order asc, created_at asc limit 12`,
      );
      return json({ success: true, cards: rows.map((r) => ({ id: r.id, placeId: r.place_id, kind: r.kind, headline: r.headline, endsAt: r.ends_at })) });
    }
    if (path === "/api/admin/welcome-cards" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const rows = await sqlQuery<Record<string, unknown>>(
        `select id, place_id, kind, headline, sort_order, starts_at::text as starts_at, ends_at::text as ends_at, active,
           case when not active then 'paused'
                when starts_at is not null and starts_at > ${WELCOME_IST} then 'scheduled'
                when ends_at is not null and ends_at < ${WELCOME_IST} then 'expired'
                else 'showing' end as status
         from welcome_cards order by sort_order asc, created_at asc limit 100`,
      );
      return json({ success: true, cards: rows });
    }
    if (path === "/api/admin/welcome-cards" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      const placeId = clean(b.placeId, 80);
      if (!placeId) return json({ success: false, error: "Choose a place." }, 400);
      const startsAt = cleanDateStr(b.startsAt), endsAt = cleanDateStr(b.endsAt);
      if (startsAt && endsAt && endsAt < startsAt) return json({ success: false, error: "End date is before the start date." }, 400);
      const kind = b.kind === "sponsored" ? "sponsored" : "highlight";
      const id = "wc_" + randomBytes(6).toString("hex");
      const max = await sqlQuery<{ m: number }>(`select coalesce(max(sort_order), 0)::int as m from welcome_cards`);
      await sqlQuery(
        `insert into welcome_cards (id, place_id, kind, headline, sort_order, starts_at, ends_at) values ($1,$2,$3,$4,$5,$6,$7)`,
        [id, placeId, kind, clean(b.headline, 80), (max[0]?.m ?? 0) + 1, startsAt, endsAt],
      );
      return json({ success: true, id });
    }
    const adminWelcome = path.match(/^\/api\/admin\/welcome-cards\/([^/]+)$/);
    if (adminWelcome && (method === "DELETE" || method === "PATCH")) {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const cardId = decodeURIComponent(adminWelcome[1]);
      if (method === "DELETE") {
        await sqlQuery(`delete from welcome_cards where id = $1`, [cardId]);
        return json({ success: true });
      }
      const b = asObj(await request.json().catch(() => ({})));
      if (b.move === "up" || b.move === "down") {
        const all = await sqlQuery<{ id: string }>(`select id from welcome_cards order by sort_order asc, created_at asc`);
        const i = all.findIndex((x) => x.id === cardId), j = b.move === "up" ? i - 1 : i + 1;
        if (i >= 0 && j >= 0 && j < all.length) {
          const order = all.map((x) => x.id);
          [order[i], order[j]] = [order[j], order[i]];
          for (let k = 0; k < order.length; k++) await sqlQuery(`update welcome_cards set sort_order = $2 where id = $1`, [order[k], k + 1]);
        }
        return json({ success: true });
      }
      if (typeof b.active === "boolean") {
        await sqlQuery(`update welcome_cards set active = $2 where id = $1`, [cardId, b.active]);
        return json({ success: true });
      }
      return json({ success: false, error: "Nothing to change." }, 400);
    }

    if (path === "/api/promotions/active" && method === "GET") {
      const rows = await sqlQuery<Record<string, unknown>>(
        `select place_id, tier, priority, placements, offer_text, ends_at::text as ends_at from place_promotions
         where active and (starts_at is null or starts_at <= ${IST_TODAY}) and (ends_at is null or ends_at >= ${IST_TODAY})
         order by priority desc limit 100`,
      );
      return json({ success: true, today: istToday(), promotions: rows.map((r) => ({ placeId: r.place_id, tier: r.tier, priority: r.priority, placements: String(r.placements || "").split(",").filter(Boolean), offerText: r.offer_text, endsAt: r.ends_at })) });
    }
    if (path === "/api/track" && method === "POST") {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
      if (!allowRequest("track:" + ip, 600, 60_000)) return json({ success: true });
      const b = asObj(await request.json().catch(() => ({})));
      const events = Array.isArray(b.events) ? b.events.slice(0, 40) : [];
      for (const ev of events) {
        const e = asObj(ev);
        const placeId = clean(e.placeId, 80);
        const col = e.kind === "views" ? "views" : e.kind === "opens" ? "opens" : e.kind === "directions" ? "directions" : "";
        if (!placeId || !col) continue;
        await sqlQuery(
          `insert into place_stats (place_id, day, ${col}) values ($1, ${IST_TODAY}, 1)
           on conflict (place_id, day) do update set ${col} = place_stats.${col} + 1`,
          [placeId],
        );
      }
      return json({ success: true });
    }
    if (path === "/api/admin/promotions" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const rows = await sqlQuery<Record<string, unknown>>(
        `select p.*,
           case when not p.active then 'paused'
                when p.starts_at is not null and p.starts_at > ${IST_TODAY} then 'scheduled'
                when p.ends_at is not null and p.ends_at < ${IST_TODAY} then 'expired'
                else 'active' end as status,
           coalesce((select sum(views) from place_stats s where s.place_id = p.place_id and s.day >= current_date - 30), 0)::int as views30,
           coalesce((select sum(opens) from place_stats s where s.place_id = p.place_id and s.day >= current_date - 30), 0)::int as opens30,
           coalesce((select sum(directions) from place_stats s where s.place_id = p.place_id and s.day >= current_date - 30), 0)::int as directions30,
           coalesce((select sum(views) from place_stats s where s.place_id = p.place_id and s.day between coalesce(p.starts_at, p.created_at::date) and coalesce(p.ends_at, current_date)), 0)::int as views_promo,
           coalesce((select sum(opens) from place_stats s where s.place_id = p.place_id and s.day between coalesce(p.starts_at, p.created_at::date) and coalesce(p.ends_at, current_date)), 0)::int as opens_promo,
           coalesce((select sum(directions) from place_stats s where s.place_id = p.place_id and s.day between coalesce(p.starts_at, p.created_at::date) and coalesce(p.ends_at, current_date)), 0)::int as directions_promo
         from place_promotions p order by (case when p.active and (p.ends_at is null or p.ends_at >= ${IST_TODAY}) then 0 else 1 end), p.priority desc, p.created_at desc limit 300`,
      );
      return json({ success: true, promotions: rows });
    }
    if (path === "/api/admin/promotions" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      const placeId = clean(b.placeId, 80);
      if (!placeId) return json({ success: false, error: "Choose a place." }, 400);
      const tier = ["featured", "monthly", "premium", "custom"].includes(String(b.tier)) ? String(b.tier) : "custom";
      const priority = Math.max(0, Math.min(100, Math.round(num(b.priority, 50))));
      const placements = (Array.isArray(b.placements) ? b.placements : []).map(String).filter((x) => PROMO_PLACEMENTS.includes(x)).join(",");
      const startsAt = cleanDate(b.startsAt), endsAt = cleanDate(b.endsAt);
      if (startsAt && endsAt && endsAt < startsAt) return json({ success: false, error: "End date is before the start date." }, 400);
      const vals = [placeId, tier, priority, placements, clean(b.offerText, 80), startsAt, endsAt, Math.max(0, Math.round(num(b.amountPaid, 0))), clean(b.notes, 500), b.active === false ? false : true];
      const existing = clean(b.id, 40);
      if (existing) {
        const r = await sqlQuery(
          `update place_promotions set place_id=$2, tier=$3, priority=$4, placements=$5, offer_text=$6, starts_at=$7, ends_at=$8, amount_paid=$9, notes=$10, active=$11, updated_at=now() where id=$1 returning id`,
          [existing, ...vals],
        );
        if (!r.length) return json({ success: false, error: "Promotion not found." }, 404);
        return json({ success: true, id: existing });
      }
      const id = "promo_" + randomBytes(6).toString("hex");
      await sqlQuery(
        `insert into place_promotions (id, place_id, tier, priority, placements, offer_text, starts_at, ends_at, amount_paid, notes, active) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, ...vals],
      );
      return json({ success: true, id });
    }
    const adminPromo = path.match(/^\/api\/admin\/promotions\/([^/]+)$/);
    if (adminPromo && method === "DELETE") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      await sqlQuery(`delete from place_promotions where id = $1`, [decodeURIComponent(adminPromo[1])]);
      return json({ success: true });
    }

    // ---- Feedback box: anyone may send (login optional); ONLY admins can read, update or delete. ----
    if (path === "/api/feedback" && method === "POST") {
      const user = await readSession(request);
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
      if (!allowRequest("feedback:" + (user?.id || ip), user ? 5 : 40, 10 * 60_000)) return json({ success: false, error: "You have sent a lot of feedback just now. Please try again in a few minutes." }, 429);
      const b = asObj(await request.json().catch(() => ({})));
      const message = clean(b.message, 2000);
      if (message.length < 5) return json({ success: false, error: "Please write at least a few words so we can understand." }, 400);
      const kind = ["bug", "idea", "place", "praise", "other"].includes(String(b.kind)) ? String(b.kind) : "idea";
      const ratingRaw = Math.round(num(b.rating, 0));
      const rating = ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
      let photo: string | null = null;
      if (typeof b.photo === "string" && b.photo) {
        if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.photo)) return json({ success: false, error: "The photo must be a JPG, PNG or WebP image." }, 400);
        if (b.photo.length > 1_400_000) return json({ success: false, error: "That photo is too large. Please choose a smaller one." }, 413);
        photo = b.photo;
      }
      const contact = clean(b.contactEmail, 120);
      const id = "fb_" + randomBytes(8).toString("hex");
      await sqlQuery(
        `insert into site_feedback (id, user_id, user_email, user_name, contact_email, kind, rating, message, photo, page_url, user_agent)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [id, user?.id ?? null, user?.email ?? "", user?.name ?? "", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : "", kind, rating, message, photo, clean(b.pageUrl, 300), clean(request.headers.get("user-agent"), 200)],
      );
      return json({ success: true, id });
    }
    if (path === "/api/admin/feedback" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const status = clean(url.searchParams.get("status"), 12);
      if (url.searchParams.get("countOnly")) {
        const c = await sqlQuery<{ status: string; n: number }>(`select status, count(*)::int as n from site_feedback group by status`);
        return json({ success: true, counts: Object.fromEntries(c.map((x) => [x.status, x.n])) });
      }
      const rows = await sqlQuery<Record<string, unknown>>(
        `select id, user_email, user_name, contact_email, kind, rating, message, photo, page_url, user_agent, status, created_at
         from site_feedback ${["new", "reviewed", "done"].includes(status) ? "where status = $1" : "where $1::text = $1::text"}
         order by case when status = 'new' then 0 when status = 'reviewed' then 1 else 2 end, created_at desc limit 300`,
        [["new", "reviewed", "done"].includes(status) ? status : ""],
      );
      const counts = await sqlQuery<{ status: string; n: number }>(`select status, count(*)::int as n from site_feedback group by status`);
      return json({ success: true, feedback: rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) });
    }
    const adminFeedback = path.match(/^\/api\/admin\/feedback\/([^/]+)$/);
    if (adminFeedback && (method === "PATCH" || method === "DELETE")) {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const fbId = decodeURIComponent(adminFeedback[1]);
      if (method === "DELETE") {
        await sqlQuery(`delete from site_feedback where id = $1`, [fbId]);
        return json({ success: true });
      }
      const b = asObj(await request.json().catch(() => ({})));
      const status = clean(b.status, 12);
      if (!["new", "reviewed", "done"].includes(status)) return json({ success: false, error: "Invalid status." }, 400);
      const rows = await sqlQuery(`update site_feedback set status = $2, updated_at = now() where id = $1 returning id`, [fbId, status]);
      if (!rows.length) return json({ success: false, error: "Feedback not found." }, 404);
      return json({ success: true });
    }
    if (path === "/api/admin/place-reports" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const reports = await sqlQuery<Record<string, unknown>>(
        `select r.*, p.payload->>'name' as place_name, p.payload->>'lat' as place_lat, p.payload->>'lng' as place_lng
         from explorer_place_reports r
         left join explorer_places p on p.id = r.place_id
         order by case when r.status = 'pending' then 0 else 1 end, r.created_at desc
         limit 200`,
      );
      return json({ success: true, reports });
    }
    const adminReport = path.match(/^\/api\/admin\/place-reports\/([^/]+)$/);
    if (adminReport && method === "PATCH") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      const status = clean(b.status, 20) || (b.applyPin ? "resolved" : "");
      if (!["resolved", "dismissed", "pending"].includes(status)) return json({ success: false, error: "Invalid report status." }, 400);
      const reportId = decodeURIComponent(adminReport[1]);
      if (b.applyPin === true) {
        const rep = await sqlQuery<{ place_id: string; suggested_lat: number | null; suggested_lng: number | null; reporter_user_id: string | null; reporter_lat: number | null; reporter_lng: number | null }>(
          `select place_id, suggested_lat, suggested_lng, reporter_user_id, reporter_lat, reporter_lng from explorer_place_reports where id = $1`, [reportId]);
        if (!rep[0]) return json({ success: false, error: "Report not found." }, 404);
        const lat = rep[0].suggested_lat ?? rep[0].reporter_lat, lng = rep[0].suggested_lng ?? rep[0].reporter_lng;
        if (lat == null || lng == null || !validCoords(Number(lat), Number(lng))) return json({ success: false, error: "This report has no coordinates to apply." }, 400);
        const row = await sqlQuery<{ payload: unknown }>(`select payload from explorer_places where id = $1`, [rep[0].place_id]);
        if (!row[0]) return json({ success: false, error: "Built-in showcase places are edited in the app code, not here. Ask the developer to update this pin." }, 400);
        const p = asObj(row[0].payload);
        p.lat = Math.round(Number(lat) * 1e5) / 1e5; p.lng = Math.round(Number(lng) * 1e5) / 1e5;
        p.locationPrecision = "exact"; p.verifiedPin = true;
        await sqlQuery(`update explorer_places set payload = $2::jsonb where id = $1`, [rep[0].place_id, JSON.stringify({ ...p, id: rep[0].place_id })]);
        if (rep[0].reporter_user_id) await awardXp(rep[0].reporter_user_id, 20, "Map pin corrected", `pin-fix:${reportId}`, "Your wrong-pin report was checked and the place now has the right pin.");
      }
      const rows = await sqlQuery(
        `update explorer_place_reports set status = $2, updated_at = now() where id = $1 returning id`,
        [reportId, status],
      );
      if (!rows.length) return json({ success: false, error: "Report not found." }, 404);
      return json({ success: true });
    }
    if (path === "/api/admin/places/merge" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      const sourceId = clean(b.sourceId, 120);
      const targetId = clean(b.targetId, 120);
      if (!sourceId || !targetId || sourceId === targetId) return json({ success: false, error: "Choose two different place IDs." }, 400);
      const [sourceRows, targetRows] = await Promise.all([
        sqlQuery<{ payload: unknown }>(`select payload from explorer_places where id = $1 limit 1`, [sourceId]),
        sqlQuery<{ payload: unknown }>(`select payload from explorer_places where id = $1 limit 1`, [targetId]),
      ]);
      if (!sourceRows[0] || !targetRows[0]) return json({ success: false, error: "Both source and target places must exist." }, 404);
      const source = asObj(sourceRows[0].payload);
      const target = asObj(targetRows[0].payload);
      const sourcePhotos = Array.isArray(source.photos) ? source.photos as string[] : [];
      const targetPhotos = Array.isArray(target.photos) ? target.photos as string[] : [];
      const mergedPhotos = [...new Set([...(target.image ? [String(target.image)] : []), ...targetPhotos, ...(source.image ? [String(source.image)] : []), ...sourcePhotos].filter(Boolean))].slice(0, 8);
      const merged = {
        ...source,
        ...target,
        photos: mergedPhotos,
        image: target.image || source.image || mergedPhotos[0] || "",
        photoSubmissions: [
          ...(Array.isArray(target.photoSubmissions) ? target.photoSubmissions : []),
          ...(Array.isArray(source.photoSubmissions) ? source.photoSubmissions : []),
        ],
        mergedFrom: [...new Set([...(Array.isArray(target.mergedFrom) ? target.mergedFrom : []), sourceId, ...(Array.isArray(source.mergedFrom) ? source.mergedFrom : [])])],
        id: targetId,
      };
      await sqlQuery(`update explorer_places set payload = $2::jsonb where id = $1`, [targetId, JSON.stringify(merged)]);
      await sqlQuery(`update explorer_reviews set place_id = $2 where place_id = $1`, [sourceId, targetId]);
      await sqlQuery(
        `update explorer_trips set payload = jsonb_set(payload, '{placeId}', to_jsonb($2::text), true)
         where payload->>'placeId' = $1`,
        [sourceId, targetId],
      );
      if (source.name && target.name) {
        await sqlQuery(
          `update explorer_trips set payload = jsonb_set(payload, '{place}', to_jsonb($2::text), true)
           where payload->>'place' = $1`,
          [String(source.name), String(target.name)],
        );
      }
      await sqlQuery(`update explorer_place_reports set place_id = $2 where place_id = $1`, [sourceId, targetId]);
      await sqlQuery(`delete from explorer_places where id = $1`, [sourceId]);
      return json({ success: true, place: { ...merged, id: targetId } });
    }

    // ---- Moderation: approve / reject / unpublish / publish (admins only) ----
    const adminStatus = path.match(/^\/api\/admin\/places\/([^/]+)\/status$/);
    if (adminStatus && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      const status = clean(b.status, 20);
      if (!["published", "pending", "draft", "rejected", "unpublished"].includes(status)) return json({ success: false, error: "Status must be published, pending, draft, rejected or unpublished." }, 400);
      const id = decodeURIComponent(adminStatus[1]);
      const rows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_places where id = $1`, [id]);
      if (!rows.length) return json({ success: false, error: "Place not found." }, 404);
      const payload = { ...asObj(rows[0].payload), status, statusChangedAt: Date.now(), statusChangedBy: user.email };
      await sqlQuery(`update explorer_places set payload = $2::jsonb where id = $1`, [id, JSON.stringify(payload)]);
      return json({ success: true, id, status });
    }

    // ---- Weekly Student Picks scheduling (admins only) ----
    if (path === "/api/admin/featured" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const rows = await sqlQuery<Record<string, unknown>>(`select id, place_id, starts_on::text as starts_on, ends_on::text as ends_on, position, note from explorer_featured_picks order by starts_on desc, position asc limit 200`);
      const places = await loadPlaces();
      return json({ success: true, picks: rows.map((r) => ({ ...r, placeName: places.find((p) => String(p.id) === String(r.place_id))?.name || "(deleted place)" })) });
    }
    if (path === "/api/admin/featured" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      const placeId = clean(b.placeId, 120);
      const startsOn = clean(b.startsOn, 10);
      const endsOn = clean(b.endsOn, 10);
      const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
      if (!placeId) return json({ success: false, error: "Choose a place." }, 400);
      if (!isDate(startsOn) || !isDate(endsOn)) return json({ success: false, error: "Start and end dates are required (YYYY-MM-DD)." }, 400);
      if (endsOn < startsOn) return json({ success: false, error: "The end date must be on or after the start date." }, 400);
      const place = (await loadPlaces()).find((p) => String(p.id) === placeId);
      if (!place) return json({ success: false, error: "That place does not exist." }, 404);
      if (placeStatus(place) !== "published") return json({ success: false, error: "Only published places can be featured. Publish it first." }, 400);
      const position = Math.max(0, Math.min(999, Math.round(num(b.position, 0))));
      const id = "feat_" + randomBytes(8).toString("hex");
      try {
        await sqlQuery(`insert into explorer_featured_picks (id, place_id, starts_on, ends_on, position, note, created_by) values ($1,$2,$3::date,$4::date,$5,$6,$7)`, [id, placeId, startsOn, endsOn, position, clean(b.note, 200), user.id]);
      } catch {
        return json({ success: false, error: "This place is already scheduled to start on that date." }, 409);
      }
      return json({ success: true, id });
    }
    const featuredItem = path.match(/^\/api\/admin\/featured\/([^/]+)$/);
    if (featuredItem && (method === "DELETE" || method === "PATCH")) {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const id = decodeURIComponent(featuredItem[1]);
      if (method === "DELETE") {
        await sqlQuery(`delete from explorer_featured_picks where id = $1`, [id]);
        return json({ success: true });
      }
      const b = asObj(await request.json().catch(() => ({})));
      const position = Math.max(0, Math.min(999, Math.round(num(b.position, 0))));
      const rows = await sqlQuery<{ id: string }>(`update explorer_featured_picks set position = $2 where id = $1 returning id`, [id, position]);
      return rows.length ? json({ success: true }) : json({ success: false, error: "Not found." }, 404);
    }

    const adminPlace = path.match(/^\/api\/admin\/places\/([^/]+)$/);
    if (adminPlace && (method === "PATCH" || method === "DELETE")) {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const id = decodeURIComponent(adminPlace[1]);
      if (method === "DELETE") {
        const gone = await sqlQuery(`delete from explorer_places where id = $1 returning id`, [id]);
        if (!gone.length) return json({ success: false, error: "Not found" }, 404);
        return json({ success: true });
      }
      const rows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_places where id = $1`, [id]);
      if (!rows[0]) return json({ success: false, error: "Place not found" }, 404);
      const p = asObj(rows[0].payload);
      const b = asObj(await request.json().catch(() => ({})));
      if (b.name != null) p.name = clean(b.name, 80);
      if (b.description != null) p.description = clean(b.description, 600);
      if (b.area != null) p.location = clean(b.area, 160);
      if (b.famousFor != null) p.famousFor = clean(b.famousFor, 200);
      if (b.minBudget != null) p.minBudget = Math.max(0, Math.round(num(b.minBudget)));
      if (b.maxBudget != null) p.maxBudget = Math.max(num(p.minBudget), Math.round(num(b.maxBudget)));
      if (b.entryFee != null) p.entryFee = Math.max(0, Math.round(num(b.entryFee)));
      if (b.rating != null) p.rating = Math.min(5, Math.max(1, num(b.rating)));
      if (b.metro != null) p.metro = clean(b.metro, 160);
      if (b.bestTime != null) p.bestTime = clean(b.bestTime, 100);
      if (b.tip != null) p.studentTip = clean(b.tip, 250);
      if (b.recommendedByAdmin != null) p.recommendedByAdmin = !!b.recommendedByAdmin;
      if (b.isHotel != null) p.isHotel = !!b.isHotel;
      if (b.showInHero != null) p.showInHero = !!b.showInHero;
      if (b.featuredUntil !== undefined) p.featuredUntil = cleanDateStr(b.featuredUntil) || "";
      if (b.hiddenGem != null) p.hiddenGem = !!b.hiddenGem;
      if (b.image != null) {
        const img = validImage(b.image);
        if (img) {
          p.photoCredit = img.startsWith("https://") && lookupPhotoByUrl(img) ? creditFrom(lookupPhotoByUrl(img) as PhotoCandidate) : { origin: img.startsWith("data:") ? "upload" : "preset" };
          p.image = img; p.photos = [img, ...((Array.isArray(p.photos) ? p.photos : []) as string[]).filter((x) => x !== img)].slice(0, 6); }
      }
      if (b.category != null && clean(b.category, 40)) p.category = clean(b.category, 40);
      if (b.photoAction != null) {
        const act = asObj(b.photoAction);
        const type = clean(act.type, 12);
        const subs = (Array.isArray(p.photoSubmissions) ? p.photoSubmissions : []) as Record<string, unknown>[];
        const subId = clean(act.id, 40);
        const target = subs.find((x) => x.id === subId);
        const photoUrl = target ? String(target.url) : clean(act.url, 3_500_000);
        const gallery = ((Array.isArray(p.photos) ? p.photos : []) as string[]).filter(Boolean);
        if (!photoUrl) return json({ success: false, error: "Choose a photo first." }, 400);
        if (type === "main") {
          p.image = photoUrl;
          p.photos = [photoUrl, ...gallery.filter((x) => x !== photoUrl)].slice(0, 8);
          const known = photoUrl.startsWith("https://") ? lookupPhotoByUrl(photoUrl) : undefined;
          if (target) p.photoCredit = { origin: "upload" };
          else if (known) p.photoCredit = creditFrom(known);
          if (target) target.status = "approved";
        } else if (type === "gallery") {
          if (!gallery.includes(photoUrl)) p.photos = [...gallery, photoUrl].slice(0, 8);
          if (target) target.status = "approved";
        } else if (type === "delete") {
          p.photos = gallery.filter((x) => x !== photoUrl);
          if (p.image === photoUrl) {
            p.image = (p.photos as string[])[0] || "";
            if (!p.image) delete p.photoCredit;
          }
          p.photoSubmissions = subs.filter((x) => x.url !== photoUrl && x.id !== subId);
        } else {
          return json({ success: false, error: "Unknown photo action." }, 400);
        }
        if (type !== "delete") p.photoSubmissions = subs;
        if ((type === "main" || type === "gallery") && target && target.email) {
          const ownerRows = await sqlQuery<{ id: string }>(`select id from "user" where lower(email) = lower($1) limit 1`, [String(target.email)]);
          if (ownerRows[0]) await awardPhotoXp(ownerRows[0].id, id, String(p.name || ""), `photo:${subId}`);
        }
      }
      if (validCoords(optNum(b.lat), optNum(b.lng))) {
        const correctedLat = Math.round(optNum(b.lat)! * 1e5) / 1e5;
        const correctedLng = Math.round(optNum(b.lng)! * 1e5) / 1e5;
        const pinChanged = Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) && (Math.abs(Number(p.lat) - correctedLat) > 0.00005 || Math.abs(Number(p.lng) - correctedLng) > 0.00005);
        p.lat = correctedLat;
        p.lng = correctedLng;
        if (pinChanged && p.addedByEmail) {
          const contributor = await sqlQuery<{ id: string }>(`select id from "user" where lower(email) = lower($1) limit 1`, [String(p.addedByEmail)]);
          if (contributor[0]) await awardXp(contributor[0].id, 20, "Admin-verified destination location correction", `location-correction:${id}:${correctedLat}:${correctedLng}`, "The admin confirmed your corrected map pin.");
        }
      }
      p.budget = `₹${p.minBudget} – ₹${p.maxBudget} per person`;
      p.estimate = estimatePlace(p as { lat: number; lng: number; minBudget: number; maxBudget: number; entryFee: number }, null);
      if (b.name != null || b.area != null) p.mapQuery = `${p.name}, ${p.location}`;
      await sqlQuery(`update explorer_places set payload = $2::jsonb where id = $1`, [id, JSON.stringify({ ...p, id })]);
      const { photoSubmissions: _subs, ...placeOut } = p as Record<string, unknown>;
      return json({ success: true, place: { ...placeOut, id } });
    }
    if (path === "/api/admin/reviews" && method === "GET") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const rows = await sqlQuery<{ id: string; place_id: string; payload: unknown; created_at: string | Date }>(
        `select id, place_id, payload, created_at from explorer_reviews order by created_at desc`,
      );
      const reviews = rows.map((row) => {
        const p = asObj(row.payload);
        return {
          ...p,
          id: String(p.id || row.id),
          placeId: String(p.placeId || row.place_id || ""),
          placeName: String(p.placeName || p.placeId || row.place_id || "—"),
          comment: String(p.comment || ""),
          rating: num(p.rating, 0) || null,
          authorName: String(p.authorName || "Student"),
          authorEmail: String(p.authorEmail || ""),
          costSpent: num(p.costSpent, 0),
          isSample: Boolean(p.isSample),
          createdAt: p.createdAt || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
        };
      });
      return json({ success: true, reviews, total: reviews.length });
    }
    if (path === "/api/admin/sample-comments" && method === "POST") {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const b = asObj(await request.json().catch(() => ({})));
      if (b.seedAll === true) {
        let added = 0;
        for (const sample of SAMPLE_COMMENTS) {
          const exists = await sqlQuery<{ id: string }>(
            `select id from explorer_reviews where place_id = $1 and payload->>'isSample' = 'true' limit 1`,
            [sample.placeId],
          );
          if (exists.length) continue;
          const review = {
            id: "sample_" + sample.placeId,
            ...sample,
            authorName: "Explorer Desk",
            authorEmail: user.email,
            college: "",
            isSample: true,
            createdAt: Date.now(),
          };
          await sqlQuery(
            `insert into explorer_reviews (id, place_id, user_id, payload) values ($1, $2, $3, $4::jsonb)
             on conflict (id) do nothing`,
            [review.id, sample.placeId, user.id, JSON.stringify(review)],
          );
          added += 1;
        }
        return json({ success: true, added });
      }
      const placeId = clean(b.placeId, 80);
      const comment = clean(b.comment, 800);
      if (!placeId || !comment) return json({ success: false, error: "Pick a place and write the sample comment." }, 400);
      const review = {
        id: "sample_" + Date.now() + "_" + randomBytes(2).toString("hex"),
        placeId,
        placeName: clean(b.placeName, 100),
        rating: Math.min(5, Math.max(1, num(b.rating, 4.5))),
        costSpent: Math.max(0, Math.round(num(b.costSpent))),
        highlight: clean(b.highlight, 160),
        comment,
        authorName: "Explorer Desk",
        authorEmail: user.email,
        college: "",
        isSample: true,
        createdAt: Date.now(),
      };
      await sqlQuery(`insert into explorer_reviews (id, place_id, user_id, payload) values ($1, $2, $3, $4::jsonb)`, [
        review.id,
        placeId,
        user.id,
        JSON.stringify(review),
      ]);
      return json({ success: true, review });
    }
    const adminReview = path.match(/^\/api\/admin\/reviews\/([^/]+)$/);
    if (adminReview && (method === "PATCH" || method === "DELETE")) {
      const user = await readSession(request);
      if (!user?.isAdmin) return json({ success: false, error: "Admin access only." }, user ? 403 : 401);
      const id = decodeURIComponent(adminReview[1]);
      if (method === "DELETE") {
        const gone = await sqlQuery(`delete from explorer_reviews where id = $1 returning id`, [id]);
        if (!gone.length) return json({ success: false, error: "Review not found." }, 404);
        return json({ success: true });
      }
      const rows = await sqlQuery<{ payload: unknown }>(`select payload from explorer_reviews where id = $1`, [id]);
      if (!rows[0]) return json({ success: false, error: "Review not found." }, 404);
      const r = asObj(rows[0].payload);
      const b = asObj(await request.json().catch(() => ({})));
      if (b.comment != null) r.comment = clean(b.comment, 800);
      if (b.rating != null) r.rating = Math.min(5, Math.max(1, num(b.rating)));
      if (b.highlight != null) r.highlight = clean(b.highlight, 160);
      if (b.costSpent != null) r.costSpent = Math.max(0, Math.round(num(b.costSpent)));
      r.editedByAdmin = true;
      r.editedAt = Date.now();
      await sqlQuery(`update explorer_reviews set payload = $2::jsonb where id = $1`, [id, JSON.stringify({ ...r, id })]);
      return json({ success: true, review: { ...r, id } });
    }
    return json({ success: false, error: "Not found" }, 404);
  } catch (error) {
    console.error("[explorer]", error);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
}
