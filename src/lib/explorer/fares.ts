/** Dynamic one-way student fare model. Keep in sync with public/explorer/app.js computeFares. */

export type FareQuote = {
  roadKm: number;
  outstation: boolean;
  rapido: number | null;
  rapidoNote: string;
  metro: number | null;
  metroNote: string;
  bus: number | null;
  busNote: string;
  busLabel: string;
  auto: number;
  autoShare: number;
  /** Dynamic pricing metadata for UI / debugging */
  pricing?: {
    period: PricingPeriod;
    periodLabel: string;
    multipliers: { rapido: number; auto: number; bus: number; metro: number };
    base: { rapido: number; auto: number; bus: number; metro: number | null };
  };
};

export type PricingPeriod = "offpeak" | "morning_peak" | "evening_peak" | "late_night" | "weekend";

export type PricingContext = {
  /** Local time; defaults to now in Asia/Kolkata semantics (caller may pass Date) */
  now?: Date;
  /** 0–1 optional demand hint (events, rain). Default derived from time-of-day. */
  demand?: number;
};

const IST_OFFSET_MIN = 330; // UTC+5:30

function istParts(now = new Date()) {
  // Interpret "now" as UTC instant, then shift to IST wall-clock without depending on host TZ.
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + IST_OFFSET_MIN * 60_000);
  return {
    day: ist.getDay(), // 0 Sun .. 6 Sat
    hour: ist.getHours(),
    minute: ist.getMinutes(),
  };
}

/** Classify current Bengaluru travel period for dynamic multipliers. */
export function getPricingPeriod(now = new Date()): { period: PricingPeriod; label: string } {
  const { day, hour } = istParts(now);
  const weekend = day === 0 || day === 6;
  if (hour >= 22 || hour < 5) return { period: "late_night", label: "Late night" };
  if (hour >= 8 && hour < 11) return { period: "morning_peak", label: weekend ? "Weekend morning" : "Morning peak" };
  if (hour >= 17 && hour < 21) return { period: "evening_peak", label: weekend ? "Weekend evening" : "Evening peak" };
  if (weekend) return { period: "weekend", label: "Weekend" };
  return { period: "offpeak", label: "Off-peak" };
}

/**
 * Mode multipliers by period.
 * Metro/bus stay near official slabs (mild peak only). Rapido/auto absorb demand surge.
 */
export function periodMultipliers(period: PricingPeriod): { rapido: number; auto: number; bus: number; metro: number } {
  switch (period) {
    // Bus and metro fares are fixed (no surge). Autos follow the official meter: +50% only 10 pm - 5 am.
    case "morning_peak":
      return { rapido: 1.15, auto: 1.0, bus: 1.0, metro: 1.0 };
    case "evening_peak":
      return { rapido: 1.2, auto: 1.0, bus: 1.0, metro: 1.0 };
    case "late_night":
      return { rapido: 1.3, auto: 1.5, bus: 1.0, metro: 1.0 };
    case "weekend":
      return { rapido: 1.05, auto: 1.0, bus: 1.0, metro: 1.0 };
    default:
      return { rapido: 1.0, auto: 1.0, bus: 1.0, metro: 1.0 };
  }
}

/** Soft demand from time-of-day (0 = calm, 1 = busy). Optional external demand is blended in. */
export function demandFactor(now = new Date(), external?: number): number {
  const { hour } = istParts(now);
  let base = 0.15;
  if (hour >= 8 && hour < 11) base = 0.55;
  else if (hour >= 12 && hour < 14) base = 0.35;
  else if (hour >= 17 && hour < 21) base = 0.7;
  else if (hour >= 21 && hour < 23) base = 0.45;
  else if (hour >= 23 || hour < 5) base = 0.25;
  const ext = Number.isFinite(external) ? Math.min(1, Math.max(0, Number(external))) : base;
  return Math.min(1, Math.max(0, base * 0.6 + ext * 0.4));
}

/** Progressive per-km rate: longer trips get a slightly lower marginal rate (realistic taxi banding). */
function progressivePerKm(km: number, baseRate: number, longRate: number, breakAt = 12): number {
  if (km <= breakAt) return km * baseRate;
  return breakAt * baseRate + (km - breakAt) * longRate;
}

