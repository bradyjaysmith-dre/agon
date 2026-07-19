# Agon — Claude Code Context

Platform for posting and joining challenges (fitness, skill, savings, trivia,
etc.) either on a public board or within curated friend/family groups
("Circles"). Listed alongside the Coherence Suite and described as a sibling
to Pandora Bingo, but **not a Coherence Suite app** — it deliberately departs
from the suite's shared conventions in several places. Treat the deviations
below as intentional, not gaps to "fix" toward suite consistency.

## Status
Phase 0 skeleton built (2026-07-19): Express + Postgres backend, Clerk auth,
Circle invite-code join flow, challenge creation, progress logging +
confirmer approval, leaderboard, starter badge set. React + Vite frontend
wired up. Local git repo initialized on `main`, not yet pushed to a GitHub
remote, no commits made yet (scaffold is on disk, uncommitted). Postgres
runs locally via `docker-compose.yml`. Not yet deployed to Railway.

Still needed before family beta: real Clerk application + keys (server/.env
and client/.env currently hold placeholders), a GitHub remote, and a
Railway deploy.

## Location & Deployment
- Path (planned): `~/projects/agon`
- Repo: `agon` (mirrors `pandora-bingo`)
- Deploy: Railway, auto-deploy on push to `main`
- Commit flow: `git add . && git commit -m "message" && git push`
- Code delivery: git patch files (`format-patch` / `git am`), same pattern as
  Pandora Bingo, if Claude's sandbox has read-only repo access
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
  method, duration, eligibility, optional prize
- **Circle** — curated group (invite-code based, Pandora-Bingo-room-code
  style per current lean); challenges can be Circle-scoped or public-board
- **Confirmer** — originator or delegated proxy who confirms progress;
  cannot confirm their own entries (self-dealing guard)
- **Prize** — badge (Phase 0), gift card (Phase 1, third-party API), or cash
  (Phase 2, gated — see Legal Gate below)

## Data Model Sketch (starting point — see vision doc §9 for full detail)
`users`, `circles`, `circle_members`, `challenges`, `challenge_participants`,
`progress_entries`, `challenge_confirmers`, `prizes`, `payouts`, `badges`,
`user_badges`.

Notable constraints to preserve in migrations:
- `progress_entries.confirmed_by` must reference a valid `challenge_confirmers`
  row and cannot equal `progress_entries.user_id`
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
- **Phase 0 (current target) — Family Beta:** email/password + optional
  social auth, create/join challenges, Circle-only (invite code), progress
  tracking + confirmer approval, leaderboard, **non-tangible prizes only**,
  basic notifications.
- **Phase 1 — Hardening & Gift Cards:** gift-card prizes via third-party API,
  public board with moderation, proof-of-completion uploads, expanded
  eligibility rules.
- **Phase 2 — Cash Prize Pools:** conditional on legal review (see gate
  above). Stripe Connect or equivalent, state-aware rules, KYC/1099 handling.
- **Phase 3 — App Store Readiness:** React Native/Expo shell, store-compliant
  policies, production-grade auth/monitoring/support. Applies to both Agon
  and Pandora Bingo.

## Open Decisions Still Needing Answers (vision doc §10)
- 1a. Confirmation timing: per-entry vs. only-at-completion
- 1b. Dispute path if a confirmer declines to confirm (currently leaning
  "final for Phase 0, revisit later")
- Circle model: single invite code vs. persistent friends-list
- Badge system: build in-house for Phase 0 vs. free-text prize description
- Public board timing: any visibility in the family beta, or Circle-scoped
  until Phase 1
- Naming for "Circles" (vs. Leagues/Groups/Tribes)

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
Phase 0 skeleton is built (see Status above). Remaining before family beta:
1. Create a real Clerk application, drop the keys into `server/.env` /
   `client/.env` (currently placeholders), and manually verify a full
   sign-up → create Circle → join → create challenge → log progress →
   confirm → leaderboard flow end-to-end.
2. Push to a GitHub remote and set up Railway deploy (Postgres +
   Node/Express service + static frontend or a combined build).
3. Resolve remaining open items: dispute-path friction once real users hit
   it, whether the "Streaker" badge needs actual streak-tracking logic (not
   yet implemented — badge exists in the catalog but nothing awards it yet).
