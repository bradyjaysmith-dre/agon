import { clerkClient, getAuth, requireAuth } from '@clerk/express';
import { pool } from '../db.js';

// Chain: verifies the Clerk session, then upserts a local `users` row keyed
// by clerk_user_id so the rest of the app can join against integer ids.
export const requireUser = [
  requireAuth(),
  async (req, res, next) => {
    const { userId } = getAuth(req);
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
