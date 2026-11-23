import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { geocodeCandidates, geocodeQueryVariants } from "./geo.server.ts";
import { textScore } from "./fuzzy.ts";
import { resetLanes } from "../places/http.server.ts";

const realFetch = globalThis.fetch;
let osmRows: unknown[] = [];
beforeEach(() => {
  resetLanes();
  globalThis.fetch = (async () => new Response(JSON.stringify(osmRows), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
});
process.on("exit", () => { globalThis.fetch = realFetch; });

describe("fuzzy matching", () => {
  it("tolerates common misspellings of Bengaluru areas", () => {
    for (const [typed, real] of [["koramngala", "Koramangala"], ["indhiranagar", "Indiranagar"], ["malleswaram", "Malleshwaram"], ["cubon park", "Cubbon Park"], ["whitfield", "Whitefield"]]) {
      assert.ok(textScore(typed, real) >= 0.7, `${typed} should match ${real}`);
    }
    assert.ok(textScore("xyzabc", "Koramangala") < 0.3);
  });
});

describe("geocodeCandidates ranking (local index only, network returns nothing)", () => {
  it("does not let generic words (road / street / college) pick a random landmark", async () => {
    osmRows = [];
    assert.equal((await geocodeCandidates("St Marks Church Road, Bengaluru", 3)).length, 0);
    const hebbal = await geocodeCandidates("Government College Road, Hebbal", 3);
    assert.match(hebbal[0].name, /Hebbal/);
    assert.ok(!hebbal.some((c) => /Ramaiah|BMS|Christ|Carmel/.test(c.name)));
  });
  it("finds a college by its typed name before the neighbourhood", async () => {
    osmRows = [];
    const r = await geocodeCandidates("BMS College of Engineering, Basavanagudi", 3);
    assert.match(r[0].name, /BMSCE|BMS College/);
  });
  it("marks index hits as area-level so the UI asks for verification", async () => {
    osmRows = [];
    const r = await geocodeCandidates("Koramangala", 3);
    assert.equal(r[0].precision, "area");
  });
});

describe("geocodeCandidates with map results", () => {
  it("ranks a real venue match above the neighbourhood centre", async () => {
    osmRows = [{ lat: "12.9719", lon: "77.6412", display_name: "Third Wave Coffee, 12th Main Road, Indiranagar, Bengaluru", name: "Third Wave Coffee", importance: 0.2, place_rank: 30 }];
    const r = await geocodeCandidates("Third Wave Coffee, 12th Main Road, Indiranagar", 4);
    assert.equal(r[0].provider, "openstreetmap");
    assert.equal(r[0].precision, "exact");
  });
  it("finds places anywhere in India, not only Bengaluru", async () => {
    osmRows = [{ lat: "17.7231", lon: "83.3013", display_name: "RK Beach, Visakhapatnam, Andhra Pradesh, India", name: "RK Beach", importance: 0.5, place_rank: 30 }];
    const r = await geocodeCandidates("RK Beach Visakhapatnam", 4);
    assert.equal(r[0].name, "RK Beach");
    assert.ok(Math.abs(r[0].lat - 17.7231) < 1e-6);
  });
  it("rejects results outside the configured coverage (India by default)", async () => {
    osmRows = [{ lat: "51.5074", lon: "-0.1278", display_name: "Some Cafe, London, UK", name: "Some Cafe", importance: 0.5, place_rank: 30 }];
    const r = await geocodeCandidates("Some Cafe London", 4);
    assert.ok(r.every((c) => c.lat < 38 && c.lat > 6));
  });
  it("returns several alternatives for an ambiguous name instead of one silent pick", async () => {
    osmRows = [
      { lat: "12.9719", lon: "77.6412", display_name: "Gandhi Park, Indiranagar, Bengaluru", name: "Gandhi Park", importance: 0.3, place_rank: 30 },
      { lat: "12.3051", lon: "76.6551", display_name: "Gandhi Park, Mysuru, Karnataka", name: "Gandhi Park", importance: 0.3, place_rank: 30 },
      { lat: "17.4400", lon: "78.4983", display_name: "Gandhi Park, Secunderabad, Telangana", name: "Gandhi Park", importance: 0.3, place_rank: 30 },
    ];
    const r = await geocodeCandidates("Gandhi Park", 6);
    assert.ok(r.length >= 3, "all distinct locations are offered");
  });
  it("ranks nearer results first when the visitor's location is known", async () => {
    osmRows = [
      { lat: "17.4400", lon: "78.4983", display_name: "Central Cafe, Hyderabad", name: "Central Cafe", importance: 0.3, place_rank: 30 },
      { lat: "17.7200", lon: "83.3000", display_name: "Central Cafe, Visakhapatnam", name: "Central Cafe", importance: 0.3, place_rank: 30 },
    ];
    const r = await geocodeCandidates("Central Cafe", 4, { near: { lat: 17.72, lng: 83.3 } });
    assert.match(r[0].formattedAddress, /Visakhapatnam/);
  });
});

describe("query variants", () => {
  it("shortens long pasted addresses", () => {
    const v = geocodeQueryVariants("Ramaiah College, MSRIT Post, MSR Nagar, Mathikere, Bengaluru, Karnataka 560054, India");
    assert.ok(v.length > 1 && v.every((x) => x.length <= 180));
  });
});
