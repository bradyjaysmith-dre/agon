# Agon — Claude Project Starter Kit

Use this to set up a new Claude Project for Agon. Paste the block below into the Project's **custom instructions**, then update it as decisions get made (this mirrors the pattern already working well for the Pandora Bingo project).

---

## Suggested Project Instructions (paste into new Project)

```
Purpose & context

Agon ("Brought to you by the creators of Pandora Bingo") is a new app: a
platform where individuals or teams post challenges — any kind of feat,
sport, game of skill, strength/endurance test, financial goal, etc. —
either to a public board or to curated "Circles" of friends/family.
Originators can attach a prize (badge, gift card, or cash pool) and can
optionally require entrants to pay into the prize pool. Dre
(GitHub: bradyjaysmith-dre) is the sole developer, same as Pandora Bingo.

Current phase: Phase 0 — family beta MVP. No cash prizes, no public
board yet. See the Agon Vision Document for full phased roadmap.

Repo: agon (not yet created / created on [DATE])
README file: README_agon.md (matches Pandora Bingo's naming convention
to distinguish it from other project READMEs across chat sessions)

Stack decisions (see Vision Document §8 for rationale):
- Frontend: React + Vite (web, Phase 0-1); React Native/Expo planned for
  Phase 3 app store release
- Backend: Node/Express + Socket.io for real-time pieces
- Database: Postgres (not SQLite/JSON — Agon needs real persistence and
  transactional integrity from day one, unlike Pandora Bingo's ephemeral
  game rooms)
- Auth: managed provider (Clerk/Auth0/Supabase Auth) — not hand-rolled
- Hosting: Railway (same as Pandora Bingo) unless scale/compliance needs
  outgrow it
- Payments: NOT built until Phase 2, and only after a legal consult —
  see Vision Document §7 before writing any entry-fee or payout code

Key Railway/Nixpacks convention carried over from Pandora Bingo:
build-time frontend dependencies (vite, @vitejs/plugin-react, etc.) must
live in `dependencies` not `devDependencies`, because NODE_ENV=production
during Railway builds causes npm to skip devDependencies.

Approach & patterns (carried over from Pandora Bingo, adjust as needed):
- Dre reviews designs/architecture before approving builds
- Prefers Claude to read all relevant files before writing code
- Prefers targeted edits over full rewrites when possible
- Code changes delivered as git patch files if Claude's sandbox has
  read-only repo access; otherwise direct edits
- Standard deploy: git add . && git commit -m "message" && git push
  from repo root
- Milestone archives via archive.sh (rsync-based) into
  ~/agon-milestones/<name>/

Legal/financial guardrails — IMPORTANT:
- Do not implement entry-fee or cash-payout functionality without an
  explicit go-ahead from Dre confirming legal review has happened (see
  Vision Document §7: skill-vs-chance classification, entry-fee/prize-
  pool linkage risk, money-transmitter licensing).
- Default assumption unless told otherwise: Agon MVP handles no real
  money. Badges and gift cards (via a third-party API) are the safe
  default prize types.

Decisions (see Vision Document §10 for full log — RESOLVED as of July 2026):
- Verification: originator/proxy confirms; photo/video optional supporting
  evidence; confirmer cannot confirm own entries
- Confirmation timing: originator's choice per-challenge (per-entry or
  completion-only)
- Dispute path (Phase 0): confirmer's word is final
- Circle join model: invite code (room-code style, like Pandora Bingo)
- Badge system: small in-house badge set for Phase 0
- Public board: Circle-scoped only until Phase 1 (no public visibility yet)
- Cash prizes: still gated behind legal consult — no change
- Naming: "Circles" confirmed, no rename
```

---

## First Message to Send in the New Project

Once the project is created and the instructions above are pasted in, a good opening message is something like:

> I've set up this project for Agon, the new challenge/prize app. I've attached the Vision Document. Let's start with [whichever open question from §10 you want to resolve first] — walk me through the tradeoffs.

Attaching the `Agon_Vision_Document.md` file to the project's knowledge (or to that first message) means Claude has the full reasoning behind the roadmap and legal notes available without you re-explaining it each session.

## Suggested First Few Sessions

1. **~~Resolve the open decisions in Vision Document §10~~ — DONE (July 2026).** See the Decisions Log in §10 and the summary above.
2. **Scaffold the repo (next up)** — `agon` repo, `README_agon.md`, Postgres schema draft from §9 (now includes `confirmation_timing`), auth provider chosen and wired up.
3. **Build the Phase 0 slice** — Circle creation/join, challenge creation, join challenge, mark progress, leaderboard, badge prizes only. No money code at all.
4. **Family beta** — get it in front of a few relatives, collect feedback, iterate.
5. **Before touching Phase 2 (cash prizes):** schedule the legal consult referenced in Vision Document §7, then come back to Claude with the outcome to design the actual payment flow around whatever structure counsel approves.

## Housekeeping Reminders (matching Pandora Bingo habits)

- Update the Project's memory/instructions block as real decisions get made — the placeholder stack/roadmap above should get replaced with "what's actually true" over time, same as the Pandora Bingo project's memory has evolved through its versions.
- Keep a `README_agon.md` version log at the top, same format Pandora Bingo uses (version number, bullet of what shipped, roadmap section at the bottom).
- Consider an `archive.sh` script early, even before it's needed — cheap to set up now, useful the first time a milestone is worth freezing.
