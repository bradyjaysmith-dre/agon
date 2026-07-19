import { Router } from 'express';
import { pool } from '../db.js';
import { requireUser } from '../middleware/ensureUser.js';
import { loadMembership } from './circles.js';

const router = Router();

router.post('/circles/:circleId/challenges', requireUser, async (req, res, next) => {
  try {
    const circleId = Number(req.params.circleId);
    if (!(await loadMembership(circleId, req.dbUser.id))) {
      return res.status(403).json({ error: 'Not a member of this circle' });
    }

    const {
      title,
      description,
      confirmationTiming = 'completion_only',
      challengeType = 'simple_progress',
      startAt,
      endAt,
    } = req.body ?? {};
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
    if (!['per_entry', 'completion_only'].includes(confirmationTiming)) {
      return res.status(400).json({ error: 'confirmationTiming must be per_entry or completion_only' });
    }
    if (!['simple_progress', 'tournament_bracket'].includes(challengeType)) {
      return res.status(400).json({ error: 'challengeType must be simple_progress or tournament_bracket' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO challenges
           (circle_id, originator_id, title, description, confirmation_timing, challenge_type, start_at, end_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          circleId,
          req.dbUser.id,
          title.trim(),
          description ?? null,
          confirmationTiming,
          challengeType,
          startAt ?? null,
          endAt ?? null,
        ]
      );
      const challenge = rows[0];

      // Originator is a confirmer by default, and joins as a participant.
      await client.query(
        `INSERT INTO challenge_confirmers (challenge_id, user_id, added_by) VALUES ($1, $2, $2)`,
        [challenge.id, req.dbUser.id]
      );
      await client.query(
        `INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2)`,
        [challenge.id, req.dbUser.id]
      );

      await client.query('COMMIT');
      res.status(201).json(challenge);
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

router.get('/circles/:circleId/challenges', requireUser, async (req, res, next) => {
  try {
    const circleId = Number(req.params.circleId);
    if (!(await loadMembership(circleId, req.dbUser.id))) {
      return res.status(403).json({ error: 'Not a member of this circle' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM challenges WHERE circle_id = $1 ORDER BY created_at DESC`,
      [circleId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

async function loadChallengeForMember(challengeId, userId) {
  const { rows } = await pool.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
  const challenge = rows[0];
  if (!challenge) return { challenge: null, membership: null };
  const membership = await loadMembership(challenge.circle_id, userId);
  return { challenge, membership };
}

router.get('/:id', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge, membership } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

    const [participants, confirmers, entries, circleMembers] = await Promise.all([
      pool.query(
        `SELECT u.id, u.name, cp.status, cp.joined_at
         FROM challenge_participants cp JOIN users u ON u.id = cp.user_id
         WHERE cp.challenge_id = $1 ORDER BY cp.joined_at`,
        [challengeId]
      ),
      pool.query(
        `SELECT u.id, u.name
         FROM challenge_confirmers cc JOIN users u ON u.id = cc.user_id
         WHERE cc.challenge_id = $1`,
        [challengeId]
      ),
      pool.query(
        `SELECT pe.*, u.name AS user_name, cu.name AS confirmed_by_name
         FROM progress_entries pe
         JOIN users u ON u.id = pe.user_id
         LEFT JOIN users cu ON cu.id = pe.confirmed_by
         WHERE pe.challenge_id = $1
         ORDER BY pe.created_at DESC`,
        [challengeId]
      ),
      pool.query(
        `SELECT u.id, u.name
         FROM circle_members cm JOIN users u ON u.id = cm.user_id
         WHERE cm.circle_id = $1 ORDER BY u.name`,
        [challenge.circle_id]
      ),
    ]);

    res.json({
      ...challenge,
      currentUserId: req.dbUser.id,
      isConfirmer: confirmers.rows.some((c) => c.id === req.dbUser.id),
      participants: participants.rows,
      confirmers: confirmers.rows,
      entries: entries.rows,
      circleMembers: circleMembers.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can edit a challenge' });
    }

    const { title, description, confirmationTiming } = req.body ?? {};
    const setClauses = [];
    const values = [];

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'title cannot be empty' });
      values.push(title.trim());
      setClauses.push(`title = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      setClauses.push(`description = $${values.length}`);
    }
    if (confirmationTiming !== undefined) {
      if (challenge.challenge_type !== 'simple_progress') {
        return res.status(400).json({ error: 'confirmationTiming only applies to simple_progress challenges' });
      }
      if (!['per_entry', 'completion_only'].includes(confirmationTiming)) {
        return res.status(400).json({ error: 'confirmationTiming must be per_entry or completion_only' });
      }
      values.push(confirmationTiming);
      setClauses.push(`confirmation_timing = $${values.length}`);
    }
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }

    values.push(challengeId);
    const { rows } = await pool.query(
      `UPDATE challenges SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/join', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge, membership } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });
    if (challenge.status !== 'active') {
      return res.status(400).json({ error: `Challenge is ${challenge.status}, not accepting new participants` });
    }

    if (challenge.challenge_type === 'tournament_bracket') {
      const startedRes = await pool.query(
        'SELECT 1 FROM tournament_matches WHERE challenge_id = $1 LIMIT 1',
        [challengeId]
      );
      if (startedRes.rows.length) {
        return res.status(400).json({ error: 'Tournament has already started, new participants cannot join' });
      }
    }

    await pool.query(
      `INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2)
       ON CONFLICT (challenge_id, user_id) DO NOTHING`,
      [challengeId, req.dbUser.id]
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/confirmers', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can add confirmers' });
    }

    const { userId } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const targetMembership = await loadMembership(challenge.circle_id, userId);
    if (!targetMembership) {
      return res.status(400).json({ error: 'That user is not a member of this circle' });
    }

    await pool.query(
      `INSERT INTO challenge_confirmers (challenge_id, user_id, added_by) VALUES ($1, $2, $3)
       ON CONFLICT (challenge_id, user_id) DO NOTHING`,
      [challengeId, userId, req.dbUser.id]
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can complete a challenge' });
    }
    if (challenge.challenge_type === 'tournament_bracket') {
      return res.status(400).json({
        error: 'Tournament challenges complete automatically when the final match is recorded',
      });
    }
    if (challenge.status !== 'active') {
      return res.status(400).json({ error: `Challenge is ${challenge.status}, cannot be completed` });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE challenges SET status = 'completed' WHERE id = $1`, [challengeId]);
      // Award "First Win" to any participant with at least one confirmed entry.
      await client.query(
        `INSERT INTO user_badges (user_id, badge_id, challenge_id)
         SELECT DISTINCT pe.user_id, b.id, $1
         FROM progress_entries pe, badges b
         WHERE pe.challenge_id = $1 AND pe.confirmed_by IS NOT NULL AND b.name = 'First Win'
         ON CONFLICT DO NOTHING`,
        [challengeId]
      );
      await client.query('COMMIT');
      res.status(204).end();
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

router.post('/:id/pause', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can pause a challenge' });
    }
    const { rows } = await pool.query(
      `UPDATE challenges SET status = 'paused' WHERE id = $1 AND status = 'active' RETURNING *`,
      [challengeId]
    );
    if (!rows.length) return res.status(400).json({ error: 'Only an active challenge can be paused' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resume', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can resume a challenge' });
    }
    const { rows } = await pool.query(
      `UPDATE challenges SET status = 'active' WHERE id = $1 AND status = 'paused' RETURNING *`,
      [challengeId]
    );
    if (!rows.length) return res.status(400).json({ error: 'Only a paused challenge can be resumed' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can cancel a challenge' });
    }
    if (challenge.status === 'cancelled' || challenge.status === 'completed') {
      return res.status(400).json({ error: `Challenge is already ${challenge.status}` });
    }
    const { rows } = await pool.query(
      `UPDATE challenges SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [challengeId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can delete a challenge' });
    }
    // Cascades to participants, confirmers, progress_entries, tournament_matches;
    // user_badges.challenge_id is set to NULL rather than the badge being deleted.
    await pool.query('DELETE FROM challenges WHERE id = $1', [challengeId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/restart', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can restart a challenge' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Participants and confirmers stay -- only the outcome/progress resets.
      if (challenge.challenge_type === 'simple_progress') {
        await client.query('DELETE FROM progress_entries WHERE challenge_id = $1', [challengeId]);
      } else if (challenge.challenge_type === 'tournament_bracket') {
        await client.query('DELETE FROM tournament_matches WHERE challenge_id = $1', [challengeId]);
      }
      await client.query('DELETE FROM user_badges WHERE challenge_id = $1', [challengeId]);
      const { rows } = await client.query(
        `UPDATE challenges SET status = 'active' WHERE id = $1 RETURNING *`,
        [challengeId]
      );
      await client.query('COMMIT');
      res.json(rows[0]);
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

router.post('/:id/participants/:userId/kick', requireUser, async (req, res, next) => {
  try {
    const challengeId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);
    const { challenge } = await loadChallengeForMember(challengeId, req.dbUser.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.originator_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Only the originator can remove participants' });
    }
    if (targetUserId === req.dbUser.id) {
      return res.status(400).json({ error: 'The originator cannot remove themselves' });
    }
    if (challenge.challenge_type === 'tournament_bracket') {
      const startedRes = await pool.query(
        'SELECT 1 FROM tournament_matches WHERE challenge_id = $1 LIMIT 1',
        [challengeId]
      );
      if (startedRes.rows.length) {
        return res.status(400).json({ error: "Can't remove a participant after the tournament has started" });
      }
    }

    const { rows } = await pool.query(
      `UPDATE challenge_participants SET status = 'disqualified'
       WHERE challenge_id = $1 AND user_id = $2 RETURNING *`,
      [challengeId, targetUserId]
    );
    if (!rows.length) return res.status(404).json({ error: 'That user is not a participant' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export { loadChallengeForMember };
export default router;
