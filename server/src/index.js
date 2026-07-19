import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import express from 'express';
import badgesRouter from './routes/badges.js';
import challengesRouter from './routes/challenges.js';
import circlesRouter from './routes/circles.js';
import progressRouter from './routes/progress.js';
import tournamentsRouter from './routes/tournaments.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Ahead of clerkMiddleware so infra health checks don't depend on Clerk keys being configured.
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(clerkMiddleware());

app.use('/api/circles', circlesRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/tournaments', tournamentsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Agon API listening on :${port}`));
