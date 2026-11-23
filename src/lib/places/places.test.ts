import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapOsmTagsToCategory, guessCategoryFromName, toExplorerBucket } from "./categories.ts";
import { discoverPlace, findBestPhoto, nameSimilarity, lookupPhotoByUrl, clearPlaceCaches, verifyWikiArticle, tokens, locatePlace } from "./discovery.server.ts";
import { resetLanes, allowRequest } from "./http.server.ts";

const realFetch = globalThis.fetch;
type Handler = (url: string) => unknown | Response | undefined;
let handler: Handler = () => undefined;
let calls: string[] = [];

beforeEach(() => {
  resetLanes();
  clearPlaceCaches();
  calls = [];
  globalThis.fetch = (async (input: any) => {
    const url = String(input);
    calls.push(url);
    const out = handler(url);
    if (out instanceof Response) return out;
    return new Response(JSON.stringify(out ?? {}), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
});

const fileInfo = (title: string, extra: Record<string, unknown> = {}) => ({
  title: `File:${title}`,
  imageinfo: [
    {
      thumburl: `https://upload.wikimedia.org/thumb/${title}`,
      url: `https://upload.wikimedia.org/${title}`,
      descriptionurl: `https://commons.wikimedia.org/wiki/File:${title}`,
      width: 3000,
      height: 2000,
      mime: "image/jpeg",
      extmetadata: {
        Artist: { value: '<a href="x">Jane Photographer</a>' },
        LicenseShortName: { value: "CC BY-SA 4.0" },
        LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0" },
        Categories: { value: "Cubbon Park|Parks in Bengaluru" },
      },
    },
  ],
  ...extra,
});

const wiki = (pages: unknown[]) => ({ query: { pages: Object.fromEntries(pages.map((p, i) => [String(i + 1), p])) } });

describe("categories", () => {
  it("maps the documented OSM tags", () => {
    assert.equal(mapOsmTagsToCategory({ leisure: "park" }).category, "parks_gardens");
    assert.equal(mapOsmTagsToCategory({ natural: "waterfall" }).category, "waterfalls");
    assert.equal(mapOsmTagsToCategory({ natural: "beach" }).category, "beaches");
    assert.equal(mapOsmTagsToCategory({ amenity: "place_of_worship" }).category, "spiritual");
    assert.equal(mapOsmTagsToCategory({ tourism: "museum" }).category, "museums_education");
    assert.equal(mapOsmTagsToCategory({ shop: "mall" }).category, "shopping");
    assert.equal(mapOsmTagsToCategory({ amenity: "restaurant" }).category, "food");
    assert.equal(mapOsmTagsToCategory({ historic: "fort" }).category, "historical");
    assert.equal(mapOsmTagsToCategory({ tourism: "hotel" }).category, "accommodation");
    assert.equal(mapOsmTagsToCategory({ tourism: "zoo" }).category, "wildlife");
  });
  it("recognises accommodation and wildlife names with medium confidence", () => {
    assert.equal(guessCategoryFromName("Green Valley Resort").category, "accommodation");
    assert.equal(guessCategoryFromName("City Wildlife Safari").category, "wildlife");
  });
  it("falls back to Other when unsure", () => {
    const g = mapOsmTagsToCategory({ highway: "residential" });
    assert.equal(g.category, "other");
    assert.equal(g.confidence, "none");
    assert.equal(mapOsmTagsToCategory(null).category, "other");
    assert.equal(guessCategoryFromName("Sunrise Corner").category, "other");
    assert.equal(guessCategoryFromName("Hogenakkal Falls").category, "waterfalls");
  });
  it("maps to the old explorer buckets", () => {
    assert.equal(toExplorerBucket("waterfalls").bucket, "nature");
    assert.equal(toExplorerBucket("shopping").bucket, "custom");
  });
  it("name similarity", () => {
    assert.ok(nameSimilarity("Cubbon Park", "Cubbon Park") > 0.9);
    assert.ok(nameSimilarity("Cubbon Park", "Sri Chamarajendra Park (Cubbon Park)") >= 0.6);
    assert.ok(nameSimilarity("Cubbon Park", "Lalbagh Botanical Garden") < 0.3);
  });
});

describe("discovery (mocked public APIs)", () => {
  it("finds category + a verified photo with credit", async () => {
    handler = (url) => {
      if (url.includes("overpass")) return { elements: [{ type: "way", id: 1, center: { lat: 12.9763, lon: 77.5929 }, tags: { name: "Cubbon Park", leisure: "park", wikipedia: "en:Cubbon Park" } }] };
      if (url.includes("en.wikipedia.org")) return wiki([{ title: "Cubbon Park", fullurl: "https://en.wikipedia.org/wiki/Cubbon_Park", extract: "Cubbon Park is a landmark park.", pageimage: "Cubbon_Park_view.jpg", coordinates: [{ lat: 12.976, lon: 77.592 }] }]);
      if (url.includes("commons.wikimedia.org") && url.includes("Cubbon_Park_view")) return wiki([fileInfo("Cubbon_Park_view.jpg")]);
      if (url.includes("commons.wikimedia.org")) return wiki([]);
      if (url.includes("nominatim")) return { display_name: "Cubbon Park, Bengaluru", address: {} };
    };
    const r = await discoverPlace({ name: "Cubbon Park", lat: 12.9763, lng: 77.5929 });
    assert.equal(r.found, true);
    assert.equal(r.category.category, "parks_gardens");
    assert.equal(r.photos.length >= 1, true);
    const p = r.photos[0];
    assert.equal(p.author, "Jane Photographer");
    assert.equal(p.license, "CC BY-SA 4.0");
    assert.ok(p.sourcePageUrl.includes("commons.wikimedia.org"));
    assert.equal(r.selectedPhotoUrl, p.url);
    assert.ok(lookupPhotoByUrl(p.url));
    assert.match(r.description ?? "", /landmark park/);
  });

  it("rejects an unrelated photo", async () => {
    handler = (url) => {
      if (url.includes("en.wikipedia.org")) return wiki([]);
      if (url.includes("commons.wikimedia.org"))
        return wiki([fileInfo("Some_random_temple_in_Chennai.jpg"), fileInfo("Cubbon_Park_logo.jpg"), fileInfo("Tiny.jpg", { imageinfo: [{ width: 100, thumburl: "https://upload.wikimedia.org/x.jpg", mime: "image/jpeg", extmetadata: { LicenseShortName: { value: "CC0" } } }] })]);
    };
    const { photo } = await findBestPhoto({ name: "Cubbon Park", lat: 12.9763, lng: 77.5929, area: "Bengaluru" });
    assert.equal(photo, null);
  });

  it("rejects a geotagged photo that is far away, and non-free licences", async () => {
    handler = (url) => {
      if (url.includes("en.wikipedia.org")) return wiki([]);
      if (url.includes("commons.wikimedia.org")) {
        const far = fileInfo("Cubbon_Park_view.jpg", { coordinates: [{ lat: 28.6, lon: 77.2 }] });
        const nc = fileInfo("Cubbon_Park_gate.jpg", { coordinates: [{ lat: 12.9763, lon: 77.5929 }] });
        nc.imageinfo[0].extmetadata.LicenseShortName.value = "CC BY-NC 4.0";
        return wiki([far, nc]);
      }
    };
    const { photo } = await findBestPhoto({ name: "Cubbon Park", lat: 12.9763, lng: 77.5929 });
    assert.equal(photo, null);
  });

  it("accepts a nearby geotagged photo with matching name", async () => {
    handler = (url) => {
      if (url.includes("en.wikipedia.org")) return wiki([]);
      if (url.includes("commons.wikimedia.org")) return wiki([fileInfo("Cubbon_Park_gate.jpg", { coordinates: [{ lat: 12.9765, lon: 77.593 }] })]);
    };
    const { photo } = await findBestPhoto({ name: "Cubbon Park", lat: 12.9763, lng: 77.5929 });
    assert.ok(photo);
  });

  it("survives rate limits and empty results", async () => {
    handler = () => new Response("slow down", { status: 429, headers: { "retry-after": "60" } });
    const r = await discoverPlace({ name: "Totally Unknown Place Xyz", lat: 12.1, lng: 77.1 });
    assert.equal(r.found, false);
    assert.equal(r.category.category, "other");
    assert.equal(r.photos.length, 0);
    assert.ok(r.warnings.length > 0);
  });

  it("falls back to name search when no coordinates are given", async () => {
    handler = (url) => {
      if (url.includes("nominatim.openstreetmap.org/search"))
        return [{ osm_type: "node", osm_id: 7, lat: "13.0", lon: "77.5", name: "Jog Falls", display_name: "Jog Falls, Karnataka", class: "waterway", type: "waterfall", extratags: {} }];
      if (url.includes("overpass")) return { elements: [{ type: "node", id: 7, lat: 13.0, lon: 77.5, tags: { name: "Jog Falls", waterway: "waterfall" } }] };
      return wiki([]);
    };
    const r = await discoverPlace({ name: "Jog Falls" });
    assert.equal(r.found, true);
    assert.equal(r.category.category, "waterfalls");
    assert.equal(r.address, "Jog Falls, Karnataka");
  });
});

describe("rate limiter", () => {
  it("blocks after the limit", () => {
    for (let i = 0; i < 3; i++) assert.equal(allowRequest("t", 3, 1000), true);
    assert.equal(allowRequest("t", 3, 1000), false);
  });
});

process.on("exit", () => {
  globalThis.fetch = realFetch;
});

describe("brand-style names and Bangalore/Bengaluru spelling", () => {
  it("accepts 'Wonderla Holidays' for a place typed as 'Wonderla' when the article is about Bengaluru", () => {
    const page = { title: "Wonderla Holidays", extract: "Wonderla is an amusement park chain with a park near Bangalore, Karnataka." };
    const res = verifyWikiArticle(page as never, { name: "Wonderla", contextTokens: [] });
    assert.equal(res.ok, true);
  });
  it("rejects a namesake that is not about Bengaluru", () => {
    const page = { title: "Wonderla Holidays", extract: "A company in Kerala." };
    const res = verifyWikiArticle(page as never, { name: "Wonderla", contextTokens: [] });
    assert.equal(res.ok, false);
  });
  it("treats Bangalore and Bengaluru as the same word", () => {
    assert.deepEqual(tokens("Bangalore Palace", false), tokens("Bengaluru Palace", false));
  });
});

describe("finding small shops and stalls by name", () => {
  const areaRow = { lat: "12.9308", lon: "77.5838", display_name: "Jayanagar, Bengaluru, Karnataka, India", name: "Jayanagar" };
  it("finds a tiny stall that Nominatim does not list, through the OSM name search inside the area", async () => {
    handler = (url) => {
      if (url.includes("nominatim.openstreetmap.org/search")) return url.includes("Raju") ? [] : [areaRow];
      if (url.includes("photon.komoot.io")) return { features: [] };
      if (url.includes("overpass")) return { elements: [{ type: "node", id: 42, lat: 12.9321, lon: 77.5849, tags: { name: "Raju Chai Stall", amenity: "cafe" } }] };
      return {};
    };
    const hit = await locatePlace("Raju Chai Stall", "Jayanagar");
    assert.equal(hit?.precision, "exact");
    assert.ok(Math.abs((hit?.lat ?? 0) - 12.9321) < 1e-6);
  });
  it("falls back to the area centre (flagged as area-level) when the shop is not on the map at all", async () => {
    handler = (url) => {
      if (url.includes("nominatim.openstreetmap.org/search")) return url.includes("Raju") ? [] : [areaRow];
      if (url.includes("photon.komoot.io")) return { features: [] };
      if (url.includes("overpass")) return { elements: [] };
      return {};
    };
    const hit = await locatePlace("Raju Chai Stall", "Jayanagar");
    assert.equal(hit?.precision, "area");
    assert.ok(Math.abs((hit?.lat ?? 0) - 12.9308) < 1e-6);
  });
});
