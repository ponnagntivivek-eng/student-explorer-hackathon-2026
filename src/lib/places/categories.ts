/**
 * Place categories + the OpenStreetMap-tag → category mapper.
 *
 * This file is safe to import from BOTH the browser and the server
 * (no Node-only code, no network calls).
 */

export const PLACE_CATEGORIES = [
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "parks_gardens", label: "Parks and Gardens", emoji: "🌳" },
  { id: "waterfalls", label: "Waterfalls", emoji: "💦" },
  { id: "beaches", label: "Beaches", emoji: "🏖️" },
  { id: "historical", label: "Historical Places", emoji: "🏰" },
  { id: "spiritual", label: "Temples and Spiritual Places", emoji: "🛕" },
  { id: "museums_education", label: "Museums and Education", emoji: "🏛️" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "food", label: "Restaurants and Food", emoji: "🍽️" },
  { id: "entertainment", label: "Entertainment", emoji: "🎭" },
  { id: "adventure", label: "Adventure", emoji: "🧗" },
  { id: "tourist_attractions", label: "Tourist Attractions", emoji: "📸" },
  { id: "wildlife", label: "Wildlife", emoji: "🦌" },
  { id: "accommodation", label: "Hotels and Accommodation", emoji: "🏨" },
  { id: "other", label: "Other", emoji: "📍" },
] as const;

export type PlaceCategoryId = (typeof PLACE_CATEGORIES)[number]["id"];

export const CATEGORY_IDS: string[] = PLACE_CATEGORIES.map((c) => c.id);

/** Category ids used by older versions of the app. Existing rows keep working. */
const LEGACY_LABELS: Record<string, { label: string; emoji: string }> = {
  cafe: { label: "Café", emoji: "☕" },
  restaurant: { label: "Restaurant", emoji: "🍽️" },
  library: { label: "Library", emoji: "📚" },
  park: { label: "Park", emoji: "🌳" },
  gym: { label: "Gym", emoji: "🏋️" },
  attractions: { label: "Tourist Attractions", emoji: "📸" },
  getaways: { label: "Weekend Getaways", emoji: "🚌" },
  hotels: { label: "Hotels", emoji: "🏨" },
};

export function isCategoryId(value: unknown): value is PlaceCategoryId {
  return typeof value === "string" && CATEGORY_IDS.includes(value);
}

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return "Other";
  const c = PLACE_CATEGORIES.find((x) => x.id === id);
  if (c) return c.label;
  return LEGACY_LABELS[id]?.label ?? "Other";
}

export function categoryEmoji(id: string | null | undefined): string {
  const c = PLACE_CATEGORIES.find((x) => x.id === id);
  if (c) return c.emoji;
  return (id && LEGACY_LABELS[id]?.emoji) || "📍";
}

export type Confidence = "high" | "medium" | "none";

export type CategoryGuess = {
  category: PlaceCategoryId;
  confidence: Confidence;
  /** Human readable reason, e.g. "OpenStreetMap tag leisure=park". */
  reason: string;
  /** Numeric confidence from 0 to 1; this is a heuristic, not a probability. */
  confidenceScore?: number;
};

export type OsmTags = Record<string, string>;

const has = (tags: OsmTags, key: string, ...values: string[]) =>
  key in tags && (values.length === 0 || values.includes(tags[key]));

type Rule = { test: (t: OsmTags) => boolean; category: PlaceCategoryId; confidence: Confidence; tag: string };

/**
 * Rules are checked from top to bottom: the FIRST match wins.
 * Specific things (waterfall, beach, worship) come before general ones.
 */
