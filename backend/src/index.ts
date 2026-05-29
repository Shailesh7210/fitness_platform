import express    from 'express';
import cors       from 'cors';
import dotenv     from 'dotenv';
import { connectDB }   from './config/db';
import authRoutes      from './routes/auth';
import userRoutes      from './routes/users';
import adminUserRoutes from './routes/admin/users';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin:      'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/admin/users', adminUserRoutes);

// ── Health check ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Start ────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

start();