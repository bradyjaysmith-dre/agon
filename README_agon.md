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
docker compose up -d
```

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

## Data Model
`users`, `circles`, `circle_members`, `challenges`, `challenge_participants`,
`challenge_confirmers`, `progress_entries`, `badges`, `user_badges`. Full
detail in `server/migrations/001_init.sql`. `prizes`/`payouts` tables are
intentionally not built yet — see the Legal Gate below.

## ⚠ Legal Gate — Cash Prizes
Do not build entry-fee or cash-payout code without an explicit go-ahead —
see `agon-CLAUDE.md` and the Agon Vision Document §7. Phase 0–1 (badges,
then gift cards) carry none of this risk.

## Roadmap
- **Phase 0 (current)** — Family beta: Circles, challenges, progress
  tracking, confirmer approval, leaderboard, badges.
- **Phase 1** — Gift-card prizes (Tremendous/Tango Card), public board with
  moderation, proof-of-completion uploads.
- **Phase 2** — Cash prize pools, conditional on legal review.
- **Phase 3** — React Native/Expo app store builds.

See `agon-CLAUDE.md` and `Agon_Vision_Document.md` for full context.
