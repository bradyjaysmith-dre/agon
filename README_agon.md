# Agon

*Brought to you by the creators of Pandora Bingo.*

Post a challenge — fitness feat, skill contest, savings goal, trivia
gauntlet, whatever — to a public board or to a curated "Circle" of friends
and family. Track progress, get it confirmed by the originator (or a
delegated proxy), climb the leaderboard, earn badges.

## Version Log
- **0.1.0** (2026-07-19) — Phase 0 skeleton: Express + Postgres backend,
  Clerk auth, Circle invite-code join flow, challenge creation, progress
  logging + confirmer approval, leaderboard, starter badge set. No public
  board, no gift cards, no cash — see roadmap below.
- **0.1.1** (2026-07-19) — Deployed to Railway (auto-deploy on push to
  `main`): https://agon-server-production-30c9.up.railway.app (API),
  https://agon-client-production.up.railway.app (frontend).
- **0.1.2** (2026-07-19) — Real Clerk test-mode keys wired up on both
  services; fixed a bug where `@clerk/express`'s `requireAuth()` redirected
  unauthenticated API requests instead of returning JSON (see
  `agon-CLAUDE.md`). Verified end-to-end: backend correctly returns
  `401 {"error":"Unauthorized"}` for missing/invalid auth.
- **0.1.3** (2026-07-19) — Fixed family-beta-blocking bug found by Dre in
  manual testing: the "Log Progress" button 404'd on every submission
  (frontend called `/api/challenges/:id/progress`, but that route only
  exists at `/api/progress/challenges/:id/progress` — a leftover mismatch
  from splitting routes into `circles.js`/`challenges.js`/`progress.js`).
  Also made challenge cards on the Circle page visibly clickable (previously
  looked like a static panel, no affordance to open the challenge detail
  page where progress/leaderboard/confirm live).
- **0.1.4** (2026-07-19) — Dre re-tested end-to-end: **Phase 0 passed.**
  Ready for family beta invites.
- **0.2.0** (2026-07-19) — Phase 1, pivoted: challenges now have a
  `challenge_type`. Added the first new type, single-elimination tournament
  brackets (seeding/byes, match recording, auto-advancing bracket, champion
  badge) alongside the original progress-tracking type. New "Challenge type"
  selector when creating a challenge. Gift cards/public board/proof
  uploads/eligibility rules (the original Phase 1 plan) are deferred, not
  cancelled — see `agon-CLAUDE.md`.
- **0.2.1** (2026-07-19) — Real Intro/About landing page for signed-out
  visitors (wreath wordmark, agon etymology, About tab), replacing the
  bare-bones placeholder. One deliberate exception to inline-styles-only:
  this page has its own scoped CSS file for animations/hover/responsive
  layout — see `client/src/pages/IntroPage.css`.
- **0.2.2** (2026-07-19) — Added the confirmer-adding feature that
  tournament brackets actually depend on (originator was always the sole
  confirmer with no way to add another — see `agon-CLAUDE.md`). Added
  challenge editing (title/description/confirmation timing, originator
  only). Fixed a client cache bug: `index.html` had no explicit
  `Cache-Control`, so browsers could keep serving a stale build after a
  deploy — `client/public/serve.json` now forces revalidation on
  `index.html` while long-caching the hashed asset files.
- **0.2.3** (2026-07-19) — Dre tested tournament brackets end to end:
  **passed.** Relaxed the `/start` confirmer guard (2+ confirmers is now
  enough even if both are playing, not just a confirmer who never plays).
  Added challenge lifecycle management for the originator (pause/resume,
  cancel, delete, restart from the beginning, kick a participant) and
  circle-member removal for the Circle creator — see `agon-CLAUDE.md` for
  the exact rules (new `paused` status, what restart clears vs. keeps,
  why kicking a tournament participant is blocked once the bracket has
  started).
- **0.2.4** (2026-07-19) — Dre tested the lifecycle/moderation features
  (pause/resume, cancel, delete, restart, kick a participant, remove a
  Circle member): **passed.**
