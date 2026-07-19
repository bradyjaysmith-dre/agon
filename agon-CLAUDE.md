# Agon — Claude Code Context

Platform for posting and joining challenges (fitness, skill, savings, trivia,
etc.) either on a public board or within curated friend/family groups
("Circles"). Listed alongside the Coherence Suite and described as a sibling
to Pandora Bingo, but **not a Coherence Suite app** — it deliberately departs
from the suite's shared conventions in several places. Treat the deviations
below as intentional, not gaps to "fix" toward suite consistency.

## Status
**Phase 0 manually tested end-to-end by Dre (2026-07-19) — passed.** Two
bugs found during that testing (progress-logging route mismatch, unclear
challenge-card click affordance) were fixed same day (see version log in
`README_agon.md`).

**Phase 1 pivoted from the original plan.** Dre wants challenges to be
*structurally* customizable (different mechanics per type, not just
different copy) before gift cards/public board/proof uploads/eligibility
rules — those four are explicitly deferred, not cancelled. First new type:
single-elimination tournament brackets (chess tournament was the motivating
example). See "Challenge Types" below for the architecture.

**Tournament brackets tested and passed by Dre (2026-07-19).** Same day,
added challenge lifecycle management (pause/resume, cancel, delete,
restart, kick a participant — originator only) and member removal (Circle
creator only). See "Challenge Lifecycle & Moderation" below for the exact
rules — several of them (what restart clears vs. keeps, why kick is
blocked mid-tournament, why deleting a challenge doesn't delete badges)
are not obvious from the route names alone.

Phase 0 skeleton built (2026-07-19) and deployed to Railway the same day:
Express + Postgres backend, Clerk auth, Circle invite-code join flow,
challenge creation, progress logging + confirmer approval, leaderboard,
starter badge set. React + Vite frontend wired up. Pushed to
`github.com/bradyjaysmith-dre/agon` on `main`; Railway project `agon`
(workspace bradyjaysmith-dre's Projects) has three services — `Postgres`,
`agon-server` (root dir `server/`), `agon-client` (root dir `client/`) —
auto-deploying on every push to `main`. Live URLs:
- Backend: https://agon-server-production-30c9.up.railway.app
- Frontend: https://agon-client-production.up.railway.app

Clerk is fully wired up as of 2026-07-19 (test-mode instance —
`pk_test_.../sk_test_...`, fine for family beta, no need for a production
Clerk instance yet): `CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY` set on
`agon-server`, `VITE_CLERK_PUBLISHABLE_KEY` set on `agon-client` (same
publishable key value on both). Verified end-to-end against the live
deploy: unauthenticated/invalid-token requests to `agon-server` correctly
return `401 {"error":"Unauthorized"}`, not a crash or redirect.

**Known Clerk/Express gotcha fixed:** `requireAuth()` from `@clerk/express`
unconditionally does `response.redirect(signInUrl)` for any unauthenticated
request — no content negotiation, no JSON option, built for server-rendered
apps. Wrong for a pure JSON API like this one (there's no sign-in page on
the API's own domain, so it was redirecting to a 404). Fixed in
`server/src/middleware/ensureUser.js` by checking `getAuth(req).userId`
directly and returning `res.status(401).json(...)` instead of using
`requireAuth()`. Keep this in mind for any new Clerk-gated route — don't
reach for `requireAuth()` here.

## Location & Deployment
- Path: `~/projects/agon`
- Repo: `agon`, GitHub `bradyjaysmith-dre/agon`, default branch `main`
- Deploy: Railway, auto-deploy on push to `main` (already wired up and live)
- Railway infra is managed as code in `.railway/railway.ts` (services,
  Postgres, root directories, cross-service env var references). Workflow:
  edit `.railway/railway.ts` → `railway config plan` → review → `railway config apply`.
  Requires the `railway` npm package (root `package.json` devDependency) and
  `railway login` (browser OAuth; use `--browserless` only if no local
  browser is available). Domains and any secret values (Clerk keys) are
  managed imperatively via `railway domain` / `railway variable set`, not
  written into `railway.ts` — see the file's own generated
  `.agents/skills/railway-config/SKILL.md` for the house rules (never commit
  generated domains, UUIDs, or secret values into source).
- Commit flow: `git add . && git commit -m "message" && git push` (pushing
  to `main` triggers Railway auto-deploy on both services)
- Milestone snapshots: `archive.sh` (rsync-based) → `~/agon-milestones/<name>/`
  — note this is a top-level path, not under `~/backups/` like the rest of
  the suite's post-migration milestone convention; worth deciding whether to
  align it to `~/backups/agon-milestones/` before it accumulates snapshots
- README: `README_agon.md`, following Dre's per-project README convention

## Stack — Where Agon Diverges from the Coherence Suite

| Layer | Coherence Suite default | Agon |
|---|---|---|
| Database | SQLite always | **Postgres** (Railway-native) — challenges, users, Circles, entries, and financial records need transactional integrity SQLite-on-a-volume isn't suited for |
| Auth | Custom JWT, shared `JWT_SECRET` across suite | **Clerk** (decided 2026-07-19; `@clerk/express` on the backend, `@clerk/clerk-react` on the frontend) — buys password hashing, sessions, social login, MFA. Agon auth does **not** participate in the suite's cross-app `JWT_SECRET` pattern |
| Frontend (Phase 0–1) | React + Vite | Same — React + Vite web app |
| Frontend (Phase 3) | N/A | React Native via Expo, for real iOS/Android store builds |
| Backend | Node/Express | Same — Node/Express, Socket.io only for genuinely real-time features (live leaderboards, notifications), not full in-memory state like Pandora Bingo |
| Hosting | Local (`start.sh`) or Railway (Pandora Bingo) | Railway, continuing through Phase 1–2 |

If a task on this app assumes SQLite or the shared `JWT_SECRET`, stop and
confirm — those are Coherence Suite defaults that were explicitly rejected
for Agon in the vision doc (§8).

## Core Concepts (for schema/route naming)
- **Challenge** — created by an **originator**; has rules, verification
  method, duration, eligibility, optional prize, and a **challenge_type**
  (see "Challenge Types" below)
- **Circle** — curated group (invite-code based, Pandora-Bingo-room-code
  style per current lean); challenges can be Circle-scoped or public-board
- **Confirmer** — originator or delegated proxy who confirms progress (or,
  for tournaments, records match results); cannot confirm/record their own
  (self-dealing guard, enforced at both the DB and app layer)
- **Prize** — badge (Phase 0), gift card (Phase 1, third-party API), or cash
  (Phase 2, gated — see Legal Gate below)

## Challenge Types (Phase 1 architecture, added 2026-07-19)
Deliberately a **fixed set of built-in types**, not a no-code/plugin
builder — that was an explicit scope decision with Dre (a true in-app
type-builder was considered and rejected as too large). `challenges.challenge_type`
gates which schema/routes/UI apply:
- **`simple_progress`** (Phase 0 default) — log progress entries, confirmer
  approval, leaderboard. Routes in `challenges.js`/`progress.js`. Frontend:
  `client/src/components/SimpleProgressView.jsx`.
- **`tournament_bracket`** — single-elimination bracket. New table
  `tournament_matches` (round, match_index, two participant slots, winner,
  status pending/ready/completed). Routes in `server/src/routes/tournaments.js`
  (mounted at `/api/tournaments`). Frontend:
  `client/src/components/TournamentBracketView.jsx`. Key design points if
  extending this: bracket generation (bye/seeding math) and winner
  propagation both live in `tournaments.js` and are covered by a hand-worked
  proof (bye count is always < round-1 match count when bracket size is the
  minimal power of two ≥ N, so no match ever gets two byes) — don't touch
  that math without re-deriving it. `/start` requires either one confirmer
  who never plays, or 2+ confirmers total (relaxed 2026-07-19 at Dre's
  request — two confirmers can cross-confirm each other's *different*
  matches even if both are playing; only recording your own match is
  blocked). This doesn't fully rule out deadlock — if the tournament has
  exactly those 2 confirmers as its only 2 participants, their one shared
  match still can't be recorded by either — but confirmers can be added to
  a challenge at any time via `ConfirmersPanel`, even mid-tournament, so
  that's now a self-service fix rather than something `/start` needs to
  prevent outright. Keep that recoverability in mind before re-tightening
  this guard.
- Adding a third type follows the same pattern: new `challenge_type` enum
  value, its own route file if the mechanics differ enough, its own
  frontend component, and `ChallengePage.jsx` dispatches on
  `challenge.challenge_type`. Existing types' routes (`progress.js`'s
  progress/leaderboard endpoints, `challenges.js`'s manual `/complete`) all
  gate on `challenge_type` — do the same for any new type's routes that
  shouldn't apply cross-type.

## Challenge Lifecycle & Moderation (added 2026-07-19)
`challenges.status` is now `active | paused | completed | cancelled`
(migration 003 added `paused`). All actions below are originator-only
unless noted, live in `challenges.js` (except kick's tournament guard,
which checks `tournament_matches`), and reload via `ChallengePage.jsx`'s
`ManageChallengePanel` / `ParticipantsPanel`:
- **Pause/resume** — `paused` blocks join, progress logging, entry
  confirmation, tournament start, and match recording (checked server-side
  in `progress.js` and `tournaments.js`, not just hidden in the UI).
  Editing, adding confirmers, and kicking are still allowed while paused —
  those are admin actions, not gameplay.
- **Cancel** — soft, `status='cancelled'`. Blocked if already
  cancelled/completed.
- **Delete** — hard `DELETE FROM challenges`, cascades to participants/
  confirmers/progress_entries/tournament_matches via existing FKs.
  `user_badges.challenge_id` is `ON DELETE SET NULL` — a badge someone
  earned survives the challenge being deleted, just loses the backlink.
- **Restart** — clears `progress_entries` (simple_progress) or
  `tournament_matches` (tournament_bracket), plus any `user_badges` tied to
  that challenge_id, and resets `status='active'`. **Participants and
  confirmers are deliberately kept** — restart resets the outcome, not the
  roster. For a tournament, this means the next `/start` call re-shuffles
  and regenerates the bracket from scratch (reuses the same generation
  code, not a separate implementation).
- **Kick a participant** — soft, `challenge_participants.status='disqualified'`
  (leaderboard query now filters `cp.status='active'`, a latent bug fixed
  at the same time). **Blocked once a tournament's bracket has started**
  (`tournament_matches` rows exist) — removing a seeded player mid-bracket
  has no sane resolution without match-forfeit logic, which this pass
  didn't build. Originator can't kick themselves.
- **Circle member removal** (`circles.js`, Circle creator/`owner_id` only,
  not any admin) — hard `DELETE FROM circle_members`. Doesn't retroactively
  touch their history in challenges they already joined within that
  Circle, only revokes future circle-scoped access (`loadMembership`
  returns null for them going forward). Owner can't remove themselves.

## Data Model Sketch (starting point — see vision doc §9 for full detail)
`users`, `circles`, `circle_members`, `challenges`, `challenge_participants`,
`progress_entries`, `challenge_confirmers`, `tournament_matches`, `prizes`,
`payouts`, `badges`, `user_badges`.

Notable constraints to preserve in migrations:
- `progress_entries.confirmed_by` must reference a valid `challenge_confirmers`
  row and cannot equal `progress_entries.user_id`
- `tournament_matches` mirrors that same self-dealing shape:
  `recorded_by` can't equal either participant slot, and `winner_id` must be
  one of the two participant slots (both DB-level CHECKs)
- `payouts` intentionally lives outside Agon's own custody (routed through a
  third-party payment processor, not an internal ledger) — see Legal Gate

## ⚠ Legal Gate — Cash Prizes (Phase 2)
**Do not build entry-fee or cash-payout code without an explicit go-ahead.**
The vision doc (§7) is explicit that this is gated behind a legal consult:
- Combining an entry fee (consideration) with a cash prize risks the
  "illegal lottery" classification unless the contest is genuinely,
  defensibly skill-determined — states vary on how much chance is tolerated.
- If Agon ever holds funds — even briefly — before forwarding to a winner,
  that generally triggers money-transmitter licensing obligations. The
  designed-in mitigation is to never custody funds directly (route through
  Stripe Connect or an equivalent payment facilitator) — but per the vision
  doc, "we're just using Stripe" is not automatically sufficient on its own.
- Phase 0–1 (badges, then gift cards via Tremendous/Tango Card) carry none
  of this risk and are fine to build freely.

If a task looks like it's drifting toward entry-fee or payout logic, flag it
back to Dre rather than proceeding.

## Phased Roadmap (see vision doc §5 for full detail)
- **Phase 0 — Family Beta — DONE, tested and passed 2026-07-19:**
  email/password + optional social auth, create/join challenges, Circle-only
  (invite code), progress tracking + confirmer approval, leaderboard,
  non-tangible prizes only, basic notifications.
- **Phase 1 (current target) — pivoted 2026-07-19 to customizable challenge
  types first** (see "Challenge Types" above), starting with tournament
  brackets. The original Phase 1 plan — gift-card prizes via third-party
  API, public board with moderation, proof-of-completion uploads, expanded
  eligibility rules — is deferred, not cancelled; resume it once challenge
  types are done or Dre redirects.
- **Phase 2 — Cash Prize Pools:** conditional on legal review (see gate
  above). Stripe Connect or equivalent, state-aware rules, KYC/1099 handling.
- **Phase 3 — App Store Readiness:** React Native/Expo shell, store-compliant
  policies, production-grade auth/monitoring/support. Applies to both Agon
  and Pandora Bingo.

## Backlog (explicitly not yet scheduled)
- **In-app Circle invites via email/SMS** — Dre requested this 2026-07-19
  but explicitly deferred it to "a later phase," not Phase 1. Today,
  inviting someone means manually sharing the app URL + invite code outside
  the app. Needs: an email provider (transactional email, e.g. Resend/Postmark)
  and/or SMS provider (e.g. Twilio) — don't build without picking those and
  confirming timing with Dre first.

## Decisions Log (vision doc §10 — resolved before Phase 0 build, for history)
Confirmation timing (originator's choice, per-challenge), dispute path
(confirmer's word is final for Phase 0), Circle model (invite code), badge
system (in-house starter set), public board timing (Circle-scoped — still
true today; the Phase 1 pivot to challenge types didn't touch this), and the
"Circles" name were all resolved before Phase 0 was built. Full detail in
`Agon_Vision_Document.md` §10 if the reasoning behind any of these ever
needs revisiting.

## Suite-Wide Conventions That *Do* Still Apply
- Complete replacement files for complex components; targeted edits for
  simple changes
- Quick answers first, then caveats
- Honest pushback welcome — yield when directed to relent
- No TypeScript unless asked
- Dark theme on all apps
- Build-time frontend deps in `dependencies` not `devDependencies` if using
  Railway/Nixpacks (the gotcha that bit Pandora Bingo)

## Next Session Tasks
1. Dre needs to manually test the tournament bracket flow end-to-end in the
   browser (create a `tournament_bracket` challenge, join with 3+ accounts,
   start it, record match results as a non-competing confirmer, confirm the
   champion badge lands) — this was verified at the SQL/algorithm level
   during development but not yet through the real UI with real accounts.
2. The "Streaker" badge still has no award logic (exists in the catalog,
   nothing grants it) — pre-existing gap, not part of this pass.
3. Once challenge types are confirmed working, either continue adding types
   or resume the original Phase 1 plan (gift cards, public board, proof
   uploads, eligibility rules) — ask Dre which.
