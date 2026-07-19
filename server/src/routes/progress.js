import { Router } from 'express';
import { pool } from '../db.js';
import { requireUser } from '../middleware/ensureUser.js';
import { loadChallengeForMember } from './challenges.js';

const router = Router();

router.post('/challenges/:id/progress', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge, membership } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });
    if (challenge.challenge_type !== 'simple_progress') {
      return res.status(400).json({ error: 'This challenge type does not support progress logging' });
    }
    if (challenge.status !== 'active') {
      return res.status(400).json({ error: `Challenge is ${challenge.status}, not accepting progress` });
    }

    const participantRes = await pool.query(
      `SELECT 1 FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2`,
      [challengeId, req.dbUser.id]
    );
    if (!participantRes.rows.length) {
      return res.status(403).json({ error: 'Join the challenge before logging progress' });
    }

    const { value, description, proofUrl } = req.body ?? {};
    const { rows } = await pool.query(
      `INSERT INTO progress_entries (challenge_id, user_id, value, description, proof_url, reported_by)
       VALUES ($1, $2, $3, $4, $5, $2)
       RETURNING *`,
      [challengeId, req.dbUser.id, value ?? null, description ?? null, proofUrl ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:entryId/confirm', requireUser, async (req, res, next) => {
  try {
    const entryId = Number(req.params.entryId);
    const entryRes = await pool.query('SELECT * FROM progress_entries WHERE id = $1', [entryId]);
    const entry = entryRes.rows[0];
    if (!entry) return res.status(404).json({ error: 'Progress entry not found' });

    if (entry.user_id === req.dbUser.id) {
      return res.status(403).json({ error: 'Confirmers cannot confirm their own entries' });
    }

    const challengeRes = await pool.query('SELECT status FROM challenges WHERE id = $1', [entry.challenge_id]);
    if (challengeRes.rows[0].status !== 'active') {
      return res.status(400).json({ error: `Challenge is ${challengeRes.rows[0].status}, cannot confirm entries` });
    }

    const confirmerRes = await pool.query(
      `SELECT 1 FROM challenge_confirmers WHERE challenge_id = $1 AND user_id = $2`,
      [entry.challenge_id, req.dbUser.id]
    );
    if (!confirmerRes.rows.length) {
      return res.status(403).json({ error: 'Not a confirmer for this challenge' });
    }

    const { rows } = await pool.query(
      `UPDATE progress_entries SET confirmed_by = $1, confirmed_at = now() WHERE id = $2 RETURNING *`,
      [req.dbUser.id, entryId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/challenges/:id/leaderboard', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge, membership } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });
    if (challenge.challenge_type !== 'simple_progress') {
      return res.status(400).json({ error: 'This challenge type does not have a leaderboard' });
    }

    const { rows } = await pool.query(
      `SELECT u.id AS user_id, u.name,
              COALESCE(SUM(pe.value) FILTER (WHERE pe.confirmed_by IS NOT NULL), 0) AS confirmed_value,
              COUNT(pe.id) FILTER (WHERE pe.confirmed_by IS NOT NULL) AS confirmed_entries
       FROM challenge_participants cp
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN progress_entries pe ON pe.challenge_id = cp.challenge_id AND pe.user_id = cp.user_id
       WHERE cp.challenge_id = $1 AND cp.status = 'active'
       GROUP BY u.id, u.name
       ORDER BY confirmed_value DESC, confirmed_entries DESC`,
      [challengeId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