export function metroSlab(km: number): number {
  // Namma Metro (BMRCL) distance slabs: Rs 10 up to 2 km ... Rs 90 beyond 25 km (smart card gets 5-10% off).
  const slabs: [number, number][] = [
    [2, 10],
    [4, 20],
    [6, 30],
    [8, 40],
    [10, 50],
    [15, 60],
    [20, 70],
    [25, 80],
  ];
  for (const [max, fare] of slabs) if (km <= max) return fare;
  return 90;
}

export function roadKmFromStraight(straightKm: number): number {
  const km = Number.isFinite(straightKm) ? straightKm : 0;
  return Math.round(Math.max(0.05, km) * 1.22 * 100) / 100; // exact to ~10 m (the app shows metres under 1 km)
}

/**
 * Dynamic pricing:
 * 1) Base fare from distance (progressive for private modes, official-style slabs for metro/bus)
 * 2) Period multipliers (peak / late night / weekend)
 * 3) Small demand nudge on Rapido/Auto only
 */
export function computeFares(roadKm: number, placeId = "", ctx: PricingContext = {}): FareQuote {
  const kmShown = Math.max(0.05, Math.round(Number(roadKm) * 100) / 100); // shown to the visitor, exact to ~10 m
  const km = Math.max(0.4, Math.round(Number(roadKm) * 10) / 10); // fares are priced on this (they have minimums)
  const outstation = km > 42 || placeId === "nandihills";
  const now = ctx.now ?? new Date();
  const { period, label } = getPricingPeriod(now);
  const mult = periodMultipliers(period);
  const demand = demandFactor(now, ctx.demand);
  const round = (n: number) => Math.max(0, Math.round(n));
  // Extra 0–12% on private modes when demand is high (on top of period mult).
  const privateDemand = 1 + demand * 0.12;

  if (outstation) {
    const baseBus = 18 + progressivePerKm(km, 1.75, 1.45, 50);
    const baseBike = progressivePerKm(km, 3.8, 3.2, 40);
    const baseAuto = Math.max(80, 40 + progressivePerKm(km, 18, 14, 30));
    const bus = round(baseBus * mult.bus);
    const rapido = round(baseBike * mult.rapido * privateDemand);
    const auto = round(baseAuto * mult.auto * privateDemand);
    return {
      roadKm: kmShown,
      outstation: true,
      rapido,
      rapidoNote: `${label} · long ride — confirm in app`,
      metro: null,
      metroNote: "No direct Namma Metro",
      bus,
      busNote: `${label} · KSRTC / intercity, one way`,
      busLabel: "KSRTC Bus",
      auto,
      autoShare: Math.max(1, Math.ceil(auto / 3)),
      pricing: {
        period,
        periodLabel: label,
        multipliers: { ...mult, rapido: mult.rapido * privateDemand, auto: mult.auto * privateDemand },
        base: { rapido: round(baseBike), auto: round(baseAuto), bus: round(baseBus), metro: null },
      },
    };
  }

  // Bike taxi apps: about Rs 7-8 per km plus a small base (reported Rs 50-60 for a short city ride).
  const baseRapido = Math.max(30, 18 + progressivePerKm(km, 7.5, 6.5, 15));
  // Official auto meter (Bengaluru RTA, from Aug 2025): Rs 36 for the first 2 km, Rs 18 per km after.
  const baseAuto = km <= 2 ? 36 : 36 + (km - 2) * 18;
  const baseBus = Math.max(8, 5 + progressivePerKm(km, 2.0, 1.6, 18));
  const baseMetro = metroSlab(km);

  const rapido = round(baseRapido * mult.rapido * privateDemand);
  const auto = round(baseAuto * mult.auto);
  const bus = round(baseBus * mult.bus);
  const metro = round(baseMetro * mult.metro);

  const surgeHint =
    mult.rapido * privateDemand >= 1.25
      ? ` · ${label} pricing`
      : period === "offpeak"
        ? " · off-peak"
        : ` · ${label}`;

  return {
    roadKm: kmShown,
    outstation: false,
    rapido,
    rapidoNote: `One way from your start${surgeHint}`,
    metro,
    metroNote: "Token fare · smart card is 5-10% less",
    bus,
    busNote: `BMTC ordinary · AC Vajra ≈ ₹${round(bus * 1.8)}`,
    busLabel: "BMTC Bus",
    auto,
    autoShare: Math.max(1, Math.ceil(auto / 3)),
    pricing: {
      period,
      periodLabel: label,
      multipliers: { ...mult, rapido: mult.rapido * privateDemand, auto: mult.auto * privateDemand },
      base: { rapido: round(baseRapido), auto: round(baseAuto), bus: round(baseBus), metro: baseMetro },
    },
  };
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Namma Metro stations (approx.) used to price the metro leg from the real start and end points. */
export const METRO_STATIONS: [string, number, number][] = [
  ["Majestic (Kempegowda)", 12.9757, 77.5726], ["Cubbon Park", 12.9814, 77.5975], ["MG Road", 12.9755, 77.6068],
  ["Trinity", 12.9731, 77.6168], ["Indiranagar", 12.9783, 77.6387], ["Baiyappanahalli", 12.9908, 77.6522],
  ["Vidhana Soudha", 12.9795, 77.5910], ["Sir M. Visvesvaraya", 12.9840, 77.5838], ["Lalbagh", 12.9466, 77.5800],
  ["National College", 12.9503, 77.5742], ["Jayanagar", 12.9296, 77.5826], ["Banashankari", 12.9156, 77.5737],
  ["Yelachenahalli", 12.8964, 77.5700], ["Rajajinagar", 12.9910, 77.5540], ["Yeshwanthpur", 13.0233, 77.5500],
  ["Mantri Square (Sampige Rd)", 12.9965, 77.5700], ["Nagasandra", 13.0480, 77.5000], ["Peenya", 13.0330, 77.5200],
  ["Mysore Road", 12.9470, 77.5300], ["Kengeri", 12.9150, 77.4830], ["Whitefield (Kadugodi)", 12.9955, 77.7580],
  ["Mahadevapura", 12.9930, 77.6870], ["KR Puram", 13.0010, 77.6960], ["Halasuru", 12.9770, 77.6260],
  ["Garuda Mall (Magrath)", 12.9700, 77.6090], ["Hebbal (Kempapura)", 13.0450, 77.5900], ["Yelahanka", 13.1000, 77.5960],
  ["Sandal Soap Factory", 13.0100, 77.5470], ["Chickpete", 12.9680, 77.5760], ["Krishna Rajendra Market", 12.9610, 77.5740],
  ["South End Circle", 12.9380, 77.5800], ["Rashtreeya Vidyalaya Road", 12.9210, 77.5810], ["Silk Board", 12.9170, 77.6230],
  ["Electronic City", 12.8490, 77.6700], ["Kalena Agrahara", 12.8800, 77.6000],
];

export function nearestMetro(lat: number, lng: number) {
  let best = { name: "", km: Infinity };
  for (const [name, la, ln] of METRO_STATIONS) {
    const d = haversineKm(lat, lng, la, ln);
    if (d < best.km) best = { name, km: d };
  }
  return best;
}

const METRO_STATION_LAT = (n: string) => METRO_STATIONS.find((s) => s[0] === n)![1];
const METRO_STATION_LNG = (n: string) => METRO_STATIONS.find((s) => s[0] === n)![2];

/** Metro fare: slab by station-to-station distance, plus the walk or Rapido leg to/from stations. */
export function metroLeg(from: { lat: number; lng: number }, to: { lat: number; lng: number }, ctx: PricingContext = {}) {
  const a = nearestMetro(from.lat, from.lng);
  const b = nearestMetro(to.lat, to.lng);
  if (!a.name || a.name === b.name || a.km > 6 || b.km > 6) return null;
  const rail = Math.max(
    1,
    roadKmFromStraight(
      haversineKm(METRO_STATION_LAT(a.name), METRO_STATION_LNG(a.name), METRO_STATION_LAT(b.name), METRO_STATION_LNG(b.name)),
    ) * 0.95,
  );
  const fare = metroSlab(rail);
  const access = [a.km, b.km].reduce((s, k) => s + (k > 1.2 ? Math.round(Math.max(30, 18 + k * 1.22 * 7.5)) : 0), 0);
  const { label } = getPricingPeriod(ctx.now ?? new Date());
  return {
    fare: fare + access,
    note: `${a.name} → ${b.name}` + (access ? ` · incl. ₹${access} auto/Rapido to the stations` : " · short walk to stations") + ` · ${label}`,
  };
}
