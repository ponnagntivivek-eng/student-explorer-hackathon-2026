import test from "node:test";
import assert from "node:assert/strict";
import { decideVisit, coreRadiusM, impossibleTravel, suggestPinFromVisits } from "./visit-rules.ts";
import { reviewAward, visitAward, photoAward, popularityOf, leaderBonus, sharedChallengeMet } from "./xp-rules.ts";

test("exact pin, small venue: 10 m is fine, 300 m is not", () => {
  const cafe = { category: "food", name: "Third Wave Coffee", locationPrecision: "exact" };
  assert.equal(decideVisit({ distanceM: 10, accuracyM: 15, place: cafe }).ok, true);
  const far = decideVisit({ distanceM: 300, accuracyM: 15, place: cafe });
  assert.equal(far.ok, false);
});

test("large site (park) allows walking from the far gate", () => {
  const park = { category: "nature", name: "Lalbagh Botanical Garden", locationPrecision: "exact" };
  assert.equal(decideVisit({ distanceM: 380, accuracyM: 20, place: park }).ok, true);
  assert.equal(decideVisit({ distanceM: 900, accuracyM: 20, place: park }).ok, false);
});

test("area-only pin: visitor 1.5 km from the pin is accepted and the pin is flagged", () => {
  const stall = { category: "food", name: "Ramu Tiffin Room", locationPrecision: "area" };
  const d = decideVisit({ distanceM: 1500, accuracyM: 25, place: stall });
  assert.equal(d.ok, true);
  if (d.ok) { assert.equal(d.strength, "pin_uncertain"); assert.equal(d.reportPin, true); }
  assert.equal(decideVisit({ distanceM: 3500, accuracyM: 25, place: stall }).ok, false);
});

test("poor GPS is rejected with a helpful message; reported accuracy widens the radius but only up to 100 m", () => {
  const cafe = { category: "food", name: "Cafe", locationPrecision: "exact" };
  const bad = decideVisit({ distanceM: 20, accuracyM: 400, place: cafe });
  assert.equal(bad.ok, false);
  assert.equal(decideVisit({ distanceM: 215, accuracyM: 100, place: cafe }).ok, true);
  assert.equal(decideVisit({ distanceM: 400, accuracyM: 100, place: cafe }).ok, false);
});

test("tight vs generous radius for a built-in pin", () => {
  assert.equal(coreRadiusM({ category: "food", name: "Church Street" }), 900); // street => large site
  assert.equal(coreRadiusM({ category: "food", name: "Small cafe" }), 400);
});

test("impossible travel between verified visits", () => {
  const t0 = Date.now();
  assert.equal(impossibleTravel({ lat: 12.97, lng: 77.59, atMs: t0 }, { lat: 13.37, lng: 77.68, atMs: t0 + 5 * 60_000 }), true);
  assert.equal(impossibleTravel({ lat: 12.97, lng: 77.59, atMs: t0 }, { lat: 12.95, lng: 77.58, atMs: t0 + 30 * 60_000 }), false);
});

test("pin correction suggestion needs agreeing visitors", () => {
  const pin = { lat: 12.9, lng: 77.6 };
  const v = [{ lat: 12.915, lng: 77.6, accuracy: 20 }, { lat: 12.9152, lng: 77.6001, accuracy: 25 }];
  const s = suggestPinFromVisits(pin, v);
  assert.ok(s && s.offsetM > 1000);
  assert.equal(suggestPinFromVisits(pin, [v[0]]), null);
  assert.equal(suggestPinFromVisits(pin, [{ lat: 12.95, lng: 77.6, accuracy: 20 }, { lat: 12.85, lng: 77.6, accuracy: 20 }]), null);
});

test("XP quality: review+photo > review > empty; first useful review on a quiet place > 10th on a famous one", () => {
  const empty = reviewAward({ placeName: "X", commentLength: 0, hasPhoto: false, priorReviews: 0 })!;
  const plain = reviewAward({ placeName: "X", commentLength: 80, hasPhoto: false, priorReviews: 5 })!;
  const photo = reviewAward({ placeName: "X", commentLength: 80, hasPhoto: true, priorReviews: 5 })!;
  const firstQuiet = reviewAward({ placeName: "Quiet", commentLength: 80, hasPhoto: false, priorReviews: 0 })!;
  const tenthFamous = reviewAward({ placeName: "Cubbon", commentLength: 80, hasPhoto: false, priorReviews: 12 })!;
  assert.ok(empty.amount < plain.amount && plain.amount < photo.amount);
  assert.ok(firstQuiet.amount > tenthFamous.amount);
  assert.ok(firstQuiet.why.length > 20 && tenthFamous.why.includes("reduced"));
});

test("visit XP favours quiet places and always explains itself", () => {
  const quiet = visitAward({ placeName: "Hidden", popularity: popularityOf(0), hiddenGem: false, strength: "precise" });
  const busy = visitAward({ placeName: "Cubbon", popularity: popularityOf(40), hiddenGem: false, strength: "precise" });
  const sum = (a: { amount: number }[]) => a.reduce((n, x) => n + x.amount, 0);
  assert.ok(sum(quiet) > sum(busy));
  assert.ok(quiet.every((a) => a.why && a.reason));
  assert.ok(photoAward({ placeName: "P", popularity: "quiet", hasReview: true }).amount > photoAward({ placeName: "P", popularity: "busy", hasReview: false }).amount);
});

test("squad rules", () => {
  assert.equal(leaderBonus(1), 0);
  assert.equal(leaderBonus(4), 30);
  assert.equal(leaderBonus(20), 50);
  assert.equal(sharedChallengeMet([{ userId: "a", placesToday: 3 }, { userId: "b", placesToday: 3 }, { userId: "c", placesToday: 3 }]), true);
  assert.equal(sharedChallengeMet([{ userId: "a", placesToday: 3 }, { userId: "b", placesToday: 2 }, { userId: "c", placesToday: 3 }]), false);
});
