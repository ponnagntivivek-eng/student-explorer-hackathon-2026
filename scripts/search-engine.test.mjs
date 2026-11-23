import test from "node:test";
import assert from "node:assert/strict";
await import("../public/explorer/search-engine.js");
const S = globalThis.SESearch;

const places = [
  { id: "cubbon", name: "Cubbon Park", category: "nature", location: "Kasturba Road, Central Bengaluru", minBudget: 0, maxBudget: 50, lat: 12.9763, lng: 77.5929, rating: 4.8, vibes: ["morning", "nature"], description: "Spread over 300 acres, loved for book reading under bamboo groves and cycling on vehicle-free avenues." },
  { id: "lalbagh", name: "Lalbagh Botanical Garden", category: "nature", location: "Mavalli, South Bengaluru", minBudget: 30, maxBudget: 70, lat: 12.9507, lng: 77.5848, rating: 4.7, description: "A 240-acre botanical garden with a glass house." },
  { id: "vvpuram", name: "VV Puram Food Street", category: "food", location: "Sajjan Rao Circle, VV Puram", minBudget: 120, maxBudget: 250, lat: 12.9515, lng: 77.5768, rating: 4.6, description: "Dosa, bun and chaat stalls open till late." },
  { id: "churchstreet", name: "Church Street and Book Cafes", category: "food", location: "Church Street, MG Road", minBudget: 100, maxBudget: 300, lat: 12.975, lng: 77.6066, rating: 4.9, description: "Book cafes and coffee, quiet corners for reading." },
  { id: "k1", name: "Third Wave Coffee", category: "food", location: "5th Block, Koramangala", minBudget: 150, maxBudget: 350, lat: 12.9349, lng: 77.6191, rating: 4.4, description: "Specialty coffee and wifi friendly seating." },
  { id: "k2", name: "Truffles", category: "food", location: "St Marks Road", minBudget: 300, maxBudget: 500, lat: 12.9719, lng: 77.6019, rating: 4.5, description: "Burgers and shakes." },
  { id: "k3", name: "Meghana Foods", category: "food", location: "Koramangala 5th Block", minBudget: 200, maxBudget: 400, lat: 12.9345, lng: 77.6107, rating: 4.6, description: "Andhra style biryani." },
  { id: "lib", name: "State Central Library", category: "attractions", location: "Cubbon Park, Kasturba Road", minBudget: 0, maxBudget: 20, lat: 12.9761, lng: 77.5931, rating: 4.3, description: "Silent reading halls, a calm place for exam preparation." },
  { id: "new1", name: "Ramu Tiffin Room", category: "food", location: "Jayanagar 4th Block", minBudget: 40, maxBudget: 90, lat: 12.9299, lng: 77.5832, rating: 4.1, description: "" },
];
const idx = () => S.buildIndex(places);
const ids = (r) => r.results.map((x) => x.id);

test("typo 'koramangal' finds Koramangala places (not every place)", () => {
  const r = S.search("koramangal", idx());
  assert.equal(r.area.name, "Koramangala");
  assert.ok(ids(r).includes("k1") && ids(r).includes("k3"));
  assert.ok(ids(r)[0] === "k1" || ids(r)[0] === "k3", "places inside the area come first");
  assert.ok(!ids(r).includes("lalbagh") && !ids(r).includes("cubbon"), "far-away places are not listed");
});

test("misspellings of area and place names", () => {
  assert.equal(S.search("kormangala", idx()).area.name, "Koramangala");
  assert.equal(S.search("indra nagar", idx()).area.name, "Indiranagar");
  assert.equal(ids(S.search("cubon park", idx()))[0], "cubbon");
  assert.equal(ids(S.search("lalbag", idx()))[0], "lalbagh");
});

test("area + category: 'cafes in koramangala'", () => {
  const r = S.search("cafes in koramangala", idx());
  assert.ok(ids(r).includes("k1"));
  assert.ok(!ids(r).includes("lalbagh"));
});

test("similar description, not an exact match", () => {
  const r = S.search("quiet place to study with wifi", idx());
  assert.ok(ids(r).includes("lib") || ids(r).includes("churchstreet"), "finds quiet/reading places");
  assert.ok(ids(r).length >= 2);
});

test("cheap dosa surfaces a place whose text never says 'cheap'", () => {
  const r = S.search("cheap dosa", idx());
  assert.ok(ids(r).includes("vvpuram"));
});

test("new place with empty description is still searchable by name, area and category", () => {
  assert.equal(ids(S.search("ramu tiffin", idx()))[0], "new1");
  assert.ok(ids(S.search("jayanagar", idx())).includes("new1"));
  assert.ok(ids(S.search("tiffin", idx())).includes("new1"));
  assert.ok(ids(S.search("cheap food", idx())).includes("new1"));
});

test("budget parsing", () => {
  assert.deepEqual(pick(S.parseIntent("under 100")), { max: 100, min: null, free: false });
  assert.deepEqual(pick(S.parseIntent("₹250")), { max: 250, min: null, free: false });
  assert.deepEqual(pick(S.parseIntent("100-300")), { max: 300, min: 100, free: false });
  assert.equal(S.parseIntent("free").free, true);
  assert.equal(S.parseIntent("5th block koramangala").hasBudget, false, "'5th block' is not a budget");
  assert.equal(S.parseIntent("100 ft road").hasBudget, false);
  assert.equal(S.parseIntent("food under 300").text, "food");
});
function pick(i) { return { max: i.max, min: i.min, free: i.free }; }

test("budget filter applies to results", () => {
  const r = S.search("food under 100", idx());
  assert.ok(ids(r).includes("new1"));
  assert.ok(!ids(r).includes("vvpuram") && !ids(r).includes("k1"), "places whose cheapest price is above the cap are excluded");
});

test("empty area falls back to nearest places", () => {
  const r = S.search("whitefield", idx());
  assert.equal(r.area.name, "Whitefield");
  assert.ok(r.nearestFallback);
  assert.ok(r.results.length > 0);
});

test("gibberish returns nothing and no crash", () => {
  const r = S.search("zzzqqq", idx());
  assert.equal(r.results.length, 0);
});

test("did you mean for near-miss names", () => {
  const r = S.search("truffels", idx());
  assert.ok(ids(r).includes("k2") || (r.didYouMean && /truffles/i.test(r.didYouMean.label)));
});

test("autocomplete: suggests area and places while typing", () => {
  const s = S.suggest("koram", idx());
  assert.equal(s[0].type, "area");
  assert.equal(s[0].label, "Koramangala");
  const p = S.suggest("cub", idx());
  assert.equal(p.find((x) => x.type === "place").label, "Cubbon Park");
});

test("highlight escapes html", () => {
  assert.equal(S.highlight("<b>Cubbon</b> Park", "cubbon"), "&lt;b&gt;<mark>Cubbon</mark>&lt;/b&gt; Park");
});

test("performance: 400 places searched in well under 300ms", () => {
  const many = [];
  for (let i = 0; i < 400; i++) many.push({ id: "p" + i, name: "Place number " + i + " cafe", category: "food", location: "Area " + (i % 20), minBudget: i % 300, maxBudget: (i % 300) + 100, lat: 12.9 + (i % 50) / 500, lng: 77.5 + (i % 40) / 500, description: "tasty filter coffee and snacks number " + i });
  const index = S.buildIndex(many);
  const t = performance.now();
  S.search("tasty cofee near koramangal", index);
  assert.ok(performance.now() - t < 300, "slow search: " + (performance.now() - t));
});