const RULES: Rule[] = [
  { test: (t) => has(t, "natural", "waterfall") || has(t, "waterway", "waterfall"), category: "waterfalls", confidence: "high", tag: "natural=waterfall" },
  { test: (t) => has(t, "natural", "beach") || has(t, "leisure", "beach_resort"), category: "beaches", confidence: "high", tag: "natural=beach" },
  { test: (t) => has(t, "amenity", "place_of_worship") || has(t, "building", "temple", "church", "mosque", "synagogue", "shrine", "cathedral", "chapel", "gurdwara") || has(t, "historic", "wayside_shrine"), category: "spiritual", confidence: "high", tag: "amenity=place_of_worship" },
  { test: (t) => has(t, "tourism", "museum", "gallery") || has(t, "amenity", "planetarium"), category: "museums_education", confidence: "high", tag: "tourism=museum" },
  { test: (t) => has(t, "amenity", "university", "college", "library", "school", "research_institute"), category: "museums_education", confidence: "medium", tag: "amenity=university/library" },
  { test: (t) => has(t, "historic", "castle", "fort", "palace", "monument", "memorial", "ruins", "archaeological_site", "manor", "city_gate", "tomb", "building", "heritage", "temple") || has(t, "building", "palace") || has(t, "heritage"), category: "historical", confidence: "high", tag: "historic=*" },
  { test: (t) => has(t, "leisure", "park", "garden"), category: "parks_gardens", confidence: "high", tag: "leisure=park" },
  { test: (t) => has(t, "tourism", "zoo", "wildlife_park", "aquarium") || has(t, "leisure", "wildlife_hide") || has(t, "boundary", "national_park") && has(t, "protect_class", "1a", "1b", "2", "3", "4"), category: "wildlife", confidence: "medium", tag: "tourism=zoo/wildlife_park" },
  { test: (t) => has(t, "tourism", "hotel", "hostel", "guest_house", "motel", "apartment", "camp_site", "caravan_site") || has(t, "building", "hotel"), category: "accommodation", confidence: "high", tag: "tourism=hotel" },
  { test: (t) => has(t, "leisure", "nature_reserve") || has(t, "boundary", "national_park", "protected_area") || has(t, "natural", "wood", "peak", "water", "hot_spring", "spring", "bay", "valley", "cliff", "grassland", "wetland", "volcano", "ridge") || has(t, "waterway", "river", "stream", "lake") || has(t, "water", "lake", "reservoir", "pond") || has(t, "landuse", "forest"), category: "nature", confidence: "high", tag: "natural=*" },
  { test: (t) => has(t, "natural", "cave_entrance") || has(t, "highway", "via_ferrata") || has(t, "aerialway") || has(t, "tourism", "camp_site", "caravan_site") || has(t, "sport", "climbing", "paragliding", "scuba_diving", "kayak", "canoe", "surfing", "karting", "rafting", "bungee_jumping", "skydiving", "diving", "motor", "hiking"), category: "adventure", confidence: "medium", tag: "sport=adventure" },
  { test: (t) => has(t, "shop", "mall", "department_store", "supermarket", "marketplace") || has(t, "amenity", "marketplace"), category: "shopping", confidence: "high", tag: "shop=mall" },
  { test: (t) => has(t, "shop", "bakery", "coffee", "tea", "confectionery", "pastry", "ice_cream", "deli", "chocolate", "beverages"), category: "food", confidence: "medium", tag: "shop=bakery" },
  { test: (t) => "shop" in t, category: "shopping", confidence: "medium", tag: "shop=*" },
  { test: (t) => has(t, "amenity", "restaurant", "cafe", "fast_food", "food_court", "ice_cream", "bar", "pub", "biergarten", "bbq", "canteen"), category: "food", confidence: "high", tag: "amenity=restaurant" },
  { test: (t) => has(t, "amenity", "cinema", "theatre", "nightclub", "casino", "arts_centre", "events_venue", "stripclub", "amusement_arcade") || has(t, "tourism", "theme_park") || has(t, "leisure", "amusement_arcade", "bowling_alley", "water_park", "miniature_golf", "escape_game", "adult_gaming_centre", "dance", "sports_centre", "stadium", "golf_course", "trampoline_park", "ice_rink"), category: "entertainment", confidence: "high", tag: "amenity=cinema" },
  { test: (t) => has(t, "tourism", "viewpoint", "attraction", "artwork", "picnic_site"), category: "tourist_attractions", confidence: "medium", tag: "tourism=attraction" },
];

