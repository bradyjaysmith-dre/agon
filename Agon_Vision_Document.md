# Agon — Vision Document

**Tagline:** *Brought to you by the creators of Pandora Bingo*

---

## 1. What Agon Is

Agon is a platform for posting and joining challenges — of any kind — either to a public board or to a curated group of friends/family ("Circles"). A challenge can be almost anything: a fitness feat, a game-of-skill tournament, a savings goal, a trivia gauntlet, a home-improvement race, a step-count contest. The person who creates a challenge (the **originator**) sets the rules, decides who can join, and optionally attaches a prize — a badge, a gift card, or real cash pooled from entrants and paid out to winners.

The name fits: *agon* (ἀγών) is the Greek root for "contest" or "struggle for victory" — the word origin of "agony" and "protagonist." It's a fitting sibling to Pandora Bingo without copying its branding.

## 2. Why This, Why Now

Pandora Bingo proved out a pattern that works well for Dre's household and extended circle: real-time, social, low-friction, phone-first games that turn an ordinary evening into a shared event. Agon generalizes that pattern beyond music trivia into *any* contest — the family step-count challenge, the March Madness pool, the "who can save $500 fastest" challenge, the backyard cornhole bracket. It reuses the same muscle (Dre building and operating a small real-time social app) but adds a new, harder layer: **real money changing hands**, which raises the stakes on security, legal compliance, and reliability considerably above Pandora Bingo's.

## 3. Core Concept & Mechanics

### Challenges
- Created by an individual or a team ("originator").
- Free-form: physical feat, game of skill, financial goal, creative competition — anything the originator defines, subject to legal and moral limits (see §7).
- Originator defines: rules, how winners/top achievers are determined, verification method (self-report, judge/originator confirms, photo/video proof, integration with a tracker), duration, and eligibility.

### Visibility & Access
- **Public board** — open, discoverable challenges anyone on the platform can find and join.
- **Circles** — curated groups (family, friends, a team) where challenges are visible only to members. A user can belong to multiple Circles.
- **Eligibility restrictions** — originator can restrict entry by invitation, by Circle membership, or by other criteria the app supports (age band, location, etc.), always within legal and platform-policy limits.

### Prizes
- **Non-tangible** — badges, titles, leaderboard recognition, in-app achievements. No regulatory complexity; this is the safe default and likely the whole prize model for the family-beta MVP.
- **Gift cards** — distributed via app or email, using a third-party gift card API rather than the app minting value itself.
- **Cash** — deposited into the platform and distributed to winners. This is the highest-complexity option and the one most likely to trigger money-transmitter and gambling-law obligations (see §7). Recommend deferring this to a post-MVP phase, launched only after the entry-fee model and payout mechanism have been reviewed against §7.

### Entry / Prize-Pool Contribution
- Originator can optionally require entrants to pay into a prize pool to join.
- This single feature is the one most likely to change Agon's legal classification (below), so it should be a distinctly gated feature, off by default, and possibly restricted to Circles-only challenges at first rather than the public board.

## 4. Personas

- **Family beta user (Phase 0–1):** A relative who already plays Pandora Bingo. Low technical patience, phone-only, wants something fun and low-stakes. Prize = bragging rights or a badge.
- **Circle organizer:** Runs a recurring challenge for a defined group (extended family fitness challenge, friend group fantasy pool). Wants reliable tracking and fair, transparent scoring.
- **Public participant (later phase):** A stranger discovering a public challenge. Requires stronger identity verification, fraud protections, and — if money is involved — KYC before payout.

## 5. Phased Roadmap