- **0.3.0** (2026-07-19) — Visual redesign: the Intro page's ancient-Greek
  theme (Cinzel/Cormorant Garamond/Source Serif 4 fonts, ink/bone/clay/
  bronze/olive palette) now extends across the whole authenticated app,
  replacing the plain generic dark theme it had before. `theme.js`'s
  structural styles are CSS classes now (`client/src/app.css`), not inline
  style objects, so buttons/links get real hover states. New reusable
  `Laurel` wreath component (same wreath as the Intro page's wordmark)
  frames earned badges and the tournament champion banner — the two
  moments in the app that are actually about winning.

## Stack
- Frontend: React + Vite (`client/`)
- Backend: Node/Express (`server/`)
- Database: Postgres (Docker Compose locally, Railway in production)
- Auth: Clerk (`@clerk/express` on the backend, `@clerk/clerk-react` on the frontend)

This app deliberately departs from the Coherence Suite's shared
conventions (SQLite, shared `JWT_SECRET`) — see `agon-CLAUDE.md` for why.

## Local Development

### 1. Start Postgres
```bash
docker-compose up -d
```
(This machine has the legacy `docker-compose` v1 binary rather than the
`docker compose` plugin — use the hyphenated form.)

### 2. Configure environment
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Fill in `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` (server) and
`VITE_CLERK_PUBLISHABLE_KEY` (client) from your Clerk dashboard
(dashboard.clerk.com — create a free application if you don't have one yet).

### 3. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 4. Run migrations
```bash
cd server && npm run migrate
```

### 5. Run the app
```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```
Server: http://localhost:4000 · Client: http://localhost:5173

## Deployment (Railway)
Auto-deploys on every push to `main`. Project `agon` has three services:
`Postgres`, `agon-server` (root dir `server/`), `agon-client` (root dir
`client/`). Infra is defined in `.railway/railway.ts`:
```bash
railway login          # browser OAuth, one-time
railway config plan    # preview changes against .railway/railway.ts
railway config apply   # apply after reviewing the plan
```
Domains and secrets (Clerk keys) are set imperatively, not in source:
```bash
railway variable set CLERK_SECRET_KEY=... CLERK_PUBLISHABLE_KEY=... --service agon-server
railway variable set VITE_CLERK_PUBLISHABLE_KEY=... --service agon-client
railway redeploy --service agon-client   # VITE_* vars are baked at build time
```

## Data Model
`users`, `circles`, `circle_members`, `challenges`, `challenge_participants`,
`challenge_confirmers`, `progress_entries`, `tournament_matches`, `badges`,
`user_badges`. Full detail across `server/migrations/001_init.sql` (base
schema), `002_tournament_brackets.sql` (`challenge_type`,
`tournament_matches`), and `003_challenge_lifecycle.sql` (`paused` status).
`prizes`/`payouts` tables are intentionally not built yet — see the Legal
Gate below.

## ⚠ Legal Gate — Cash Prizes
Do not build entry-fee or cash-payout code without an explicit go-ahead —
see `agon-CLAUDE.md` and the Agon Vision Document §7. Phase 0–1 (badges,
then gift cards) carry none of this risk.

## Roadmap
- **Phase 0 — done, tested and passed.** Circles, challenges, progress
  tracking, confirmer approval, leaderboard, badges.
- **Phase 1 — in progress, pivoted to customizable challenge types.**
  Shipped and tested: `challenge_type` architecture, single-elimination
  tournament brackets, challenge lifecycle management (pause/cancel/
  delete/restart/kick), Circle member removal. The original Phase 1 plan
  (gift-card prizes via Tremendous/Tango Card, public board with
  moderation, proof-of-completion uploads, expanded eligibility rules) is
  deferred, not cancelled — see `agon-CLAUDE.md`.
- **Phase 2** — Cash prize pools, conditional on legal review.
- **Phase 3** — React Native/Expo app store builds.

See `agon-CLAUDE.md` and `Agon_Vision_Document.md` for full context.
