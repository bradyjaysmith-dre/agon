import { clerkClient, getAuth } from '@clerk/express';
import { pool } from '../db.js';

// requireAuth() from @clerk/express unconditionally redirects unauthenticated
// requests (built for server-rendered apps) — wrong for a JSON API, so we
// check getAuth() directly and return a proper 401 instead.
//
// Chain: verifies the Clerk session, then upserts a local `users` row keyed
// by clerk_user_id so the rest of the app can join against integer ids.
export const requireUser = [
  async (req, res, next) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const existing = await pool.query('SELECT * FROM users WHERE clerk_user_id = $1', [
        userId,
      ]);
      if (existing.rows.length) {
        req.dbUser = existing.rows[0];
        return next();
      }

      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        clerkUser.username ||
        email;

      const inserted = await pool.query(
        `INSERT INTO users (clerk_user_id, name, email) VALUES ($1, $2, $3)
         ON CONFLICT (clerk_user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
         RETURNING *`,
        [userId, name, email]
      );
      req.dbUser = inserted.rows[0];
      next();
    } catch (err) {
      next(err);
    }
  },
];
