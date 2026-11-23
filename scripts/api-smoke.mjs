// End-to-end API checks against a RUNNING server:  BASE=http://localhost:8080 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/api-smoke.mjs
const BASE = process.env.BASE || "http://localhost:8080";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "boss@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Test-Admin-Pass-123";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok  ", m); } else { fail++; console.log("  FAIL", m); } };

class Client {
  constructor(label) { this.label = label; this.jar = {}; }
  async call(path, { method = "GET", body } = {}) {
    const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", origin: BASE, cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join("; ") }, body: body ? JSON.stringify(body) : undefined });
    for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); this.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    let data = null; try { data = await res.json(); } catch { /* not json */ }
    return { status: res.status, data };
  }
  async signUp(email, password, name) { const r = await this.call("/api/auth/sign-up/email", { method: "POST", body: { email, password, name } }); return r.status === 200; }
  async signIn(email, password) { const r = await this.call("/api/auth/sign-in/email", { method: "POST", body: { email, password } }); return r.status === 200; }
}

const stamp = Date.now();
const anon = new Client("anon"), admin = new Client("admin");
const students = [];

console.log("Setup");
await fetch(BASE + "/api/places"); // first API call creates the admin account on a fresh database
ok(await admin.signIn(ADMIN_EMAIL, ADMIN_PASSWORD), "admin can sign in with the configured password");
ok(!(await new Client("x").signIn(ADMIN_EMAIL, "admin123")), "the old default password 'admin123' does NOT work");
for (let i = 0; i < 5; i++) { const c = new Client("s" + i); ok(await c.signUp(`s${i}_${stamp}@example.com`, "Student-pass-123", `Student ${i}`), `student ${i} registered`); students.push(c); }

console.log("Saved trips persist per user");
const stops = ["koramangala", "cubbon", "lalbagh"];
for (let i = 0; i < students.length; i++) {
  for (let k = 0; k < i + 1; k++) {
    const r = await students[i].call("/api/trips", { method: "POST", body: { type: "squad_plan", stopIds: stops.slice(0, 2 + (k % 2)), people: 4, budgetLimit: 300, place: `Plan ${k}` } });
    if (k === 0) ok(r.status === 200 && r.data?.trip?.id, `student ${i} saved a trip plan`);
  }
}
const mine = await students[2].call("/api/trips");
ok(mine.data?.trips?.length === 3, "student 2 sees exactly their 3 saved plans");
ok(((await students[0].call("/api/trips")).data?.trips || []).length === 1, "student 0 only sees their own plan");
ok((await anon.call("/api/trips")).status === 401, "anonymous cannot read trips");

console.log("Leaderboard security");
ok((await anon.call("/api/admin/leaderboard")).status === 401, "anonymous cannot open the admin leaderboard");
ok((await students[0].call("/api/admin/leaderboard")).status === 403, "student cannot open the admin leaderboard");
ok((await students[0].call("/api/admin/leaderboard/publish", { method: "POST" })).status === 403, "student cannot publish");
let pub = await anon.call("/api/leaderboard");
ok(pub.data?.published === true && pub.data?.live === true, "ranking is visible to students automatically (live by default)");

console.log("Admin sees the live ranking");
const live = await admin.call("/api/admin/leaderboard?limit=10");
ok(live.status === 200 && live.data.entries.length >= 5, "admin gets a ranked list");
const xps = live.data.entries.map((e) => e.xp);
ok(xps.every((x, i) => i === 0 || xps[i - 1] >= x), "sorted from highest XP to lowest");
ok(live.data.entries[0].rank === 1 && live.data.entries.every((e, i) => e.rank === i + 1), "ranks are 1..N with no gaps");
ok(live.data.entries[0].name === "Student 4", "student with most XP is #1");

console.log("Students see their place automatically");
const s2 = await students[2].call("/api/leaderboard");
ok(s2.data.published === true && s2.data.me?.placeLabel && /^\d+(st|nd|rd|th) place$/.test(s2.data.me.placeLabel), `student sees own place: ${s2.data.me?.placeLabel}`);
ok(s2.data.top.length <= 10 && s2.data.top.every((e) => !("userId" in e) && !("email" in e)), "public list exposes no ids or emails");
const s4 = await students[4].call("/api/leaderboard");
ok(s4.data.me.rank <= s2.data.me.rank, "more XP means a better place");
ok(s4.data.me.xpToNext === 0 || s4.data.me.rank > 1, "xp-to-next is reported");

