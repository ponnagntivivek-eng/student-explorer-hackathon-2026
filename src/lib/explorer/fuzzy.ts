/**
 * Typo-tolerant matching for place / area search.
 * Handles: misspellings (koramngala), swapped letters, missing/extra letters, doubled letters,
 * spelling variants (bangalore/bengaluru, w/v, ph/f, ee/i, oo/u, th/t, kh/k ...), sound-alikes,
 * partial words, word-order changes, and multi-word queries.
 */

const VARIANTS: [RegExp, string][] = [
  [/bengaluru|bangalore|banglore|bengalore/g, "bengaluru"],
  [/ph/g, "f"],
  [/kh/g, "k"],
  [/gh/g, "g"],
  [/dh/g, "d"],
  [/bh/g, "b"],
  [/th/g, "t"],
  [/sh|ch(?=[aeiou])/g, "s"],
  [/ee|ea|ie/g, "i"],
  [/oo|ou/g, "u"],
  [/w/g, "v"],
  [/z/g, "s"],
  [/c(?=[eiy])/g, "s"],
  [/c/g, "k"],
  [/q/g, "k"],
  [/x/g, "ks"],
  [/y(?=[^aeiou]|$)/g, "i"],
];

export function normalize(input: unknown): string {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sound-alike key: spelling variants folded, doubled letters collapsed, vowels dropped (except first letter). */
export function phoneticKey(word: string): string {
  let s = normalize(word).replace(/\s/g, "");
  for (const [re, to] of VARIANTS) s = s.replace(re, to);
  s = s.replace(/(.)\1+/g, "$1");
  if (!s) return "";
  return s[0] + s.slice(1).replace(/[aeiou]/g, "");
}

/** Optimal-string-alignment distance (counts a swapped neighbouring pair as ONE typo). */
export function editDistance(a: string, b: string, max = 99): number {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  const d: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[la][lb];
}

function trigrams(s: string): Set<string> {
  const p = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  return out;
}

function trigramSim(a: string, b: string): number {
  const A = trigrams(a), B = trigrams(b);
  let inter = 0;
  A.forEach((t) => { if (B.has(t)) inter++; });
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

/** 0..1 similarity between ONE query word and ONE target word. */
export function wordScore(q: string, t: string): number {
  if (!q || !t) return 0;
  if (q === t) return 1;
  if (t.startsWith(q) && q.length >= 2) return 0.92 - Math.min(0.1, (t.length - q.length) * 0.01);
  if (q.length >= 3 && t.includes(q)) return 0.8;
  if (t.length >= 3 && q.includes(t) && t.length >= q.length - 2) return 0.7;
  const maxTypos = q.length <= 3 ? 0 : q.length <= 5 ? 1 : q.length <= 9 ? 2 : 3;
  const dist = editDistance(q, t, maxTypos + 1);
  let best = 0;
  if (dist <= maxTypos) best = 0.9 - dist * 0.12;
  // typing a prefix with typos: compare against same-length start of the target
  if (t.length > q.length && q.length >= 4) {
    const pd = editDistance(q, t.slice(0, q.length), 1);
    if (pd <= 1) best = Math.max(best, 0.78 - pd * 0.1);
  }
  const pq = phoneticKey(q), pt = phoneticKey(t);
  if (pq.length >= 3 && pq === pt) best = Math.max(best, 0.82);
  else if (pq.length >= 4 && pt.length >= 4 && editDistance(pq, pt, 1) <= 1) best = Math.max(best, 0.68);
  const tri = trigramSim(q, t);
  if (q.length >= 4 && tri >= 0.4) best = Math.max(best, 0.35 + tri * 0.4);
  return best;
}

/** 0..1 similarity between a query and a longer text (every query word must find a home). */
export function textScore(query: string, text: string): number {
  const q = normalize(query);
  const t = normalize(text);
  if (!q || !t) return 0;
  if (t === q) return 1;
  if (t.includes(q)) return 0.9;
  const qw = q.split(" ");
  const tw = t.split(" ");
  let total = 0;
  for (const w of qw) {
    let best = 0;
    for (const x of tw) { const s = wordScore(w, x); if (s > best) best = s; }
    // also try the query word against two glued words ("church street" typed as "churchstreet")
    if (best < 0.8) for (let i = 0; i < tw.length - 1; i++) best = Math.max(best, wordScore(w, tw[i] + tw[i + 1]));
    total += best;
  }
  let score = total / qw.length;
  // whole-string similarity catches glued/split words and heavy typos
  const whole = wordScore(q.replace(/\s/g, ""), t.replace(/\s/g, ""));
  return Math.max(score, whole * 0.95);
}

export type FuzzyField = { text: unknown; weight: number };

/** Best weighted score of a query across several fields. */
export function fuzzyScore(query: string, fields: FuzzyField[]): number {
  let best = 0;
  for (const f of fields) {
    const s = textScore(query, String(f.text ?? "")) * f.weight;
    if (s > best) best = s;
  }
  return best;
}

export function bestKeyMatch(query: string, keys: string[]): { key: string; score: number } | null {
  let best: { key: string; score: number } | null = null;
  for (const key of keys) {
    const s = textScore(query, key);
    if (!best || s > best.score) best = { key, score: s };
  }
  return best;
}
