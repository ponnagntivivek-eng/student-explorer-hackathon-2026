/**
 * Polite HTTP helper for the free public APIs (Nominatim, Overpass, Wikipedia, Wikimedia Commons).
 *
 *  - sends a descriptive User-Agent (required by the OSM + Wikimedia usage policies)
 *  - spaces requests out per service ("lane") so we never hammer them
 *  - stops calling a service for a while after it answers 429 / 5xx
 *  - caches answers in memory, and shares one request between identical callers
 *  - tiny per-visitor rate limiter for our own API routes
 *
 * No API keys are used anywhere.
 */

const contact = (typeof process !== "undefined" && process.env.CONTACT_EMAIL) || "";
export const USER_AGENT = `StudentExplorer/2.0 (student outing guide; educational project${contact ? `; ${contact}` : ""})`;

export class UpstreamError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const lanes = new Map<string, { next: number }>();
const MAX_WAIT_MS = 9000;

async function waitForLane(lane: string, gapMs: number) {
  const l = lanes.get(lane) ?? { next: 0 };
  lanes.set(lane, l);
  const now = Date.now();
  const start = Math.max(now, l.next);
  if (start - now > MAX_WAIT_MS) throw new UpstreamError(`${lane} is busy or cooling down, try again shortly`, 429);
  l.next = start + gapMs;
  if (start > now) await sleep(start - now);
}

export type FetchOpts = {
  lane: string;
  gapMs?: number;
  timeoutMs?: number;
  method?: "GET" | "POST";
  body?: string;
  headers?: Record<string, string>;
};

export async function politeJson<T>(url: string, opts: FetchOpts): Promise<T> {
  await waitForLane(opts.lane, opts.gapMs ?? 1000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      body: opts.body,
      headers: { "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT, Accept: "application/json", ...opts.headers },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
    });
  } catch (e) {
    throw new UpstreamError(`${opts.lane} did not respond (${e instanceof Error ? e.message : "network error"})`);
  }
  if (res.status === 429 || res.status >= 500) {
    const retry = Number(res.headers.get("retry-after"));
    const cool = Number.isFinite(retry) && retry > 0 ? retry * 1000 : 30_000;
    const l = lanes.get(opts.lane);
    if (l) l.next = Math.max(l.next, Date.now() + cool);
    throw new UpstreamError(`${opts.lane} is rate limiting or down (HTTP ${res.status})`, res.status);
  }
  if (!res.ok) throw new UpstreamError(`${opts.lane} returned HTTP ${res.status}`, res.status);
  try {
    return (await res.json()) as T;
  } catch {
    throw new UpstreamError(`${opts.lane} returned unreadable data`);
  }
}

/** Test helper. */
export function resetLanes() {
  lanes.clear();
}

export class TtlCache<V> {
  private map = new Map<string, { v: V; exp: number }>();
  private inflight = new Map<string, Promise<V>>();
  private ttlMs: number;
  private max: number;
  constructor(ttlMs: number, max = 500) {
    this.ttlMs = ttlMs;
    this.max = max;
  }
  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.exp < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return e.v;
  }
  set(key: string, v: V) {
    if (this.map.size >= this.max) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, { v, exp: Date.now() + this.ttlMs });
  }
  /** Return the cached value, or run `fn` once (even if many callers ask at the same time). Errors are NOT cached. */
  async wrap(key: string, fn: () => Promise<V>): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const running = this.inflight.get(key);
    if (running) return running;
    const p = fn()
      .then((v) => {
        this.set(key, v);
        return v;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }
  clear() {
    this.map.clear();
    this.inflight.clear();
  }
}

const hits = new Map<string, number[]>();

/** Returns true if the caller is within the limit. */
export function allowRequest(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return true;
}
