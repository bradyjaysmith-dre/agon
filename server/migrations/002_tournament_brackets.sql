-- Phase 1: customizable challenge types, starting with single-elimination
-- tournament brackets alongside the existing simple_progress type.

ALTER TABLE challenges ADD COLUMN challenge_type TEXT NOT NULL DEFAULT 'simple_progress'
  CHECK (challenge_type IN ('simple_progress', 'tournament_bracket'));

-- Full bracket shape (all rounds) is pre-created at start time; later-round
-- rows begin with both participant slots null and get filled in as earlier
-- matches are decided. Byes are resolved immediately at generation time.
CREATE TABLE tournament_matches (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  participant1_id INTEGER REFERENCES users(id),
  participant2_id INTEGER REFERENCES users(id),
  winner_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'completed')),
  recorded_by INTEGER REFERENCES users(id),
  recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, round, match_index),
  CHECK (recorded_by IS NULL OR (recorded_by <> participant1_id AND recorded_by <> participant2_id)),
  CHECK (winner_id IS NULL OR winner_id IN (participant1_id, participant2_id))
);