### Phase 0 — Family Beta (MVP)
Goal: get extended family playing and testing within a few weeks, with minimum legal/financial surface area.
- Auth: secure email/password + optional social login (see §6).
- Create a challenge (title, description, rules text, start/end date, verification method = originator/proxy confirms, with optional photo/video proof as supporting evidence — see §10.1).
- Circles: create/join a family Circle by invite code (same pattern as Pandora Bingo's room codes — familiar and cheap to build).
- Join a challenge (Circle-only; public board can wait).
- Track progress / mark yourself or others as having completed a goal.
- Leaderboard / standings per challenge.
- Prizes: **non-tangible only** (badges/titles). No money, no gift cards, in this phase.
- Basic push/email notifications (challenge starting, ending, someone joined).

### Phase 1 — Hardening & Gift Cards
- Add gift-card prizes via a third-party provider (e.g., Tremendous, Tango Card) — the app never touches the value itself, just triggers a payout API call.
- Add public board (discoverable challenges) with moderation/reporting tools.
- Add proof-of-completion uploads (photo/video) and originator/judge approval flow.
- Expand eligibility rules (invitation-only, open, age-gated where required).
- Start formal legal review before touching cash (see §7) if cash prizes are still a goal.

### Phase 2 — Cash Prize Pools (conditional on legal review)
- Entry-fee-funded prize pools, held via a compliant payment structure (see §7/§8) — likely Stripe Connect or an equivalent embedded-finance partner rather than a self-built ledger.
- Clear, state-aware rules preventing challenge types/structures that would classify Agon as running a lottery.
- KYC on payout recipients above reporting thresholds; 1099 handling for U.S. winners as required.

### Phase 3 — App Store Readiness (both Agon and Pandora Bingo)
- Mobile app shell (React Native/Expo — see §8) replacing or wrapping the web app.
- Store-compliant policies: privacy policy, terms of service, account deletion flow, in-app purchase rules if gift cards/cash are sold as "entries" (Apple in particular restricts real-money contest mechanics — needs explicit review against current App Store/Play Store guidelines before submission).
- Production-grade auth, monitoring, backups, and support flow for a non-family public audience.

## 6. Non-Functional Requirements — Security & Auth

Dre flagged this as needing to be "robust and secure" from day one. Recommended baseline for Phase 0, sized appropriately (not overbuilt for a family beta, but not casual either since it's the seed of a public, money-handling app):

- **Use a managed auth provider** rather than hand-rolling password storage — e.g., Clerk, Auth0, Supabase Auth, or Firebase Auth. This buys password hashing, session management, social login, email verification, and MFA essentially for free, and it's the kind of infrastructure that's expensive to retrofit once money is flowing through the app.
- **MFA available from day one** (even if optional at first), required later for any account that can create cash-prize challenges or receive payouts.
- **Session handling:** short-lived access tokens + refresh tokens, not long-lived plain sessions in localStorage.
- **Least-privilege roles:** originator, participant, Circle admin, platform admin — enforced server-side, not just hidden in the UI.
- **Audit trail** on anything touching money or prize distribution, even in Phase 0 design (schema-level, doesn't need to be built out yet).

## 7. Legal & Compliance Considerations

*Not legal advice — this section is a starting map for a conversation with an actual attorney before any cash or entry-fee feature ships. Treat every claim below as "here's the general shape of the law," not a green light.*

### Skill vs. chance vs. lottery
U.S. gambling law generally turns on three elements: **prize, chance, and consideration**. When all three are present together, the arrangement is typically treated as an illegal lottery unless run by a state-authorized operator. A **skill contest** is the standard escape valve — it keeps the prize and the consideration (entry fee) but removes chance from how the winner is determined. That's the load-bearing design constraint for any Agon challenge that both charges an entry fee and pays a cash prize: the outcome has to be genuinely, defensibly skill-determined, not luck-determined.

States don't agree on *how much* chance is too much. Most apply a **"predominant factor" test**, tolerating some incidental chance as long as skill (knowledge, dexterity, practice) is the dominant driver of who wins. A minority of states apply a much stricter **"any chance" test**, where even a small chance element can make the activity illegal gambling regardless of how much skill is involved. This matters for Agon because the platform is meant to host *any* kind of challenge — an essay or coding contest is clearly skill-based; a "guess the winner" or randomized-draw challenge is not; a lot of real-world challenges (fitness goals, sports brackets, trivia) sit in a gray zone depending on exactly how the rules are written.

### Entry fees funding the prize pool
This is the specific mechanic Dre described — requiring entrants to pay into the prize pool — and it's the part most likely to draw legal scrutiny. Courts are split on it. Some treat paying an entry fee for a shot at a skill-based prize as an ordinary, long-accepted part of American social life. Others have held that when entry fees are directly earmarked to fund the prize amount, that link itself creates a "wager," which can push the activity into illegal-gambling territory even when skill genuinely predominates. Some states go further still and require that prizes come from a source other than pooled entry fees, and that the platform not keep any percentage of the money changing hands.

Practical implication: the safest design for Phase 2 is one where Agon **never takes a percentage/rake** of entry fees, and ideally doesn't structure prizes as a strict dollar-for-dollar pass-through of pooled entry money. An attorney should confirm what structure is defensible in Utah specifically, and in any other state where family or friends might participate.

### Money transmission
Separately from gambling law, if Agon **ever holds user funds — even briefly — before forwarding them to a winner**, that generally triggers money-transmitter licensing obligations at the state level and registration with FinCEN federally. The trigger is *control* of funds, not duration — even momentary pooling before forwarding is typically enough to count as custody in regulators' eyes; if a system can pause, pool, or reroute funds it controls, that's treated as money transmission.

The practical way to avoid building and licensing a money-transmission business from scratch is to **not be the one holding the funds** — route any cash prize pool through a licensed third party (Stripe Connect or a similar payment-facilitator/embedded-finance platform) that already carries the relevant licenses, rather than pooling money in Agon's own bank account and disbursing it manually. Processors that move money directly between payer and payee without holding it can sometimes avoid money-transmitter status themselves, but that exemption is narrow, varies by state, and is easy to lose through design choices Agon would naturally make (e.g., letting a prize pool sit open for the duration of a challenge). Confirm the specific mechanism with counsel before launch — "we're just using Stripe" is not automatically a full answer on its own.

### Utah-specific and other jurisdictional notes
State law on skill-contest entry fees and lottery classification varies meaningfully by state, and a national or public-board version of Agon would need per-state review before opening cash challenges broadly. For the Phase 0–1 family beta this is low-risk — small, private, non-tangible or gift-card-only prizes, all participants known to Dre — but it becomes the central open question the moment cash prize pools and/or the public board go live. A short, scoped consult with a Utah-licensed attorney familiar with gaming/contest law (not general practice) before Phase 2 begins is likely to be cheap insurance relative to redesigning the payment system after the fact.

### Store policy overlay (Phase 3)
Apple and Google both apply extra scrutiny to real-money contest mechanics inside apps distributed through their stores; whatever structure is legally sound may still need adjustment to satisfy each store's specific policies (e.g., how entry fees are framed, whether they're processed as in-app purchases or external payments). This needs a fresh policy check at Phase 3 time, since store rules change independently of the law.

## 8. Technology Recommendations

Agon's requirements diverge from Pandora Bingo's in two important ways: **data must persist reliably** (this is not an ephemeral game room — challenges, standings, and money records need a real database from day one) and **the eventual target is native app stores**, not just a mobile-friendly web page.

| Layer | Pandora Bingo (for reference) | Agon recommendation |
|---|---|---|
| Frontend (Phase 0–1) | React + Vite, web/PWA | React + Vite web app is fine to start (fast to build, matches Dre's existing skills) |
| Frontend (Phase 3) | N/A | React Native (via Expo) — lets most business logic and a good chunk of UI code be shared with the web app, and produces real iOS/Android store builds without a full rewrite |
| Backend | Node/Express + Socket.io, in-memory state | Node/Express, same comfort zone — but **backed by a real relational database** from day one (see below), with Socket.io only where genuinely real-time (live leaderboards, notifications) |
| Database | JSON/SQLite on a Railway volume | **Postgres** (Railway supports this natively) — challenges, users, Circles, entries, and any financial records need transactional integrity and querying that SQLite-on-a-volume isn't well suited for at this scope |
| Auth | Custom localStorage identity (fine for ephemeral game rooms) | Managed auth provider (Clerk, Auth0, or Supabase Auth) — see §6 |
| Payments (Phase 1) | N/A | Gift-card disbursement API (Tremendous or Tango Card) |
| Payments (Phase 2) | N/A | Stripe Connect (or equivalent) for any cash prize pool, so Agon never directly custodies funds — see §7 |
| Hosting | Railway | Railway is fine to continue with through Phase 1–2; revisit at Phase 3 if scale or compliance needs (e.g., SOC 2 for a payments-adjacent product) outgrow it |

## 9. Data Model Sketch (starting point, not final)

- **users** — id, name, email, auth provider id, verification status, created_at
- **circles** — id, name, owner_id, invite_code, created_at
- **circle_members** — circle_id, user_id, role (member/admin), joined_at
- **challenges** — id, originator_id, circle_id (nullable = public), title, description/rules, verification_method, confirmation_timing (per_entry/completion_only — set by originator, see §10.1a), start_at, end_at, entry_type (free/invite/paid), entry_fee_amount (nullable), status
- **challenge_participants** — challenge_id, user_id, joined_at, status (active/withdrawn/disqualified)
- **progress_entries** — id, challenge_id, user_id, value/description, proof_url (nullable), reported_by, confirmed_by (nullable — must reference a valid confirmer per `challenge_confirmers`, and cannot equal `user_id`; see §10.1), created_at
- **challenge_confirmers** — challenge_id, user_id, added_by, created_at *(originator is a confirmer by default; originator can delegate confirmation duty to one or more proxies — added to avoid the originator becoming a bottleneck on larger Circles)*
- **prizes** — id, challenge_id, type (badge/gift_card/cash), value, funding_source (originator/entry_pool), status
- **payouts** — id, prize_id, recipient_id, external_transaction_id, status, paid_at *(Phase 2+, lives outside Agon's own custody per §7)*
- **badges** — id, name, icon, description
- **user_badges** — user_id, badge_id, challenge_id, awarded_at

## 10. Decisions Log (formerly "Open Decisions") — RESOLVED as of July 2026

1. **Verification model — RESOLVED.** Originator (or a designated proxy) confirms progress/completion; photo/video proof is optional supporting evidence a confirmer can request or a participant can preemptively attach, not an auto-verifying mechanism on its own. This is a hybrid of "originator confirms" and "photo proof," not a third competing model — a human always makes the final call, and proof just makes that call easier and creates an audit trail. Requires a `challenge_confirmers` join table (see §9) so originators can delegate to proxies rather than becoming a bottleneck. Confirmers cannot confirm their own progress entries (avoids self-dealing, keeps the audit trail clean).

    - **1a. Confirmation timing — RESOLVED: originator's choice, set per-challenge.** When creating a challenge, the originator picks per-entry confirmation (every check-in — more fraud-resistant for cumulative goals like step counts or savings, higher confirmer workload) or completion-only confirmation (lighter workload, but mid-challenge fabrication may go uncaught until the end). Data model implication: `challenges` needs a `confirmation_timing` field (`per_entry` / `completion_only`).
    - **1b. Dispute path — RESOLVED: confirmer's word is final for Phase 0.** No appeal/second-proxy path in the MVP. Revisit if this causes friction in the family beta.
2. **Circle model — RESOLVED: invite code (room-code style).** Matches Pandora Bingo's existing pattern — familiar, cheap to build. Not a persistent friends-list model for Phase 0.
3. **Badge/achievement system — RESOLVED: small in-house badge set.** Build a starter set (e.g., "First Win," "Circle Founder," streak/participation badges) rather than shipping with only free-text prize descriptions. Gives the leaderboard/profile something concrete to display and gives family testers something to react to.
4. **Public board timing — RESOLVED: Circle-scoped only until Phase 1.** No public board visibility in the family beta, consistent with minimizing legal/financial surface area during Phase 0 (see §7).
5. **Cash prizes — go/no-go gate — RECONFIRMED, unchanged.** Stays gated behind an explicit legal consult before any entry-fee/payout code is written. No engineering effort against this until Dre confirms legal review has happened (see §7).
6. **Naming for "Circles" — RESOLVED: keep "Circles."** No rename to Leagues/Groups/Tribes.

## 11. Naming & Repo Conventions (to match Pandora Bingo's working setup)

- Repo: `agon` (mirrors `pandora-bingo`)
- README file: `README_agon.md` (Dre's established convention for distinguishing project READMEs across chat sessions)
- Deploy: Railway, auto-deploy on push to `main`; standard commit flow `git add . && git commit -m "message" && git push`
- Code delivery: git patch files (`format-patch`) applied locally with `git am`, same as Pandora Bingo, if Claude's sandbox again has read-only repo access
- Milestone snapshots: `archive.sh` (rsync-based) → `~/agon-milestones/<name>/`
- Build-time frontend deps in `dependencies` not `devDependencies` if using Railway/Nixpacks (same gotcha that bit Pandora Bingo)
