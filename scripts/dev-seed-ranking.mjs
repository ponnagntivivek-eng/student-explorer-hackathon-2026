// DEV ONLY: creates demo students with different XP and publishes the leaderboard so you can see the Rank screens.
//   BASE=http://localhost:8080 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/dev-seed-ranking.mjs 14
// Demo accounts are named "Demo Student N" (password Demo-pass-12345). Do NOT run this against production.
const BASE = process.env.BASE || "http://localhost:8080";
const N = Math.min(40, Number(process.argv[2]) || 14);
const jar = () => ({});
async function call(j, path, method = "GET", body) {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", origin: BASE, cookie: Object.entries(j).map(([k, v]) => `${k}=${v}`).join("; ") }, body: body ? JSON.stringify(body) : undefined });
  for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); j[kv.slice(0, i)] = kv.slice(i + 1); }
  return { status: res.status, data: await res.json().catch(() => null) };
}
const names = ["Aarav", "Diya", "Rohan", "Meera", "Kabir", "Ananya", "Vihaan", "Ishita", "Arjun", "Saanvi", "Neel", "Tara", "Dev", "Riya", "Yash", "Kavya", "Om", "Sneha", "Pranav", "Nisha"];
const tag = Date.now().toString(36);
for (let i = 0; i < N; i++) {
  const j = jar();
  const r = await call(j, "/api/auth/sign-up/email", "POST", { email: `demo${i}_${tag}@example.com`, password: "Demo-pass-12345", name: `${names[i % names.length]} (Demo ${i + 1})` });
  if (r.status !== 200) { console.log("sign-up failed", r.status, r.data); continue; }
  await call(j, "/api/profile", "POST", { college: ["BMSCE", "RVCE", "PES University", "Christ University", "MSRIT"][i % 5] });
  const plans = 1 + ((i * 7) % 10);
  for (let k = 0; k < plans; k++) await call(j, "/api/trips", "POST", { type: "squad_plan", stopIds: ["cubbon", "lalbagh"], people: 4, place: `Demo plan ${k}` });
}
const a = jar();
const login = await call(a, "/api/auth/sign-in/email", "POST", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
if (login.status !== 200) { console.log("admin login failed - set ADMIN_EMAIL / ADMIN_PASSWORD"); process.exit(1); }
const pub = await call(a, "/api/admin/leaderboard/publish", "POST");
console.log("published:", pub.status, "students ranked:", pub.data?.total);
