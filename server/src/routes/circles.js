import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import { pool } from '../db.js';
import { requireUser } from '../middleware/ensureUser.js';

const router = Router();

// Excludes visually ambiguous characters (0/O, 1/I) for invite codes read
// aloud or typed on a phone.
const generateInviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

router.post('/', requireUser, async (req, res, next) => {
  try {
    const name = req.body?.name?.trim();
    if (!name) return res.status(400).json({ error: 'name is required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO circles (name, owner_id, invite_code) VALUES ($1, $2, $3) RETURNING *`,
        [name, req.dbUser.id, generateInviteCode()]
      );
      const circle = rows[0];
      await client.query(
        `INSERT INTO circle_members (circle_id, user_id, role) VALUES ($1, $2, 'admin')`,
        [circle.id, req.dbUser.id]
      );
      await client.query(
        `INSERT INTO user_badges (user_id, badge_id)
         SELECT $1, id FROM badges WHERE name = 'Circle Founder'
         ON CONFLICT DO NOTHING`,
        [req.dbUser.id]
      );
      await client.query('COMMIT');
      res.status(201).json(circle);
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

router.post('/join', requireUser, async (req, res, next) => {
  try {
    const code = req.body?.inviteCode?.trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'inviteCode is required' });

    const { rows } = await pool.query('SELECT * FROM circles WHERE invite_code = $1', [code]);
    if (!rows.length) return res.status(404).json({ error: 'Invalid invite code' });
    const circle = rows[0];

    await pool.query(
      `INSERT INTO circle_members (circle_id, user_id) VALUES ($1, $2)
       ON CONFLICT (circle_id, user_id) DO NOTHING`,
      [circle.id, req.dbUser.id]
    );
    res.json(circle);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cm.role
       FROM circles c
       JOIN circle_members cm ON cm.circle_id = c.id
       WHERE cm.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.dbUser.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

async function loadMembership(circleId, userId) {
  const { rows } = await pool.query(
    'SELECT role FROM circle_members WHERE circle_id = $1 AND user_id = $2',
    [circleId, userId]
  );
  return rows[0] ?? null;
}

router.get('/:id', requireUser, async (req, res, next) => {
  try {
    const circleId = Number(req.params.id);
    const membership = await loadMembership(circleId, req.dbUser.id);
    if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

    const circleRes = await pool.query('SELECT * FROM circles WHERE id = $1', [circleId]);
    if (!circleRes.rows.length) return res.status(404).json({ error: 'Circle not found' });

    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email, cm.role, cm.joined_at
       FROM circle_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.circle_id = $1
       ORDER BY cm.joined_at`,
      [circleId]
    );

    res.json({ ...circleRes.rows[0], role: membership.role, members: membersRes.rows });
  } catch (err) {
    next(err);
  }
});

export { loadMembership };
export default router;
