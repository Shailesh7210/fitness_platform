import express   from 'express';
import cors      from 'cors';
import dotenv    from 'dotenv';

import { connectDB } from './config/db';

// Phase 1
import authRoutes           from './routes/auth';
import userRoutes           from './routes/users';
import adminUserRoutes      from './routes/admin/users';

// Phase 2
import challengeRoutes      from './routes/challenges';
import leaderboardRoutes    from './routes/leaderboard';
import adminChallengeRoutes from './routes/admin/challenges';

// Phase 3
import nutritionRoutes      from './routes/nutrition';
import programRoutes        from './routes/programs';
import onboardingRoutes     from './routes/onboarding';
import deviceRoutes         from './routes/devices';
import adminProgramRoutes   from './routes/admin/programs';
import adminOnboardingRoutes from './routes/admin/onboarding';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────

// Phase 1
app.use('/api/auth',              authRoutes);
app.use('/api/users',             userRoutes);
app.use('/api/admin/users',       adminUserRoutes);

// Phase 2
app.use('/api/challenges',        challengeRoutes);
app.use('/api/leaderboard',       leaderboardRoutes);
app.use('/api/admin/challenges',  adminChallengeRoutes);

// Phase 3
app.use('/api/nutrition',         nutritionRoutes);
app.use('/api/programs',          programRoutes);
app.use('/api/onboarding',        onboardingRoutes);
app.use('/api/devices',           deviceRoutes);
app.use('/api/admin/programs',    adminProgramRoutes);
app.use('/api/admin/onboarding',  adminOnboardingRoutes);

// ── Health ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Start ────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();