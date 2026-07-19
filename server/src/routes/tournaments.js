import { Router } from 'express';
import { pool } from '../db.js';
import { requireUser } from '../middleware/ensureUser.js';
import { loadChallengeForMember } from './challenges.js';

const router = Router();

function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fills the appropriate slot of the next round's match with `winnerId`, and
// promotes that match to 'ready' once both its slots are filled. Shared by
// bye resolution at generation time and by human-recorded results, so both
// paths advance the bracket identically. No-op past the final round.
async function propagateWinner(client, { challengeId, round, matchIndex, winnerId }, totalRounds) {
  if (round >= totalRounds) return;
  const nextRound = round + 1;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const slot = matchIndex % 2 === 0 ? 'participant1_id' : 'participant2_id';

  const { rows } = await client.query(
    `UPDATE tournament_matches SET ${slot} = $1
     WHERE challenge_id = $2 AND round = $3 AND match_index = $4
     RETURNING *`,
    [winnerId, challengeId, nextRound, nextMatchIndex]
  );
  const nextMatch = rows[0];
  if (nextMatch.participant1_id && nextMatch.participant2_id && nextMatch.status === 'pending') {
    await client.query(`UPDATE tournament_matches SET status = 'ready' WHERE id = $1`, [nextMatch.id]);
  }
}

router.post('/challenges/:id/start', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const challengeRes = await pool.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
    const challenge = challengeRes.rows[0];
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can start the tournament' });
    }
    if (challenge.challenge_type !== 'tournament_bracket') {
      return res.status(400).json({ error: 'Not a tournament challenge' });
    }
    if (challenge.status !== 'active') {
      return res.status(400).json({ error: 'Challenge is not active' });
    }

    const existingRes = await pool.query(
      'SELECT 1 FROM tournament_matches WHERE challenge_id = $1 LIMIT 1',
      [challengeId]
    );
    if (existingRes.rows.length) {
      return res.status(409).json({ error: 'Tournament has already started' });
    }

    const participantsRes = await pool.query(
      `SELECT user_id FROM challenge_participants WHERE challenge_id = $1 AND status = 'active'`,
      [challengeId]
    );
    const participantIds = participantsRes.rows.map((r) => r.user_id);
    if (participantIds.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 participants to start a tournament' });
    }

    const confirmersRes = await pool.query(
      `SELECT user_id FROM challenge_confirmers WHERE challenge_id = $1`,
      [challengeId]
    );
    const participantSet = new Set(participantIds);
    const hasOutsideConfirmer = confirmersRes.rows.some((c) => !participantSet.has(c.user_id));
    if (!hasOutsideConfirmer) {
      return res.status(400).json({
        error:
          "Add a confirmer who isn't playing before starting the tournament (a confirmer can't record the outcome of their own match).",
      });
    }

    const bracketSize = nextPowerOfTwo(participantIds.length);
    const totalRounds = Math.log2(bracketSize);
    const shuffled = shuffle(participantIds);
    const slots = Array(bracketSize).fill(null);
    for (let i = 0; i < shuffled.length; i++) slots[i] = shuffled[i];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const round1Byes = [];
      for (let i = 0; i < bracketSize / 2; i++) {
        const p1 = slots[i];
        const p2 = slots[bracketSize - 1 - i];
        const isBye = !p1 || !p2;
        const status = isBye ? 'completed' : 'ready';
        const winnerId = isBye ? p1 ?? p2 : null;

        await client.query(
          `INSERT INTO tournament_matches (challenge_id, round, match_index, participant1_id, participant2_id, winner_id, status)
           VALUES ($1, 1, $2, $3, $4, $5, $6)`,
          [challengeId, i, p1, p2, winnerId, status]
        );
        if (isBye) round1Byes.push({ matchIndex: i, winnerId });
      }

      for (let round = 2; round <= totalRounds; round++) {
        const numMatches = bracketSize / 2 ** round;
        for (let matchIndex = 0; matchIndex < numMatches; matchIndex++) {
          await client.query(
            `INSERT INTO tournament_matches (challenge_id, round, match_index, status)
             VALUES ($1, $2, $3, 'pending')`,
            [challengeId, round, matchIndex]
          );
        }
      }

      for (const bye of round1Byes) {
        await propagateWinner(
          client,
          { challengeId, round: 1, matchIndex: bye.matchIndex, winnerId: bye.winnerId },
          totalRounds
        );
      }

      await client.query('COMMIT');
      res.status(204).end();
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Tournament has already started' });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.get('/challenges/:id/bracket', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge, membership } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

    const { rows } = await pool.query(
      `SELECT tm.*, p1.name AS participant1_name, p2.name AS participant2_name, w.name AS winner_name
       FROM tournament_matches tm
       LEFT JOIN users p1 ON p1.id = tm.participant1_id
       LEFT JOIN users p2 ON p2.id = tm.participant2_id
       LEFT JOIN users w ON w.id = tm.winner_id
       WHERE tm.challenge_id = $1
       ORDER BY tm.round, tm.match_index`,
      [challengeId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/matches/:matchId/result', requireUser, async (req, res, next) => {
  try {
    const matchId = Number(req.params.matchId);
    const { winnerId } = req.body ?? {};
    if (!winnerId) return res.status(400).json({ error: 'winnerId is required' });

    const matchRes = await pool.query('SELECT * FROM tournament_matches WHERE id = $1', [matchId]);
    const match = matchRes.rows[0];
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const { challenge, membership } = await loadChallengeForMember(match.challenge_id, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

    const confirmerRes = await pool.query(
      `SELECT 1 FROM challenge_confirmers WHERE challenge_id = $1 AND user_id = $2`,
      [match.challenge_id, req.dbUser.id]
    );
    if (!confirmerRes.rows.length) {
      return res.status(403).json({ error: 'Not a confirmer for this challenge' });
    }
    if (req.dbUser.id === match.participant1_id || req.dbUser.id === match.participant2_id) {
      return res.status(403).json({ error: "Confirmers can't record the outcome of their own match" });
    }
    if (winnerId !== match.participant1_id && winnerId !== match.participant2_id) {
      return res.status(400).json({ error: 'winnerId must be one of the two match participants' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE tournament_matches
         SET winner_id = $1, status = 'completed', recorded_by = $2, recorded_at = now()
         WHERE id = $3 AND status = 'ready'
         RETURNING *`,
        [winnerId, req.dbUser.id, matchId]
      );
      if (!updateRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Match already recorded or not ready yet' });
      }
      const updatedMatch = updateRes.rows[0];

      const totalRoundsRes = await client.query(
        `SELECT MAX(round) AS total_rounds FROM tournament_matches WHERE challenge_id = $1`,
        [match.challenge_id]
      );
      const totalRounds = totalRoundsRes.rows[0].total_rounds;

      if (updatedMatch.round >= totalRounds) {
        await client.query(`UPDATE challenges SET status = 'completed' WHERE id = $1`, [match.challenge_id]);
        await client.query(
          `INSERT INTO user_badges (user_id, badge_id, challenge_id)
           SELECT $1, id, $2 FROM badges WHERE name = 'First Win'
           ON CONFLICT DO NOTHING`,
          [winnerId, match.challenge_id]
        );
      } else {
        await propagateWinner(
          client,
          { challengeId: match.challenge_id, round: updatedMatch.round, matchIndex: updatedMatch.match_index, winnerId },
          totalRounds
        );
      }

      await client.query('COMMIT');
      res.json(updatedMatch);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

export default router;
