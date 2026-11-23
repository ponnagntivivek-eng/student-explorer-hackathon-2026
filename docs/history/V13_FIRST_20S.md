# Student Explorer v13 — First 20–30 seconds magic

## Goal
Every new visitor (especially Indian college students) should understand the value, find something useful under 30 seconds, create or join a plan, and feel the urge to share it in their college WhatsApp group.

## What changed

### 1. First 20 seconds magic
- **Hero subtitle** rewritten to answer the real question: “Where should you go with friends this weekend without spending much?”
- Primary CTA chip: **“Under ₹300 near me”** (highlighted).
- Hint line under chips: “Tap a budget → see 3–5 strong picks → plan the outing in one click.”
- New **Instant Picks** section right under quick tiles:
  - Shows 4 strong, diverse recommendations immediately (location + budget aware).
  - Cards show name, area, distance, rating, price, and a clear “Plan this outing →”.
  - Tapping a card opens details and pre-fills Trip Planner stop 1, then scrolls to the planner.
  - “Plan a 2–3 stop outing” button pre-fills the top two picks into the planner and shows a delight toast.
  - Budget chips on the hero also refresh Instant Picks and scroll to them.
  - Light social-proof row under the cards (“Live student picks”, “Budgets are real student spends”, “Share the plan → friends can join”).
  - First-visit outline highlight once so the section is noticed.

### 2. Trip Planner → Share loop
- Planner header: “Plan a squad trip in 30 seconds” + clearer value copy.
- Primary button order: **Share clean plan on WhatsApp** first, then Invite squad, then Save.
- **WhatsApp share message** rewritten:
  - Short, exciting, works for people who have never used the app.
  - Clear stops, per-person range, total for the group, optional budget-cap status.
  - Ends with a one-line value prop + link to the planner.
- Squad invite message cleaned up similarly (join link + XP value).
- After sharing a plan: delight toast “Plan shared! 🎉 Your friends will love how clean this looks.”

### 3. Reduce complexity for new users
- First experience path is now: **Discover (Instant Picks / budget chips) → Plan → Share → Go**.
- Advanced systems (XP, rankings, badges, admin) stay intact but are no longer the first thing a visitor sees.

### 4. Trust & liveliness
- Weekly Student Picks subtitle: “Fresh this week — places students actually reviewed or verified. Real notes, real budgets.”
- Instant Picks uses live distance from GPS (or central Bengaluru fallback) and prefers places with photos, student tips, and good ratings.

### 5. One delightful moment
- Soft bottom toast after:
  - Sharing a trip plan
  - Verifying a visit (with XP message)
  - Pre-filling a multi-stop plan from Instant Picks
- First-visit visual pulse on Instant Picks.

## Files touched
- `src/explorer/body.html` — hero copy, Instant Picks section, trip planner copy
- `public/explorer/style.css` — Instant Picks layout, primary chip, delight toast
- `public/explorer/app.js` — Instant Picks scoring/render, improved share messages, delight helper, first-visit nudge

## How to try it
1. `npm install && npm run dev`
2. Open the home page (no login required for Instant Picks).
3. You should see 4 cards under “This weekend with friends under ₹300” within ~1 second.
4. Tap a card → details + planner pre-filled.
5. Or tap “Plan a 2–3 stop outing” → two stops filled → set budget → Share on WhatsApp and inspect the message.
6. (Optional) Detect live location and refresh picks.

Existing systems (budget calculator, verification, XP, squads, weekly picks, admin) are unchanged in behaviour — only the first experience is sharper and more shareable.
