/**
 * XP weighting (pure functions, unit tested).
 *
 * Goal: fill the map, not only reward tourism of famous spots, and reward QUALITY (useful reviews, photos) over volume.
 * Every award carries a plain-language `why` that is shown to the student in "Recent XP activity".
 */

export type Popularity = "quiet" | "normal" | "busy";

/** How crowded a place already is: verified visits + reviews. */
export function popularityOf(activity: number): Popularity {
  if (activity < 3) return "quiet";
  if (activity >= 15) return "busy";
  return "normal";
}

export type Award = { amount: number; reason: string; why: string };

export function visitAward(args: { placeName: string; popularity: Popularity; hiddenGem: boolean; strength: string; squadMembers?: number }): Award[] {
  const out: Award[] = [];
  const base = args.popularity === "busy" ? 20 : 30;
  out.push({ amount: base, reason: `Verified visit: ${args.placeName}`, why: args.popularity === "busy"
    ? "Your GPS was at this place. Famous spots earn a standard 20 XP because many students already cover them."
    : "Your GPS was at this place when you tapped Verify." });
  if (args.popularity === "quiet") out.push({ amount: 15, reason: `Quiet-place bonus: ${args.placeName}`, why: "Fewer than 3 students have checked in here, so you are helping fill the map." });
  if (args.hiddenGem) out.push({ amount: 40, reason: "Hidden gem discovery", why: "This place is marked as a hidden gem." });
  if ((args.squadMembers || 0) >= 2) out.push({ amount: 10, reason: "Squad check-in", why: `You verified with a squad of ${args.squadMembers}.` });
  return out;
}

/** Review XP: a useful review beats an empty one; the first useful review on a quiet place beats the 10th on a famous one. */
export function reviewAward(args: { placeName: string; commentLength: number; hasPhoto: boolean; priorReviews: number }): Award | null {
  const useful = args.commentLength >= 40;
  const some = args.commentLength >= 10;
  if (!some && !args.hasPhoto) return { amount: 3, reason: `Rating only: ${args.placeName}`, why: "A star rating with no written review earns a small 3 XP. Add what you spent and one tip to earn up to 15+." };
  let amount = useful ? 15 : 7;
  const parts: string[] = [useful ? "A useful written review" : "A short review"];
  if (args.hasPhoto) { amount += 10; parts.push("with a photo (+10)"); }
  if (useful && args.priorReviews === 0) { amount += 20; parts.push("first useful review on a place nobody reviewed yet (+20)"); }
  else if (useful && args.priorReviews < 3) { amount += 8; parts.push("this place has very few reviews (+8)"); }
  else if (args.priorReviews >= 10) { amount = Math.max(5, Math.round(amount * 0.5)); parts.push(`already ${args.priorReviews} reviews here, so reduced`); }
  return { amount, reason: `Review: ${args.placeName}`, why: parts.join(" ") + "." };
}

export function photoAward(args: { placeName: string; popularity: Popularity; hasReview: boolean }): Award {
  let amount = 20;
  const parts = ["Your photo was approved (20 XP)"];
  if (args.popularity === "quiet") { amount += 10; parts.push("quiet place bonus (+10)"); }
  if (args.hasReview) { amount += 5; parts.push("you also reviewed it (+5)"); }
  return { amount, reason: `Approved photo: ${args.placeName}`, why: parts.join(", ") + "." };
}

export const SQUAD_COMPLETION_XP = 40;
export const SQUAD_LEADER_PER_MEMBER_XP = 10;
export const SQUAD_LEADER_MEMBER_CAP = 5;
export const SQUAD_DAY_CHALLENGE_XP = 60;
export const SQUAD_DAY_MIN_FRIENDS = 3;
export const SQUAD_DAY_MIN_PLACES = 3;

export function leaderBonus(verifiedMembers: number): number {
  const others = Math.max(0, verifiedMembers - 1);
  return Math.min(others, SQUAD_LEADER_MEMBER_CAP) * SQUAD_LEADER_PER_MEMBER_XP;
}

/** "3 friends, 3 places, one day": each of >=3 members verified >=3 places the same IST day (squad's stops count). */
export function sharedChallengeMet(perMember: { userId: string; placesToday: number }[]): boolean {
  const ok = perMember.filter((m) => m.placesToday >= SQUAD_DAY_MIN_PLACES);
  return ok.length >= SQUAD_DAY_MIN_FRIENDS;
}