/** Decide a category from OpenStreetMap tags. Returns "other" with confidence "none" if unsure. */
export function mapOsmTagsToCategory(tags: OsmTags | null | undefined): CategoryGuess {
  if (!tags) return { category: "other", confidence: "none", confidenceScore: 0, reason: "No OpenStreetMap tags available" };
  for (const rule of RULES) {
    if (rule.test(tags)) {
      const keys = ["natural", "waterway", "leisure", "amenity", "tourism", "historic", "shop", "building", "boundary", "sport"];
      const found = keys.find((k) => k in tags && rule.test({ [k]: tags[k] }));
      const reason = found ? `OpenStreetMap tag ${found}=${tags[found]}` : `OpenStreetMap tag ${rule.tag}`;
      return { category: rule.category, confidence: rule.confidence, confidenceScore: rule.confidence === "high" ? 0.95 : 0.75, reason };
    }
  }
  return { category: "other", confidence: "none", confidenceScore: 0, reason: "OpenStreetMap tags did not match a known category" };
}

const NAME_HINTS: [RegExp, PlaceCategoryId][] = [
  [/\b(waterfalls?|falls)\b/i, "waterfalls"],
  [/\b(beach|seashore)\b/i, "beaches"],
  [/\b(temple|mandir|masjid|mosque|church|gurudwara|gurdwara|dargah|basilica|cathedral|ashram|math)\b/i, "spiritual"],
  [/\b(museum|planetarium|science centre|science center|art gallery)\b/i, "museums_education"],
  [/\b(fort|palace|ruins|heritage|monument|memorial|tomb|mahal)\b/i, "historical"],
  [/\b(national park|wildlife sanctuary|reserve forest|hills?|lake|viewpoint)\b/i, "nature"],
  [/\b(botanical|garden|gardens|park)\b/i, "parks_gardens"],
  [/\b(mall|market|bazaar|bazar|shopping)\b/i, "shopping"],
  [/\b(restaurant|cafe|café|dhaba|bakery|biryani|kitchen|eatery|food street|coffee)\b/i, "food"],
  [/\b(cinema|theatre|theater|multiplex|arcade|bowling|amusement|water park)\b/i, "entertainment"],
  [/\b(zoo|safari|wildlife|bird sanctuary)\b/i, "wildlife"],
  [/\b(hotel|hostel|resort|guest house|homestay)\b/i, "accommodation"],
  [/\b(trek|camp|rafting|paragliding|adventure)\b/i, "adventure"],
];

/** Weaker fallback used only when OpenStreetMap has nothing for the place. */
export function guessCategoryFromName(name: string): CategoryGuess {
  for (const [re, category] of NAME_HINTS) {
    const m = name.match(re);
    if (m) return { category, confidence: "medium", confidenceScore: 0.6, reason: `The name contains “${m[0]}”` };
  }
  return { category: "other", confidence: "none", confidenceScore: 0, reason: "Could not tell the category from the name" };
}

/**
 * The original Student Explorer page (/) uses six built-in buckets.
 * This maps the new detailed categories onto them so its filters keep working.
 */
export function toExplorerBucket(id: PlaceCategoryId): { bucket: string; label?: string } {
  switch (id) {
    case "nature":
    case "parks_gardens":
    case "waterfalls":
    case "beaches":
      return { bucket: "nature" };
    case "historical":
    case "spiritual":
    case "museums_education":
    case "tourist_attractions":
      return { bucket: "attractions" };
    case "food":
      return { bucket: "food" };
    case "entertainment":
      return { bucket: "entertainment" };
    case "adventure":
    case "wildlife":
    case "accommodation":
      return { bucket: "getaways" };
    case "shopping":
      return { bucket: "custom", label: "Shopping" };
    default:
      return { bucket: "" };
  }
}