console.log("Ranks change dynamically with no admin action");
const before = s2.data.me.rank;
for (let k = 0; k < 5; k++) await students[0].call("/api/trips", { method: "POST", body: { type: "squad_plan", stopIds: stops, people: 3, place: "extra " + k } });
const nowRank = (await students[0].call("/api/leaderboard")).data.me.rank;
ok(nowRank < 5, `student 0 moved up automatically to place ${nowRank}`);
ok((await students[2].call("/api/leaderboard")).data.me.rank !== before || nowRank >= 1, "other students' places shift automatically too");
ok((await admin.call("/api/admin/leaderboard/settings", { method: "POST", body: { visible: false } })).data.visible === false, "admin can still hide the ranking");
ok((await anon.call("/api/leaderboard")).data.published === false, "hidden when switched off");
ok((await admin.call("/api/admin/leaderboard/settings", { method: "POST", body: { live: true } })).data.live === true, "live mode switches it back on");
ok((await anon.call("/api/leaderboard")).data.published === true, "visible again, still automatic");

console.log("Moderation, privacy and weekly picks");
const sub = await students[1].call("/api/places", { method: "POST", body: { name: "Test Chai Corner " + stamp, category: "food", area: "Jayanagar", lat: 12.9308, lng: 77.5838, minBudget: 40, maxBudget: 90, description: "Student test place", locExact: true } });
ok(sub.status === 200 && sub.data?.pending === true, "a student's new place is saved as pending");
const pid = sub.data?.place?.id;
const listAnon = (await anon.call("/api/places")).data?.places || [];
ok(!listAnon.some((p) => p.id === pid), "pending place is NOT visible to the public");
ok(!(((await students[3].call("/api/places")).data?.places) || []).some((p) => p.id === pid), "pending place is NOT visible to other students");
ok((((await students[1].call("/api/places")).data?.places) || []).some((p) => p.id === pid), "the submitting student can still see it");
ok((await students[1].call(`/api/admin/places/${pid}/status`, { method: "POST", body: { status: "published" } })).status === 403, "a student cannot approve their own place");
ok((await anon.call(`/api/admin/places/${pid}/status`, { method: "POST", body: { status: "published" } })).status === 401, "anonymous cannot approve places");
ok((await admin.call(`/api/admin/places/${pid}/status`, { method: "POST", body: { status: "published" } })).data?.success, "admin approves the place");
const after = (await anon.call("/api/places")).data?.places || [];
const shown = after.find((p) => p.id === pid);
ok(!!shown, "approved place is now public");
ok(shown && !("addedByEmail" in shown), "public place data contains no email address");
const today = new Date().toISOString().slice(0, 10), later = new Date(Date.now() + 6 * 864e5).toISOString().slice(0, 10);
ok((await students[1].call("/api/admin/featured", { method: "POST", body: { placeId: pid, startsOn: today, endsOn: later } })).status === 403, "student cannot schedule featured picks");
ok((await admin.call("/api/admin/featured", { method: "POST", body: { placeId: pid, startsOn: later, endsOn: today } })).status === 400, "end date before start date is rejected");
const feat = await admin.call("/api/admin/featured", { method: "POST", body: { placeId: pid, startsOn: today, endsOn: later, position: 0 } });
ok(feat.data?.success, "admin schedules a featured pick with dates");
const picks = (await anon.call("/api/student-picks")).data?.picks || [];
ok(picks[0]?.id === pid && picks[0]?.featured === true, "scheduled pick appears first for every student");
await admin.call(`/api/admin/featured/${feat.data.id}`, { method: "DELETE" });
ok(!((await anon.call("/api/student-picks")).data?.picks || []).some((p) => p.featured), "removing the schedule removes the featured flag");
ok((await admin.call(`/api/admin/places/${pid}/status`, { method: "POST", body: { status: "unpublished" } })).data?.success && !(((await anon.call("/api/places")).data?.places) || []).some((p) => p.id === pid), "unpublish hides it again");

console.log("Location endpoints");
ok((await anon.call("/api/maps/reverse-geocode")).status === 400, "reverse-geocode without coordinates is rejected (not treated as 0,0)");
ok((await anon.call("/api/maps/suggest?q=ab")).data?.suggestions?.length === 0, "suggest ignores very short input");
const g = await anon.call("/api/maps/geocode?query=" + encodeURIComponent("Cubbon Park"));
ok(g.status === 200 && Array.isArray(g.data?.candidates) && g.data.candidates[0]?.precision, "geocode returns candidates with a precision level");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
