import { Router } from 'express';
import { pool } from '../db.js';
import { requireUser } from '../middleware/ensureUser.js';

const router = Router();

router.get('/', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM badges ORDER BY id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, ub.challenge_id, ub.awarded_at
       FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.awarded_at DESC`,
      [req.dbUser.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
